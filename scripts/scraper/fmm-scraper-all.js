import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output';
const CSV_FILE = path.join(OUTPUT_DIR, 'fmm-companies-all.csv');
const JSON_FILE = path.join(OUTPUT_DIR, 'fmm-companies-all.json');
const URLS_FILE = path.join(OUTPUT_DIR, 'all-member-urls.json');

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
  console.log(`  Scraping: ${url.substring(0, 80)}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('table, body', { timeout: 10000 });

    const companyData = await page.evaluate(() => {
      const getFieldValue = (labelText) => {
        const rows = Array.from(document.querySelectorAll('tr'));

        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));

          if (cells.length >= 3) {
            const labelCell = cells[0];
            const valueCell = cells[2];

            if (labelCell && labelCell.textContent.trim().includes(labelText)) {
              let value = valueCell.textContent.trim();
              value = value.replace(/\s+/g, ' ').trim();
              value = value.replace(/^:\s*/, '');
              return value;
            }
          }
        }
        return '';
      };

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
    console.log(`  ✓ ${companyData.companyName}`);
    return companyData;

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return null;
  }
}

async function searchCompanies(page, searchTerm) {
  console.log(`\nSearching for: "${searchTerm}"`);

  try {
    await page.goto('https://www.fmm.org.my/Member_List.aspx', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to find and fill search input
    const searchInput = await page.$('input[type="text"]');
    if (searchInput) {
      await searchInput.type(searchTerm);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to find and click search button
      const searchButton = await page.$('input[type="submit"], button[type="submit"]');
      if (searchButton) {
        await searchButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Extract all member links
    const memberUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="Member_Detail.aspx"]'));
      return links.map(link => link.href).filter(href => href.includes('MemberId='));
    });

    const uniqueUrls = [...new Set(memberUrls)];
    console.log(`  Found ${uniqueUrls.length} companies`);
    return uniqueUrls;

  } catch (error) {
    console.error(`  Error searching: ${error.message}`);
    return [];
  }
}

async function findAllCompanies(page) {
  console.log('🔍 Discovering all company URLs...\n');

  const allUrls = new Set();

  // Strategy 1: Get initial page companies
  console.log('Strategy 1: Loading initial member list page...');
  const initialUrls = await searchCompanies(page, '');
  initialUrls.forEach(url => allUrls.add(url));

  // Strategy 2: Search by alphabet (A-Z, 0-9)
  console.log('\nStrategy 2: Searching by alphabet...');
  const searchTerms = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

  for (const term of searchTerms) {
    const urls = await searchCompanies(page, term);
    urls.forEach(url => allUrls.add(url));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const allUrlsArray = Array.from(allUrls);
  console.log(`\n✓ Total unique companies discovered: ${allUrlsArray.length}\n`);

  // Save URLs for later use
  fs.writeFileSync(URLS_FILE, JSON.stringify(allUrlsArray, null, 2));
  console.log(`✓ Saved URLs to: ${URLS_FILE}\n`);

  return allUrlsArray;
}

async function main() {
  console.log('🚀 Starting FMM Complete Member Scraper...\n');
  console.log('This will attempt to find ALL companies by searching A-Z, 0-9\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: Find all member URLs
    let memberUrls = [];

    // Check if we have saved URLs from a previous run
    if (fs.existsSync(URLS_FILE)) {
      console.log('📂 Found existing URLs file. Use existing URLs? (Y/n)');
      console.log('   Delete the file to force a new search: ' + URLS_FILE);
      memberUrls = JSON.parse(fs.readFileSync(URLS_FILE, 'utf8'));
      console.log(`   Loaded ${memberUrls.length} URLs from cache\n`);
    } else {
      memberUrls = await findAllCompanies(page);
    }

    if (memberUrls.length === 0) {
      console.log('❌ No companies found. Exiting...');
      return;
    }

    // Step 2: Scrape each company
    console.log(`\n📊 Scraping ${memberUrls.length} companies...\n`);
    console.log('='.repeat(70));

    const companies = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < memberUrls.length; i++) {
      console.log(`\n[${i + 1}/${memberUrls.length}]`);

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
    console.log('\n' + '='.repeat(70));
    console.log('\n📝 Saving results...');

    fs.writeFileSync(JSON_FILE, JSON.stringify(companies, null, 2));
    console.log(`✓ Saved JSON: ${JSON_FILE}`);

    await csvWriter.writeRecords(companies);
    console.log(`✓ Saved CSV: ${CSV_FILE}`);

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total URLs processed: ${memberUrls.length}`);
    console.log(`Successfully scraped: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`\nOutput files:`);
    console.log(`  - ${JSON_FILE}`);
    console.log(`  - ${CSV_FILE}`);
    console.log(`  - ${URLS_FILE}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
main().catch(console.error);
