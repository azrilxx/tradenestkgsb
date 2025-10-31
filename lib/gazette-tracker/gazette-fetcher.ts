// Gazette Fetcher - Scrape Malaysian Federal Gazette
// Task 2.1: Real Gazette Scraping
// Scrapes https://lom.agc.gov.my for trade remedy announcements

import puppeteer from 'puppeteer';

export interface GazetteEntry {
  gazette_number: string;
  publication_date: string;
  category: 'trade_remedy' | 'tariff_change' | 'import_restriction' | 'anti_dumping';
  pdf_url: string;
  title: string;
  summary?: string;
}

export interface ScrapedGazette {
  gazette_number: string;
  publication_date: string;
  category: string;
  pdf_url: string;
  title: string;
  summary: string;
  download_url?: string;
}

/**
 * Scrape gazettes from Malaysian Federal Gazette website
 * Enhanced version with better error handling and multiple fallback strategies
 */
export async function scrapeGazettes(limit: number = 50): Promise<ScrapedGazette[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to Malaysian Federal Gazette...');

    // Try multiple URLs and strategies
    const urls = [
      'https://lom.agc.gov.my/index.php',
      'https://lom.agc.gov.my/',
      'https://www.lom.agc.gov.my/index.php'
    ];

    let gazettes: ScrapedGazette[] = [];

    for (const url of urls) {
      try {
        console.log(`Trying URL: ${url}`);

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Try to find gazette entries
        gazettes = await page.evaluate((limit) => {
          const gazetteEntries: ScrapedGazette[] = [];

          // Strategy 1: Look for table rows
          const tableRows = Array.from(document.querySelectorAll('table tr, tbody tr'));
          console.log(`Found ${tableRows.length} table rows`);

          for (let i = 0; i < tableRows.length && gazetteEntries.length < limit; i++) {
            const row = tableRows[i];
            const cells = row.querySelectorAll('td, th');

            if (cells.length >= 2) {
              const gazetteNumber = cells[0]?.textContent?.trim() || '';
              const publicationDate = cells[1]?.textContent?.trim() || '';

              // Look for PDF link
              const pdfLink = row.querySelector('a[href*=".pdf"], a[href*="download"]');
              const pdfUrl = pdfLink ? (pdfLink as HTMLAnchorElement).href : '';

              if (gazetteNumber && gazetteNumber.match(/P\.U\.\([AB]\)\s*\d+\/\d+/)) {
                // Determine category based on text content
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
                  publication_date: publicationDate || new Date().toISOString().split('T')[0],
                  category,
                  pdf_url: pdfUrl,
                  title: gazetteNumber,
                  summary: '',
                  download_url: pdfUrl,
                });
              }
            }
          }

          // Strategy 2: Look for list items or divs with gazette numbers
          if (gazetteEntries.length === 0) {
            const allElements = Array.from(document.querySelectorAll('*'));
            const gazettePattern = /P\.U\.\([AB]\)\s*\d+\/\d+/g;

            for (const element of allElements) {
              const text = element.textContent || '';
              const matches = text.match(gazettePattern);

              if (matches && gazetteEntries.length < limit) {
                for (const match of matches) {
                  if (!gazetteEntries.some(g => g.gazette_number === match)) {
                    gazetteEntries.push({
                      gazette_number: match,
                      publication_date: new Date().toISOString().split('T')[0],
                      category: 'tariff_change',
                      pdf_url: '',
                      title: match,
                      summary: '',
                      download_url: '',
                    });
                  }
                }
              }
            }
          }

          return gazetteEntries;
        }, limit);

        if (gazettes.length > 0) {
          console.log(`Successfully found ${gazettes.length} gazettes from ${url}`);
          break;
        }

      } catch (urlError) {
        console.log(`Failed to scrape from ${url}:`, urlError);
        continue;
      }
    }

    // If no gazettes found, try alternative approach
    if (gazettes.length === 0) {
      console.log('No gazettes found via scraping, trying alternative approach...');
      return await scrapeGazettesAlternative();
    }

    console.log(`Found ${gazettes.length} gazettes`);
    return gazettes;

  } catch (error) {
    console.error('Error scraping gazettes:', error);
    return await scrapeGazettesAlternative();
  } finally {
    await browser.close();
  }
}

/**
 * Alternative approach: Scrape using RSS feed if available
 * Note: AGC website may not have RSS, using direct scraping instead
 */
export async function scrapeGazettesAlternative(): Promise<ScrapedGazette[]> {
  // Fallback to basic HTTP fetch if Puppeteer fails
  try {
    const response = await fetch('https://lom.agc.gov.my/index.php');
    const html = await response.text();

    // Parse HTML for gazette entries
    // This is a simplified version - may need refinement
    const gazetteMatches = html.match(/P\.U\.\([AB]\)\s*\d+\/\d+/g);

    if (!gazetteMatches) {
      return [];
    }

    return gazetteMatches.slice(0, 50).map((gazetteNumber) => ({
      gazette_number: gazetteNumber,
      publication_date: new Date().toISOString().split('T')[0],
      category: 'tariff_change',
      pdf_url: 'https://lom.agc.gov.my',
      title: gazetteNumber,
      summary: '',
    }));
  } catch (error) {
    console.error('Error in alternative scraping:', error);
    return [];
  }
}

/**
 * Check if a gazette is new (not yet in database)
 */
export async function filterNewGazettes(
  scrapedGazettes: ScrapedGazette[],
  existingGazetteNumbers: string[]
): Promise<ScrapedGazette[]> {
  return scrapedGazettes.filter(
    gazette => !existingGazetteNumbers.includes(gazette.gazette_number)
  );
}

