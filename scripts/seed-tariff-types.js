/**
 * Seed Tariff Types
 * Inserts all trade agreements into the tariff_types table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env or .env.local');
  process.exit(1);
}

// Use service role key for admin operations like seeding
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARIFF_TYPES = [
  { code: 'PDK2022', name: 'Perintah Duti Kastam 2022 (MFN)', version_date: '2022-01-01', legal_ref: 'P.U. (A) 1/2022' },
  { code: 'PDK2024', name: 'Perintah Duti Kastam 2024 (MFN)', version_date: '2024-01-01', legal_ref: 'P.U. (A) 1/2024' },
  { code: 'ATIGA', name: 'ASEAN Trade in Goods Agreement', version_date: '2022-01-01', legal_ref: 'ASEAN Agreement' },
  { code: 'ACFTA', name: 'ASEAN-China Free Trade Agreement', version_date: '2010-01-01', legal_ref: 'ACFTA Agreement' },
  { code: 'AHKFTA', name: 'ASEAN-Hong Kong Free Trade Agreement', version_date: '2019-06-17', legal_ref: 'AHKFTA Agreement' },
  { code: 'MPCEPA', name: 'Malaysia-Pakistan Closer Economic Partnership Agreement', version_date: '2008-01-01', legal_ref: 'MPCEPA Agreement' },
  { code: 'AKFTA', name: 'ASEAN-Korea Free Trade Agreement', version_date: '2010-01-01', legal_ref: 'AKFTA Agreement' },
  { code: 'AJCEP', name: 'ASEAN-Japan Comprehensive Economic Partnership', version_date: '2008-12-01', legal_ref: 'AJCEP Agreement' },
  { code: 'AANZFTA', name: 'ASEAN-Australia-New Zealand Free Trade Agreement', version_date: '2010-01-01', legal_ref: 'AANZFTA Agreement' },
  { code: 'AINDFTA', name: 'ASEAN-India Free Trade Agreement', version_date: '2010-01-01', legal_ref: 'AINDFTA Agreement' },
  { code: 'MNZFTA', name: 'Malaysia-New Zealand Free Trade Agreement', version_date: '2010-08-01', legal_ref: 'MNZFTA Agreement' },
  { code: 'MICECA', name: 'Malaysia-India Comprehensive Economic Cooperation Agreement', version_date: '2011-07-01', legal_ref: 'MICECA Agreement' },
  { code: 'D8PTA', name: 'Developing Eight (D-8) Preferential Tariff Agreement', version_date: '2011-08-01', legal_ref: 'D-8 PTA Agreement' },
  { code: 'MCFTA', name: 'Malaysia-Chile Free Trade Agreement', version_date: '2012-06-01', legal_ref: 'MCFTA Agreement' },
  { code: 'MAFTA', name: 'Malaysia-Australia Free Trade Agreement', version_date: '2013-01-01', legal_ref: 'MAFTA Agreement' },
  { code: 'MTFTA', name: 'Malaysia-Turkey Free Trade Agreement', version_date: '2015-08-01', legal_ref: 'MTFTA Agreement' },
  { code: 'RCEP', name: 'Regional Comprehensive Economic Partnership', version_date: '2022-03-18', legal_ref: 'RCEP Agreement' },
  { code: 'CPTPP', name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership', version_date: '2018-12-30', legal_ref: 'CPTPP Agreement' },
  { code: 'TPS-OIC', name: 'Trade Preferential System among the Member States of the Organisation of the Islamic Conference', version_date: '2003-01-01', legal_ref: 'TPS-OIC Agreement' },
  { code: 'MY-UAE-CEPA', name: 'Malaysia-United Arab Emirates Comprehensive Economic Partnership Agreement', version_date: '2023-05-31', legal_ref: 'MY-UAE-CEPA Agreement' },
];

async function seedTariffTypes() {
  console.log('Starting tariff types seed...');

  try {
    // Check if data already exists
    const { count } = await supabase
      .from('tariff_types')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      console.log(`Found ${count} existing tariff types. Clearing...`);
      const { error: deleteError } = await supabase
        .from('tariff_types')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
        throw deleteError;
      }
    }

    // Insert tariff types
    const { data, error } = await supabase
      .from('tariff_types')
      .insert(TARIFF_TYPES)
      .select();

    if (error) {
      console.error('Error seeding tariff types:', error);
      throw error;
    }

    console.log(`✓ Successfully seeded ${data.length} tariff types`);
    console.log('\nTariff Types:');
    data.forEach(tt => {
      console.log(`  - ${tt.code}: ${tt.name}`);
    });

    return data;
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedTariffTypes();

