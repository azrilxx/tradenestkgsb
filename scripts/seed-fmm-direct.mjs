/**
 * Direct FMM Company Database Seeder
 * Runs independently without Next.js dependencies
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Load scraped FMM companies
const scrapedDataPath = path.join(__dirname, '../lib/mock-data/fmm-companies-scraped.ts');

// Parse TypeScript file to extract company data
let companies = [];

if (fs.existsSync(scrapedDataPath)) {
  const content = fs.readFileSync(scrapedDataPath, 'utf8');

  // Extract the JSON array from the TypeScript file
  const match = content.match(/export const FMM_COMPANIES_SCRAPED[^=]*=\s*(\[[\s\S]*?\]);/);

  if (match) {
    // Use eval to parse the array (safe here since we control the file)
    companies = eval(match[1]);
  }
}

console.log('🌱 Starting FMM Company Database Seeding...\n');
console.log(`Found ${companies.length} scraped companies\n`);

async function seedCompanies() {
  if (companies.length === 0) {
    console.log('⚠️  No companies to seed. Run the scraper first.');
    return;
  }

  try {
    // Transform for database
    const companiesToInsert = companies.map(c => ({
      name: c.name,
      country: c.country,
      type: c.type,
      sector: c.sector
    }));

    console.log('📊 Company breakdown by sector:');
    const sectorCounts = {};
    companiesToInsert.forEach(c => {
      sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
    });
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count}`);
    });

    console.log('\n🔄 Inserting companies into database...\n');

    const { data, error } = await supabase
      .from('companies')
      .insert(companiesToInsert)
      .select();

    if (error) {
      console.error('❌ Error inserting companies:', error);
      throw error;
    }

    console.log('\n✅ Success!');
    console.log(`   Inserted ${data?.length} FMM companies into database\n`);

    console.log('📋 Sample companies inserted:');
    data?.slice(0, 5).forEach((company, i) => {
      console.log(`   ${i + 1}. ${company.name} (${company.sector})`);
    });

    if (data && data.length > 5) {
      console.log(`   ... and ${data.length - 5} more`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(70));
    console.log(`Total real FMM companies in database: ${data?.length}`);
    console.log('\nYou can now:');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. View companies in your dashboard');
    console.log('  3. Filter by sector, type, or location');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCompanies().catch(console.error);
