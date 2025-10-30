// Direct Gazette Scraping Script
// Alternative approach: Scrapes directly without needing API server

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simplified scraping function
// Added year filter to scrape specific year's gazettes
async function scrapeGazettes(limit = 50, targetYear = null) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    console.log('Navigating to Malaysian Federal Gazette...');
    await page.goto('https://lom.agc.gov.my/index.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait 3 seconds for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const gazettes = await page.evaluate((limit) => {
      const gazetteEntries = [];
      const rows = Array.from(document.querySelectorAll('table tr'));

      // Helper function to parse date from text
      const parseDate = (text) => {
        if (!text) return '';

        // Try to find date patterns in the text
        // Look for DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD patterns
        const datePatterns = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
          /(\d{1,2})-(\d{1,2})-(\d{4})/,    // DD-MM-YYYY
          /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
        ];

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            if (pattern.source.includes('^\\d{4}')) {
              // YYYY-MM-DD format
              return match[0];
            } else {
              // DD/MM/YYYY or DD-MM-YYYY
              const [, day, month, year] = match;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }

        // If no date found, return today's date as fallback
        const today = new Date();
        return today.toISOString().split('T')[0];
      };

      for (let i = 0; i < rows.length && gazetteEntries.length < limit; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');

        if (cells.length >= 2) {
          const gazetteNumber = cells[0]?.textContent?.trim() || '';
          const rawDate = cells[1]?.textContent?.trim() || '';
          const publicationDate = parseDate(rawDate);
          const pdfLink = row.querySelector('a[href*=".pdf"]');
          const pdfUrl = pdfLink ? pdfLink.href : '';

          if (gazetteNumber) {
            const rowText = row.textContent?.toLowerCase() || '';
            let category = 'tariff_change';

            if (rowText.includes('anti-dumping') || rowText.includes('anti dumping')) {
              category = 'anti_dumping';
            } else if (rowText.includes('trade remedy') || rowText.includes('safeguard')) {
              category = 'trade_remedy';
            } else if (rowText.includes('import restriction') || rowText.includes('prohibition')) {
              category = 'import_restriction';
            }

            gazetteEntries.push({
              gazette_number: gazetteNumber,
              publication_date: publicationDate,
              category,
              pdf_url: pdfUrl,
              title: gazetteNumber,
              summary: '',
              download_url: pdfUrl,
            });
          }
        }
      }

      return gazetteEntries;
    }, limit);

    console.log(`Found ${gazettes.length} gazettes`);

    // Filter by year if specified
    if (targetYear) {
      const filteredGazettes = gazettes.filter(g => {
        const pubYear = new Date(g.publication_date).getFullYear();
        return pubYear === targetYear;
      });
      console.log(`Filtered to ${filteredGazettes.length} gazettes from ${targetYear}`);
      return filteredGazettes;
    }

    return gazettes;
  } finally {
    await browser.close();
  }
}

// Simplified PDF parsing
async function downloadAndParsePdf(pdfUrl) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Dynamic import for CommonJS module
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    return {
      text: pdfData.text,
      numpages: pdfData.numpages,
    };
  } catch (error) {
    throw error;
  }
}

// Simplified content extraction
function extractDataFromText(text, title) {
  const data = {
    hs_codes: [],
    affected_countries: [],
    summary: '',
    remedy_type: undefined,
    expiry_date: undefined,
  };

  // Extract HS codes
  const hsCodePattern = /HS\s*(?:Code)?\s*:?\s*(\d{4})/gi;
  const hsMatches = [...text.matchAll(hsCodePattern)];
  data.hs_codes = [...new Set(hsMatches.map(m => m[1]))];

  // Extract countries
  const countries = [];
  const countryKeywords = ['china', 'chinese', 'singapore', 'thailand', 'indonesia', 'vietnam', 'india', 'south korea', 'japan', 'taiwan'];
  const lowerText = text.toLowerCase();
  for (const keyword of countryKeywords) {
    if (lowerText.includes(keyword)) {
      countries.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  data.affected_countries = [...new Set(countries)];

  // Determine remedy type
  const lower = text.toLowerCase();
  if (lower.includes('anti-dumping') || lower.includes('anti dumping')) {
    data.remedy_type = 'anti_dumping';
  } else if (lower.includes('countervailing') || lower.includes('cvd')) {
    data.remedy_type = 'countervailing';
  } else if (lower.includes('safeguard')) {
    data.remedy_type = 'safeguard';
  }

  // Generate summary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  data.summary = sentences.slice(0, 3).join('. ').trim() || text.substring(0, 200);

  return data;
}

async function scrapeDirectly() {
  console.log(`[${new Date().toISOString()}] Starting direct gazette scraping...`);

  try {
    // Step 1: Scrape gazettes for 2025
    console.log('Step 1: Scraping 2025 gazettes from AGC website...');
    const scrapedGazettes = await scrapeGazettes(200, 2025); // Get up to 200 gazettes, filter to 2025
    console.log(`Found ${scrapedGazettes.length} gazettes from 2025`);

    if (scrapedGazettes.length === 0) {
      console.log('No gazettes found. Website may be unavailable.');
      return true;
    }

    // Step 2: Get existing gazettes
    console.log('Step 2: Checking existing gazettes...');
    const { data: existingGazettes } = await supabase
      .from('gazettes')
      .select('gazette_number');

    const existingGazetteNumbers = existingGazettes?.map(g => g.gazette_number) || [];
    const newGazettes = scrapedGazettes.filter(
      gazette => !existingGazetteNumbers.includes(gazette.gazette_number)
    );
    console.log(`Found ${newGazettes.length} new gazettes`);

    if (newGazettes.length === 0) {
      console.log('No new gazettes to process');
      return true;
    }

    // Step 3: Process new gazettes
    console.log('Step 3: Processing new gazettes...');
    let successCount = 0;
    let errorCount = 0;

    for (const gazette of newGazettes) {
      try {
        console.log(`Processing: ${gazette.gazette_number}`);

        // Download and parse PDF if available
        let extractedData = {};
        let affectedItems = [];

        if (gazette.download_url) {
          try {
            const pdfContent = await downloadAndParsePdf(gazette.download_url);
            const extracted = extractDataFromText(pdfContent.text, gazette.title);

            extractedData = {
              full_text_length: pdfContent.text.length,
              num_pages: pdfContent.numpages,
              ...extracted,
            };

            if (extracted.hs_codes.length > 0 || extracted.affected_countries.length > 0) {
              affectedItems = [{
                hs_codes: extracted.hs_codes,
                affected_countries: extracted.affected_countries,
                summary: extracted.summary,
                remedy_type: extracted.remedy_type,
                expiry_date: extracted.expiry_date,
              }];
            }
          } catch (pdfError) {
            console.log(`  Could not parse PDF: ${pdfError.message}`);
          }
        }

        // Insert gazette
        const { data: insertedGazette, error: insertError } = await supabase
          .from('gazettes')
          .insert({
            gazette_number: gazette.gazette_number,
            publication_date: gazette.publication_date,
            category: gazette.category,
            pdf_url: gazette.pdf_url,
            title: gazette.title,
            summary: gazette.summary || extractedData.summary,
            extracted_data: extractedData,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`  Error inserting: ${insertError.message}`);
          errorCount++;
          continue;
        }

        // Insert affected items
        if (insertedGazette && affectedItems.length > 0) {
          const itemsToInsert = affectedItems.map((item) => ({
            gazette_id: insertedGazette.id,
            hs_codes: item.hs_codes || [],
            affected_countries: item.affected_countries || [],
            summary: item.summary,
            remedy_type: item.remedy_type,
            expiry_date: item.expiry_date,
          }));

          await supabase.from('gazette_affected_items').insert(itemsToInsert);
        }

        successCount++;
        console.log(`  ✓ Successfully added: ${gazette.gazette_number}`);
      } catch (error) {
        console.error(`  Error processing ${gazette.gazette_number}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n✓ Scraping complete!');
    console.log(`  - Processed: ${successCount}`);
    console.log(`  - Errors: ${errorCount}`);

    return true;
  } catch (error) {
    console.error('✗ Fatal error:', error);
    return false;
  }
}

// Run the scraper
scrapeDirectly()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

