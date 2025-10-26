/**
 * MATRADE to TradeNest Transformer
 * Converts parsed MATRADE data to TradeNest database schema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_FILE = path.join(__dirname, 'output', 'parsed-companies.json');
const OUTPUT_FILE = path.join(__dirname, '../../lib/mock-data/matrade-companies.ts');

/**
 * Determine company type (importer/exporter)
 */
function determineCompanyType(company) {
  // Use sector to make educated guess
  const exporterSectors = ['Palm Oil', 'Rubber', 'E&E', 'Electronics', 'Automotive'];
  const importerSectors = ['Medical', 'Pharmaceutical', 'Chemicals'];

  const isLikelyExporter = exporterSectors.some(s =>
    company.sector.toLowerCase().includes(s.toLowerCase())
  );

  const isLikelyImporter = importerSectors.some(s =>
    company.sector.toLowerCase().includes(s.toLowerCase())
  );

  if (isLikelyExporter && !isLikelyImporter) return 'exporter';
  if (isLikelyImporter && !isLikelyExporter) return 'importer';

  // Default: random assignment
  return Math.random() < 0.5 ? 'importer' : 'exporter';
}

/**
 * Transform to TradeNest schema
 */
function transformCompany(company) {
  return {
    name: company.name,
    country: 'Malaysia',
    type: determineCompanyType(company),
    sector: company.sector,
    // Extended metadata (can be stored in JSONB column if schema supports)
    metadata: {
      address: company.address,
      state: company.state,
      postcode: company.postcode,
      telephone: company.telephone,
      fax: company.fax,
      email: company.email,
      website: company.website,
      contactPerson: company.contactPerson,
      products: company.products,
      yearEstablished: company.yearEstablished,
      registrationNo: company.registrationNo,
      dataSource: 'MATRADE',
      datasetId: company.datasetId,
      matradeVerified: true
    }
  };
}

/**
 * Generate TypeScript file
 */
function generateTypeScriptFile(companies) {
  const header = `// Auto-generated from MATRADE data
// Generated: ${new Date().toISOString()}
// Total companies: ${companies.length}
// Source: Malaysia External Trade Development Corporation (MATRADE)

export interface MATRADECompanyData {
  name: string;
  country: string;
  type: 'importer' | 'exporter';
  sector: string;
  metadata: {
    address?: string;
    state?: string;
    postcode?: string;
    telephone?: string;
    fax?: string;
    email?: string;
    website?: string;
    contactPerson?: string;
    products?: string;
    yearEstablished?: string;
    registrationNo?: string;
    dataSource: string;
    datasetId: string;
    matradeVerified: boolean;
  };
}
`;

  const companiesArray = `
export const MATRADE_COMPANIES: MATRADECompanyData[] = ${JSON.stringify(companies, null, 2)};
`;

  const stats = `
// Statistics
export const MATRADE_STATS = {
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
      if (c.metadata.state) {
        acc[c.metadata.state] = (acc[c.metadata.state] || 0) + 1;
      }
      return acc;
    }, {}),
    null,
    2
  )},
  dataCompleteness: {
    withAddress: ${companies.filter(c => c.metadata.address).length},
    withPhone: ${companies.filter(c => c.metadata.telephone).length},
    withEmail: ${companies.filter(c => c.metadata.email).length},
    withWebsite: ${companies.filter(c => c.metadata.website).length}
  }
};
`;

  return header + companiesArray + stats;
}

/**
 * Main transform function
 */
async function transformData() {
  console.log('🔄 MATRADE to TradeNest Transformer\n');

  // Check if parsed file exists
  if (!fs.existsSync(PARSED_FILE)) {
    console.error('❌ Error: parsed-companies.json not found');
    console.log('   Please run: npm run parse first\n');
    return;
  }

  // Load parsed data
  console.log(`📖 Reading: ${PARSED_FILE}`);
  const parsedCompanies = JSON.parse(fs.readFileSync(PARSED_FILE, 'utf8'));
  console.log(`   Found ${parsedCompanies.length} companies\n`);

  // Transform
  console.log('🔄 Transforming to TradeNest schema...');
  const transformedCompanies = parsedCompanies.map(transformCompany);
  console.log(`✅ Transformed ${transformedCompanies.length} companies\n`);

  // Generate TypeScript file
  console.log('📝 Generating TypeScript file...');
  const tsContent = generateTypeScriptFile(transformedCompanies);
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

  const withAddress = transformedCompanies.filter(c => c.metadata.address).length;
  const withPhone = transformedCompanies.filter(c => c.metadata.telephone).length;
  const withEmail = transformedCompanies.filter(c => c.metadata.email).length;
  const withWebsite = transformedCompanies.filter(c => c.metadata.website).length;

  console.log('\nData completeness:');
  console.log(`  With address: ${withAddress} (${Math.round(withAddress/transformedCompanies.length*100)}%)`);
  console.log(`  With phone: ${withPhone} (${Math.round(withPhone/transformedCompanies.length*100)}%)`);
  console.log(`  With email: ${withEmail} (${Math.round(withEmail/transformedCompanies.length*100)}%)`);
  console.log(`  With website: ${withWebsite} (${Math.round(withWebsite/transformedCompanies.length*100)}%)`);

  console.log('\n' + '='.repeat(70) + '\n');

  console.log('📝 NEXT STEPS:');
  console.log('1. Review: lib/mock-data/matrade-companies.ts');
  console.log('2. Update your seed.ts to import MATRADE_COMPANIES');
  console.log('3. Run: npm run seed (from project root)\n');
}

// Run transformer
transformData().catch(console.error);
