/**
 * Seed HS Codes
 * Import sample HS codes with tariff data for testing
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

// Sample HS codes data matching the existing frontend data
const HS_CODES_DATA = [
  {
    code8: '72080000',
    code10: null,
    chapter: '72',
    heading: '7208',
    subheading: null,
    description: 'Hot-rolled flat products of iron or non-alloy steel',
    unit: 'tonnes',
    category: 'Steel & Metals',
    keywords: ['steel', 'hot-rolled', 'iron', 'flat products', 'metal'],
  },
  {
    code8: '85171100',
    code10: null,
    chapter: '85',
    heading: '8517',
    subheading: '851711',
    description: 'Telephone sets, including telephones for cellular networks or for other wireless networks',
    unit: 'units',
    category: 'Electronics',
    keywords: ['telephone', 'mobile', 'cellphone', 'electronics', 'communication'],
  },
  {
    code8: '39031000',
    code10: null,
    chapter: '39',
    heading: '3903',
    subheading: '390310',
    description: 'Polymers of propylene or of other olefins, in primary forms',
    unit: 'kg',
    category: 'Chemicals',
    keywords: ['polymer', 'propylene', 'plastic', 'chemicals', 'resin'],
  },
  {
    code8: '61099000',
    code10: null,
    chapter: '61',
    heading: '6109',
    subheading: '610990',
    description: 'T-shirts, singlets and other vests, knitted or crocheted',
    unit: 'pieces',
    category: 'Textiles & Apparel',
    keywords: ['tshirt', 'singlet', 'vest', 'knitted', 'apparel', 'clothing'],
  },
  {
    code8: '87042300',
    code10: null,
    chapter: '87',
    heading: '8704',
    subheading: '870423',
    description: 'Motor vehicles for the transport of goods',
    unit: 'units',
    category: 'Automotive',
    keywords: ['truck', 'van', 'motor vehicle', 'goods vehicle', 'automotive'],
  },
  {
    code8: '72011000',
    code10: null,
    chapter: '72',
    heading: '7201',
    subheading: '720110',
    description: 'Pig iron and spiegeleisen in pigs, blocks or other primary forms (Non-alloy pig iron)',
    unit: 'kg',
    category: 'Steel & Metals',
    keywords: ['pig iron', 'steel', 'metal', 'ingot', 'primary form'],
  },
];

async function seedHSCodes() {
  console.log('Starting HS codes seed...');

  try {
    // First, get tariff type IDs
    const { data: tariffTypes, error: ttError } = await supabase
      .from('tariff_types')
      .select('id, code');

    if (ttError || !tariffTypes) {
      console.error('Error fetching tariff types:', ttError);
      throw new Error('Failed to fetch tariff types');
    }

    const pdk2024Id = tariffTypes.find(tt => tt.code === 'PDK2024')?.id;
    const pdk2022Id = tariffTypes.find(tt => tt.code === 'PDK2022')?.id;

    if (!pdk2024Id || !pdk2022Id) {
      throw new Error('PDK tariff types not found. Run seed-tariff-types.js first.');
    }

    console.log(`Found ${tariffTypes.length} tariff types`);

    // Insert HS codes
    const { data: insertedCodes, error: insertError } = await supabase
      .from('hs_codes')
      .upsert(HS_CODES_DATA, { onConflict: 'code8' })
      .select();

    if (insertError) {
      console.error('Error inserting HS codes:', insertError);
      throw insertError;
    }

    console.log(`✓ Inserted/Upserted ${insertedCodes.length} HS codes`);

    // Insert duty rates for each code
    const dutyRates = [];
    for (const hsCode of insertedCodes) {
      // PDK 2024 rates
      dutyRates.push({
        hs_code_id: hsCode.id,
        tariff_type_id: pdk2024Id,
        ad_valorem: getRateForCode(hsCode.code8, 2024),
        specific: null,
        effective_from: '2024-01-01',
        effective_to: null,
      });

      // PDK 2022 rates (if different)
      dutyRates.push({
        hs_code_id: hsCode.id,
        tariff_type_id: pdk2022Id,
        ad_valorem: getRateForCode(hsCode.code8, 2022),
        specific: null,
        effective_from: '2022-01-01',
        effective_to: '2023-12-31',
      });
    }

    // Insert duty rates
    const { error: ratesError } = await supabase
      .from('duty_rates')
      .upsert(dutyRates, { onConflict: 'hs_code_id,tariff_type_id,effective_from' });

    if (ratesError) {
      console.error('Error inserting duty rates:', ratesError);
      throw ratesError;
    }

    console.log(`✓ Inserted ${dutyRates.length} duty rates`);

    // Insert indirect tax data (SST rates)
    const indirectTaxes = insertedCodes.map(code => ({
      hs_code_id: code.id,
      sst_rate: code.category === 'Electronics' ? 6.0 : code.category === 'Textiles & Apparel' ? 6.0 : null,
      excise_rate: null,
      sst_note: code.category === 'Electronics' ? 'Standard SST rate applies' : null,
      excise_note: null,
    }));

    const { error: taxError } = await supabase
      .from('indirect_tax')
      .upsert(indirectTaxes, { onConflict: 'hs_code_id' });

    if (taxError) {
      console.error('Error inserting indirect tax:', taxError);
      throw taxError;
    }

    console.log(`✓ Inserted ${indirectTaxes.length} indirect tax records`);

    console.log('\n✓ HS Codes seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  - HS Codes: ${insertedCodes.length}`);
    console.log(`  - Duty Rates: ${dutyRates.length}`);
    console.log(`  - Indirect Tax: ${indirectTaxes.length}`);

    return { success: true, data: insertedCodes };
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Helper function to get tariff rate based on code
function getRateForCode(code8, year) {
  const rates = {
    '72080000': year === 2024 ? 10.0 : year === 2022 ? 10.0 : 10.0,
    '85171100': year === 2024 ? 10.0 : year === 2022 ? 10.0 : 10.0,
    '39031000': year === 2024 ? 5.0 : year === 2022 ? 5.0 : 5.0,
    '61099000': year === 2024 ? 30.0 : year === 2022 ? 30.0 : 30.0,
    '87042300': year === 2024 ? 30.0 : year === 2022 ? 30.0 : 30.0,
    '72011000': year === 2024 ? 0.0 : year === 2022 ? 0.0 : 0.0,
  };
  return rates[code8] || 0.0;
}

// Run the seed
seedHSCodes();

