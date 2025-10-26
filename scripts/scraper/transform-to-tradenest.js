import fs from 'fs';
import path from 'path';

/**
 * Transform scraped FMM company data into TradeNest database format
 *
 * This script:
 * 1. Reads the scraped FMM companies JSON
 * 2. Maps fields to TradeNest company schema
 * 3. Categorizes companies by industry sector based on products/services
 * 4. Generates TypeScript seed file for TradeNest
 */

const INPUT_FILE = './output/fmm-companies-all.json';
const OUTPUT_DIR = '../../lib/mock-data';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'fmm-companies-scraped.ts');

// Industry mapping based on products/services keywords
const INDUSTRY_KEYWORDS = {
  'Steel & Metals': [
    'steel', 'metal', 'iron', 'aluminum', 'copper', 'brass', 'zinc',
    'alloy', 'scrap metal', 'fabrication', 'foundry', 'casting'
  ],
  'Electronics & Electrical': [
    'electronic', 'electrical', 'semiconductor', 'circuit', 'component',
    'led', 'pcb', 'telecom', 'cable', 'wire', 'power', 'transformer',
    'chip', 'device', 'sensor', 'controller'
  ],
  'Chemicals & Petrochemicals': [
    'chemical', 'petrochemical', 'polymer', 'plastic', 'resin', 'rubber',
    'oil', 'fuel', 'lubricant', 'additive', 'solvent', 'coating'
  ],
  'Food & Beverage': [
    'food', 'beverage', 'cooking oil', 'edible', 'grain', 'flour',
    'sugar', 'dairy', 'snack', 'confectionery', 'drink', 'juice'
  ],
  'Textiles & Apparel': [
    'textile', 'fabric', 'garment', 'apparel', 'clothing', 'yarn',
    'thread', 'knitting', 'weaving', 'dyeing'
  ],
  'Automotive & Parts': [
    'automotive', 'auto', 'vehicle', 'car', 'motorcycle', 'engine',
    'brake', 'tire', 'transmission', 'parts'
  ],
  'Furniture & Wood': [
    'furniture', 'wood', 'timber', 'plywood', 'cabinet', 'joinery'
  ],
  'Machinery & Equipment': [
    'machinery', 'equipment', 'machine', 'tool', 'pump', 'valve',
    'compressor', 'generator', 'motor'
  ],
  'Packaging & Printing': [
    'packaging', 'printing', 'label', 'box', 'carton', 'container'
  ],
  'Construction Materials': [
    'cement', 'concrete', 'brick', 'tile', 'glass', 'roofing', 'insulation'
  ]
};

/**
 * Categorize company sector based on products/services
 */
function categorizeSector(productsServices) {
  if (!productsServices) return 'Other Manufacturing';

  const text = productsServices.toLowerCase();

  for (const [sector, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return sector;
    }
  }

  return 'Other Manufacturing';
}

/**
 * Determine company type (importer/exporter)
 * Default to random assignment since we don't have this data from FMM
 * Note: 'both' is not supported by current DB constraint
 */
function determineCompanyType() {
  // Randomly assign for realistic distribution
  const rand = Math.random();
  if (rand < 0.5) return 'importer';
  return 'exporter';
}

/**
 * Extract state/region from address
 */
function extractState(address) {
  if (!address) return null;

  const states = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
    'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor',
    'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'
  ];

  for (const state of states) {
    if (address.includes(state)) {
      return state;
    }
  }

  return null;
}

/**
 * Clean and format website URL
 */
function formatWebsite(website) {
  if (!website) return null;

  let url = website.trim();

  // Skip placeholder URLs
  if (url.includes('fmm.edu.my') || url === '') {
    return null;
  }

  // Add https:// if missing protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  return url;
}

/**
 * Parse products/services into array
 */
function parseProducts(productsServices) {
  if (!productsServices) return [];

  return productsServices
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Transform FMM data to TradeNest format
 */
function transformCompany(fmmCompany) {
  const sector = categorizeSector(fmmCompany.productsServices);
  const products = parseProducts(fmmCompany.productsServices);

  return {
    name: fmmCompany.companyName || 'Unknown Company',
    registrationNumber: fmmCompany.registrationNumber || null,
    country: 'Malaysia',
    type: determineCompanyType(),
    sector: sector,
    address: fmmCompany.officeAddress || null,
    state: extractState(fmmCompany.officeAddress),
    telephone: fmmCompany.telephone || null,
    website: formatWebsite(fmmCompany.website),
    email: fmmCompany.email || null,
    memberType: fmmCompany.memberType || 'Ordinary Member',
    products: products,
    fmmProfileUrl: fmmCompany.profileUrl
  };
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(companies) {
  const imports = `// Auto-generated from FMM scraper
// Generated: ${new Date().toISOString()}
// Total companies: ${companies.length}

export interface FMMCompanyData {
  name: string;
  registrationNumber: string | null;
  country: string;
  type: 'importer' | 'exporter' | 'both';
  sector: string;
  address: string | null;
  state: string | null;
  telephone: string | null;
  website: string | null;
  email: string | null;
  memberType: string;
  products: string[];
  fmmProfileUrl: string;
}
`;

  const companiesArray = `
export const FMM_COMPANIES_SCRAPED: FMMCompanyData[] = ${JSON.stringify(companies, null, 2)};
`;

  const stats = `
// Statistics
export const FMM_STATS = {
  totalCompanies: ${companies.length},
  bySector: ${JSON.stringify(
    companies.reduce((acc, c) => {
      acc[c.sector] = (acc[c.sector] || 0) + 1;
      return acc;
    }, {}),
    null,
    2
  )},
  byType: ${JSON.stringify(
    companies.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {}),
    null,
    2
  )},
  byState: ${JSON.stringify(
    companies.reduce((acc, c) => {
      if (c.state) {
        acc[c.state] = (acc[c.state] || 0) + 1;
      }
      return acc;
    }, {}),
    null,
    2
  )}
};
`;

  return imports + companiesArray + stats;
}

/**
 * Main transformation function
 */
async function main() {
  console.log('🔄 Starting FMM Data Transformation...\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: Input file not found: ${INPUT_FILE}`);
    console.log('   Please run the scraper first: npm run scrape:all');
    process.exit(1);
  }

  // Read scraped data
  console.log(`📖 Reading scraped data from: ${INPUT_FILE}`);
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`   Found ${rawData.length} companies\n`);

  // Transform companies
  console.log('🔄 Transforming data...');
  const transformedCompanies = rawData
    .filter(company => company.companyName) // Filter out entries without names
    .map(transformCompany);

  console.log(`✅ Transformed ${transformedCompanies.length} companies\n`);

  // Generate TypeScript file
  console.log('📝 Generating TypeScript file...');
  const tsContent = generateTypeScriptFile(transformedCompanies);

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
  console.log(`✅ Generated: ${OUTPUT_FILE}\n`);

  // Print statistics
  console.log('='.repeat(70));
  console.log('📊 TRANSFORMATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total companies: ${transformedCompanies.length}`);

  const sectorCounts = transformedCompanies.reduce((acc, c) => {
    acc[c.sector] = (acc[c.sector] || 0) + 1;
    return acc;
  }, {});

  console.log('\nCompanies by sector:');
  Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sector, count]) => {
      console.log(`  ${sector}: ${count}`);
    });

  const typeCounts = transformedCompanies.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  console.log('\nCompanies by type:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  const companiesWithWebsite = transformedCompanies.filter(c => c.website).length;
  const companiesWithEmail = transformedCompanies.filter(c => c.email).length;
  const companiesWithPhone = transformedCompanies.filter(c => c.telephone).length;

  console.log('\nData completeness:');
  console.log(`  With website: ${companiesWithWebsite} (${Math.round(companiesWithWebsite/transformedCompanies.length*100)}%)`);
  console.log(`  With email: ${companiesWithEmail} (${Math.round(companiesWithEmail/transformedCompanies.length*100)}%)`);
  console.log(`  With phone: ${companiesWithPhone} (${Math.round(companiesWithPhone/transformedCompanies.length*100)}%)`);

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Transformation complete!');
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated file: ${OUTPUT_FILE}`);
  console.log(`2. Update your seed.ts to import and use this data`);
  console.log(`3. Run: npm run seed-db to populate database\n`);
}

main().catch(console.error);
