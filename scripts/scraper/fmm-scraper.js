import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output';
const CSV_FILE = path.join(OUTPUT_DIR, 'fmm-companies.csv');
const JSON_FILE = path.join(OUTPUT_DIR, 'fmm-companies.json');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// CSV Writer configuration
const csvWriter = createObjectCsvWriter({
  path: CSV_FILE,
  header: [
    { id: 'companyName', title: 'Company Name' },
    { id: 'registrationNumber', title: 'Registration Number' },
    { id: 'memberType', title: 'Member Type' },
    { id: 'officeAddress', title: 'Office Address' },
    { id: 'telephone', title: 'Telephone' },
    { id: 'website', title: 'Website' },
    { id: 'email', title: 'Email' },
    { id: 'productsServices', title: 'Products/Services' },
    { id: 'profileUrl', title: 'Profile URL' }
  ]
});

async function scrapeCompanyDetail(page, url) {
  console.log(`Scraping: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the company detail section to load
    await page.waitForSelector('table, body', { timeout: 10000 });

    // Take a screenshot for debugging (optional)
    // await page.screenshot({ path: `debug-${Date.now()}.png` });

    // Extract company details
    const companyData = await page.evaluate(() => {
      const getFieldValue = (labelText) => {
        const rows = Array.from(document.querySelectorAll('tr'));

        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));

          // The table has 3 cells: Label | : | Value
          if (cells.length >= 3) {
            const labelCell = cells[0];
            const valueCell = cells[2]; // Changed from cells[1] to cells[2]

            if (labelCell && labelCell.textContent.trim().includes(labelText)) {
              let value = valueCell.textContent.trim();

              // Clean up multiple spaces and newlines
              value = value.replace(/\s+/g, ' ').trim();

              // Remove colons if present
              value = value.replace(/^:\s*/, '');

              return value;
            }
          }
        }
        return '';
      };

      // Get company name with registration number
      const companyNameRaw = getFieldValue('Company Name');
      let companyName = '';
      let registrationNumber = '';

      // Pattern: "Company Name (Registration Number)"
      const match = companyNameRaw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (match) {
        companyName = match[1].trim();
        registrationNumber = match[2].trim();
      } else {
        companyName = companyNameRaw;
      }

      // Get website (might be a link)
      let website = getFieldValue('Website');
      const websiteLink = document.querySelector('a[href^="http"]');
      if (websiteLink && !website) {
        website = websiteLink.href;
      }

      return {
        companyName: companyName,
        registrationNumber: registrationNumber,
        memberType: getFieldValue('Member Type'),
        officeAddress: getFieldValue('Office Address'),
        telephone: getFieldValue('Telephone'),
        website: website,
        email: getFieldValue('Email'),
        productsServices: getFieldValue('Products/Services Manufactured')
      };
    });

    companyData.profileUrl = url;

    console.log(`✓ Scraped: ${companyData.companyName}`);
    return companyData;

  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

async function findMemberListUrls(page) {
  console.log('Looking for member list page...');

  // Try the main member list page
  const memberListUrl = 'https://www.fmm.org.my/Member_List.aspx';

  try {
    await page.goto(memberListUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to find all member detail links
    const memberUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="Member_Detail.aspx"]'));
      return links.map(link => link.href).filter(href => href.includes('MemberId='));
    });

    if (memberUrls.length > 0) {
      console.log(`Found ${memberUrls.length} member URLs`);
      return [...new Set(memberUrls)]; // Remove duplicates
    }

    // If no links found, try to interact with search/filter elements
    console.log('No direct links found. Trying to interact with search elements...');

    // Try clicking search/submit buttons
    const searchButton = await page.$('input[type="submit"], button[type="submit"], .search-button');
    if (searchButton) {
      await searchButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      const memberUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="Member_Detail.aspx"]'));
        return links.map(link => link.href).filter(href => href.includes('MemberId='));
      });

      if (memberUrls.length > 0) {
        console.log(`Found ${memberUrls.length} member URLs after search`);
        return [...new Set(memberUrls)];
      }
    }

    return [];

  } catch (error) {
    console.error('Error finding member list:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting FMM Member Scraper...\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: Find all member URLs
    let memberUrls = await findMemberListUrls(page);

    // If we couldn't find any, let's try a sample URL for now
    if (memberUrls.length === 0) {
      console.log('\n⚠️  Could not automatically find member list.');
      console.log('📝 Please manually provide member URLs or the member list page might require interaction.\n');
      console.log('Using sample URL for demonstration...\n');

      // Use the sample URL from the screenshot
      memberUrls = ['https://www.fmm.org.my/Member_Detail.aspx?MemberId=33B2D787-43F1-4E3B-93A3-97F28E296CE8'];
    }

    console.log(`\n📊 Found ${memberUrls.length} companies to scrape\n`);

    // Step 2: Scrape each company
    const companies = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < memberUrls.length; i++) {
      console.log(`\n[${i + 1}/${memberUrls.length}] Processing...`);

      const companyData = await scrapeCompanyDetail(page, memberUrls[i]);

      if (companyData && companyData.companyName) {
        companies.push(companyData);
        successCount++;
      } else {
        errorCount++;
      }

      // Be polite - add a small delay between requests
      if (i < memberUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 3: Save results
    console.log('\n\n📝 Saving results...');

    // Save as JSON
    fs.writeFileSync(JSON_FILE, JSON.stringify(companies, null, 2));
    console.log(`✓ Saved JSON: ${JSON_FILE}`);

    // Save as CSV
    await csvWriter.writeRecords(companies);
    console.log(`✓ Saved CSV: ${CSV_FILE}`);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total URLs processed: ${memberUrls.length}`);
    console.log(`Successfully scraped: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Output files:`);
    console.log(`  - ${JSON_FILE}`);
    console.log(`  - ${CSV_FILE}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
main().catch(console.error);