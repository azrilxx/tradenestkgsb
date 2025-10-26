/**
 * MATRADE Dataset Parser
 * Parses CSV/Excel files and extracts company data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { COMPANY_FIELD_MAPPING, MALAYSIAN_STATES } from './datasets-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const METADATA_FILE = path.join(DOWNLOADS_DIR, 'metadata.json');
const PARSED_FILE = path.join(OUTPUT_DIR, 'parsed-companies.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Find matching field name from variations
 */
function findField(row, fieldVariations) {
  for (const variation of fieldVariations) {
    // Case-insensitive search
    const key = Object.keys(row).find(k =>
      k.toLowerCase() === variation.toLowerCase() ||
      k.toLowerCase().includes(variation.toLowerCase())
    );
    if (key && row[key]) {
      return row[key].toString().trim();
    }
  }
  return null;
}

/**
 * Extract state from address
 */
function extractState(address) {
  if (!address) return null;

  for (const state of MALAYSIAN_STATES) {
    if (address.toUpperCase().includes(state.toUpperCase())) {
      return state;
    }
  }
  return null;
}

/**
 * Parse CSV file
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Parse Excel file
 */
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  return data;
}

/**
 * Normalize company data
 */
function normalizeCompany(row, datasetInfo) {
  const name = findField(row, COMPANY_FIELD_MAPPING.company_name);

  if (!name) {
    return null; // Skip rows without company name
  }

  const address = findField(row, COMPANY_FIELD_MAPPING.address);
  const state = findField(row, COMPANY_FIELD_MAPPING.state) || extractState(address);

  return {
    name: name,
    address: address,
    state: state,
    postcode: findField(row, COMPANY_FIELD_MAPPING.postcode),
    telephone: findField(row, COMPANY_FIELD_MAPPING.telephone),
    fax: findField(row, COMPANY_FIELD_MAPPING.fax),
    email: findField(row, COMPANY_FIELD_MAPPING.email),
    website: findField(row, COMPANY_FIELD_MAPPING.website),
    contactPerson: findField(row, COMPANY_FIELD_MAPPING.contact_person),
    products: findField(row, COMPANY_FIELD_MAPPING.products),
    yearEstablished: findField(row, COMPANY_FIELD_MAPPING.year_established),
    registrationNo: findField(row, COMPANY_FIELD_MAPPING.registration_no),

    // Metadata
    sector: datasetInfo.sector,
    datasetId: datasetInfo.id,
    datasetName: datasetInfo.name,
    dataSource: 'MATRADE'
  };
}

/**
 * Main parser function
 */
async function parseDatasets() {
  console.log('📖 MATRADE Dataset Parser\n');

  // Load metadata
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Error: metadata.json not found');
    console.log('   Please run: npm run download first\n');
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`Found ${metadata.datasets.length} downloaded datasets\n`);

  const allCompanies = [];
  let totalParsed = 0;
  let errorCount = 0;

  for (const dataset of metadata.datasets) {
    // Only parse company datasets (not trade stats)
    if (dataset.type !== 'company') {
      console.log(`⏭️  Skipping trade stats: ${dataset.name}`);
      continue;
    }

    const filePath = path.join(DOWNLOADS_DIR, dataset.filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${dataset.filename}`);
      errorCount++;
      continue;
    }

    console.log(`\n📄 Parsing: ${dataset.name}`);
    console.log(`   File: ${dataset.filename}`);

    try {
      let rows = [];

      // Parse based on file type
      if (dataset.filename.endsWith('.csv')) {
        rows = await parseCSV(filePath);
      } else if (dataset.filename.endsWith('.xlsx') || dataset.filename.endsWith('.xls')) {
        rows = parseExcel(filePath);
      } else {
        console.log(`   ⚠️  Unsupported file format`);
        errorCount++;
        continue;
      }

      console.log(`   Found ${rows.length} rows`);

      // Normalize company data
      const companies = rows
        .map(row => normalizeCompany(row, dataset))
        .filter(company => company !== null);

      console.log(`   ✅ Extracted ${companies.length} companies`);

      allCompanies.push(...companies);
      totalParsed += companies.length;

    } catch (error) {
      console.error(`   ❌ Error parsing file:`, error.message);
      errorCount++;
    }
  }

  // Remove duplicates by company name
  const uniqueCompanies = Array.from(
    new Map(allCompanies.map(c => [c.name.toLowerCase(), c])).values()
  );

  console.log('\n' + '='.repeat(70));
  console.log('📊 PARSING SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total rows parsed: ${totalParsed}`);
  console.log(`Unique companies: ${uniqueCompanies.length}`);
  console.log(`Duplicates removed: ${totalParsed - uniqueCompanies.length}`);
  console.log(`Errors: ${errorCount}`);

  // Sector breakdown
  const sectorCounts = {};
  uniqueCompanies.forEach(c => {
    sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
  });

  console.log('\nCompanies by sector:');
  Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sector, count]) => {
      console.log(`  ${sector}: ${count}`);
    });

  // State breakdown
  const stateCounts = {};
  uniqueCompanies.forEach(c => {
    if (c.state) {
      stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
    }
  });

  console.log('\nCompanies by state (top 5):');
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });

  // Save parsed data
  fs.writeFileSync(PARSED_FILE, JSON.stringify(uniqueCompanies, null, 2));
  console.log(`\n✅ Saved to: ${PARSED_FILE}`);
  console.log('='.repeat(70) + '\n');

  console.log('📝 NEXT STEPS:');
  console.log('1. Run: npm run transform');
  console.log('2. Run: npm run seed\n');
}

// Run parser
parseDatasets().catch(console.error);
