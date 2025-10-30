/**
 * Check the actual fx_rates table structure and adapt our code
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function discoverActualSchema() {
  console.log('Discovering actual fx_rates table schema...\n');

  try {
    // Test more column names to find the actual structure
    const possibleColumns = [
      'target_currency',
      'base_currency',
      'from_currency',
      'to_currency',
      'currency_code',
      'currency_name',
      'pair_name',
      'fx_pair',
      'exchange_pair'
    ];

    console.log('1. Testing additional column names...');
    const actualColumns = ['id', 'rate', 'date', 'source', 'created_at']; // Known columns

    for (const col of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('fx_rates')
          .select(col)
          .limit(1);

        if (!error) {
          actualColumns.push(col);
          console.log(`✅ Column '${col}' exists`);
        } else {
          console.log(`❌ Column '${col}' does not exist`);
        }
      } catch (err) {
        console.log(`❌ Column '${col}' error`);
      }
    }

    console.log(`\nActual columns: ${actualColumns.join(', ')}`);

    // Try to insert with the correct schema
    console.log('\n2. Testing insert with correct schema...');

    const testData = {
      rate: 4.1905,
      date: '2025-01-29',
      source: 'BNM'
    };

    // Add target_currency if it exists
    if (actualColumns.includes('target_currency')) {
      testData.target_currency = 'USD';
    }

    console.log('Test data:', testData);

    const { data, error } = await supabase
      .from('fx_rates')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Insert failed:', error.message);

      // Try to get more info about the constraint
      if (error.message.includes('not-null constraint')) {
        console.log('\n💡 The table requires additional non-null columns');
        console.log('   We need to identify what columns are required');
      }
    } else {
      console.log('✅ Insert successful:', data);
    }

    // Try to query existing data to see the structure
    console.log('\n3. Querying existing data to see structure...');
    const { data: existingData, error: queryError } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('❌ Query failed:', queryError.message);
    } else if (existingData && existingData.length > 0) {
      console.log('✅ Found existing data structure:');
      console.log(JSON.stringify(existingData[0], null, 2));
    } else {
      console.log('ℹ️  No existing data found');
    }

  } catch (error) {
    console.error('❌ Discovery failed:', error);
  }
}

discoverActualSchema().catch(console.error);
