/**
 * Import MATRADE Data to Database
 * Parses and imports all CSV files from MATRADE downloads directory
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { parseAllMatradeData } = require('../lib/data-sources/matrade-parser.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function importMatradeData() {
  console.log('🔄 Starting MATRADE data import...');
  console.log('📁 Parsing CSV files...');

  try {
    // Parse all MATRADE CSV files
    const statistics = parseAllMatradeData();

    if (statistics.length === 0) {
      console.error('❌ No data parsed from CSV files');
      process.exit(1);
    }

    console.log(`\n✅ Parsed ${statistics.length} trade statistics records`);
    console.log('💾 Inserting into database...');

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < statistics.length; i += BATCH_SIZE) {
      const batch = statistics.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(statistics.length / BATCH_SIZE);

      try {
        const { error } = await supabase.from('trade_statistics').insert(batch);

        if (error) {
          console.error(`❌ Error inserting batch ${batchNum}/${totalBatches}:`, error.message);
          failed += batch.length;
        } else {
          inserted += batch.length;
          console.log(`✅ Batch ${batchNum}/${totalBatches}: ${batch.length} records`);
        }
      } catch (error) {
        console.error(`❌ Exception inserting batch ${batchNum}/${totalBatches}:`, error);
        failed += batch.length;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 MATRADE Import Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully inserted: ${inserted} records`);
    console.log(`❌ Failed: ${failed} records`);
    console.log(`📈 Total processed: ${statistics.length} records`);
    console.log('='.repeat(50));

    // Verify import
    const { data: verifyData, error: verifyError } = await supabase
      .from('trade_statistics')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.error('⚠️  Warning: Could not verify import:', verifyError.message);
    } else {
      console.log('✅ Database verification: records found in trade_statistics table');
    }

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importMatradeData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

