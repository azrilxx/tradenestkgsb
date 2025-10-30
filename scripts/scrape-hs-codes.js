/**
 * HS Code Scraper for Malaysian Customs EZHS
 * https://ezhs.customs.gov.my/
 * 
 * This script scrapes HS codes and tariff rates from the Malaysian Customs database
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const EZHS_URL = 'https://ezhs.customs.gov.my/';
const OUTPUT_FILE = path.join(__dirname, '../lib/customs-declaration/hs-codes-scraped.json');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds to be respectful
const MAX_HS_CODES = 100; // Limit for testing, set to null for all codes

// HS Code ranges to scrape (Malaysian HS codes typically use 6-8 digits)
// Major categories
const HS_CODE_RANGES = [
  // Chapter 1-5: Live animals, Meat, Fish, Dairy, Eggs
  { start: '0101', end: '0504' },
  // Chapter 6-14: Plants, Vegetables, Fruits, Grain
  { start: '0601', end: '1404' },
  // Chapter 15: Animal/Vegetable Oils
  { start: '1501', end: '1518' },
  // Chapter 16-24: Food Preparations, Beverages
  { start: '1601', end: '2403' },
  // Chapter 25-27: Mineral Products
  { start: '2501', end: '2716' },
  // Chapter 28-38: Chemicals
  { start: '2801', end: '3826' },
  // Chapter 39: Plastics
  { start: '3901', end: '3914' },
  // Chapter 40: Rubber
  { start: '4001', end: '4017' },
  // Chapter 41-43: Leather, Furs
  { start: '4101', end: '4304' },
  // Chapter 44-46: Wood
  { start: '4401', end: '4615' },
  // Chapter 47-49: Pulp, Paper
  { start: '4701', end: '突发事件' },
  // Chapter 50-63: Textiles
  { start: '5001', end: '6308' },
  // Chapter 64-67: Footwear
  { start: '6401', end: '6704' },
  // Chapter 68-70: Stone, Ceramics, Glass
  { start: '6801', end: '7020' },
  // Chapter 71: Precious Metals
  { start: '7101', end: '7118' },
  // Chapter 72-83: Base Metals
  { start: '7201', end: '8312' },
  // Chapter 84: Machinery
  { start: '8401', end: '8487' },
  // Chapter 85: Electrical Equipment
  { start: '8501', end: '8548' },
  // Chapter 86-89: Transport Equipment
  { start: '8601', end: '8908' },
  // Chapter 90-92: Instruments, Clocks
  { start: '9001', end: '9209' },
  // Chapter 93: Arms
  { start: '9301', end: '9307' },
  // Chapter 94-96: Miscellaneous
  { start: '9401', end: '9619' },
  // Chapter 97: Art, Collections
  { start: '9701', end: '9706' },
];

// Store scraped data
let scrapedData = [];

/**
 * Generate list of HS codes to search
 */
function generateHSCodes() {
  const codes = new Set();

  // Add specific codes we know exist
  const knownCodes = ['7208', '8517', '3903', '6109', '8704', '3004', '2208', '1001'];
  knownCodes.forEach(code => codes.add(code));

  return Array.from(codes);
}

/**
 * Scrape a single HS code
 */
async function scrapeHSCode(page, hsCode) {
  try {
    console.log(`Scraping HS code: ${hsCode}`);

    // Navigate to search page
    await page.goto(EZHS_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for search input
    await page.waitForSelector('input[name="hs_code"], input[type="text"], #search-input', { timeout: 10000 });

    // Enter HS code and search
    await page.type('input[name="hs_code"], input[type="text"], #search-input', hsCode);
    await page.keyboard.press('Enter');

    // Wait for results
    await page.waitForTimeout(3000);

    // Extract data from the page
    const data = await page.evaluate(() => {
      const result = {
        hs_code: '',
        description: '',
        tariffs: [],
      };

      // Try to find HS code and description
      const codeElement = document.querySelector('.hs-code, [class*="hs-code"], h2, h3');
      if (codeElement) {
        result.hs_code = codeElement.textContent.trim();
      }

      const descElement = document.querySelector('.description, [class*="description"], p');
      if (descElement) {
        result.description = descElement.textContent.trim();
      }

      // Try to find tariff rates
      const tariffRows = document.querySelectorAll('table tr, .tariff-row, [class*="tariff"]');
      tariffRows.forEach(row => {
        const text = row.textContent;
        if (text.includes('%') || text.includes('Rate') || text.includes('Tariff')) {
          // Parse tariff information
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const agreement = cells[0].textContent.trim();
            const rate = cells[1].textContent.trim();
            result.tariffs.push({ agreement, rate });
          }
        }
      });

      return result;
    });

    // Add the HS code we searched for
    data.hs_code = hsCode;

    // Save successful scrape
    scrapedData.push(data);
    console.log(`✓ Successfully scraped ${hsCode}`);

    return data;

  } catch (error) {
    console.error(`✗ Error scraping ${hsCode}:`, error.message);
    return null;
  }
}

/**
 * Main scraping function
 */
async function scrapeAllHSCodes() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const codesToScrape = generateHSCodes();

  console.log(`Starting to scrape ${codesToScrape.length} HS codes...`);

  for (let i = 0; i < codesToScrape.length && (!MAX_HS_CODES || i < MAX_HS_CODES); i++) {
    const code = codesToScrape[i];
    await scrapeHSCode(page, code);

    // Delay between requests
    if (i < codesToScrape.length - 1) {
      await page.waitForTimeout(DELAY_BETWEEN_REQUESTS);
    }
  }

  await browser.close();

  // Save results
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
  console.log(`\n✓ Scraping complete! Saved ${scrapedData.length} HS codes to ${OUTPUT_FILE}`);
}

/**
 * Convert scraped data to our database format
 */
function convertToDatabaseFormat(scrapedData) {
  return scrapedData.map(item => ({
    hs_code: {
      code: item.hs_code,
      description: item.description || 'Description not available',
      category: getCategoryFromHS(item.hs_code),
      unit: 'units', // Default, should be extracted from actual data
    },
    tariffs: item.tariffs.map(tariff => ({
      agreement: parseAgreementName(tariff.agreement),
      agreement_full_name: tariff.agreement,
      rate: parseRate(tariff.rate),
      rate_type: 'percentage',
    })),
    last_updated: new Date().toISOString().split('T')[0],
  }));
}

/**
 * Helper: Get category from HS code
 */
function getCategoryFromHS(hsCode) {
  const code = parseInt(hsCode.substring(0, 2));
  const categories = {
    1: 'Animal Products', 2: 'Vegetable Products', 3: 'Animal/Vegetable Fats',
    4: 'Prepared Food', 5: 'Mineral Products', 6: 'Chemical Products',
    7: 'Plastics/Rubber', 8: 'Leather/Furs', 9: 'Wood Products',
    10: 'Paper Products', 11: 'Textiles', 12: 'Footwear',
    13: 'Stone/Ceramics', 14: 'Precious Metals', 15: 'Base Metals',
    16: 'Machinery', 17: 'Transport', 18: 'Instruments',
    19: 'Arms', 20: 'Miscellaneous', 21: 'Art/Collections',
  };
  return categories[Math.floor(code / 10)] || 'Other';
}

function parseAgreementName(fullName) {
  const shortNames = {
    'Perintah Duti Kastam': 'PDK',
    'ASEAN Trade in Goods Agreement': 'ATIGA',
    'ASEAN-China Free Trade Agreement': 'ACFTA',
    'Regional Comprehensive Economic Partnership': 'RCEP',
  };

  for (const [key, value] of Object.entries(shortNames)) {
    if (fullName.includes(key)) return value;
  }

  return fullName.substring(0, 10);
}

function parseRate(rateString) {
  const match = rateString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// Run if called directly
if (require.main === module) {
  scrapeAllHSCodes()
    .then(() => {
      console.log('Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAllHSCodes, convertToDatabaseFormat };

