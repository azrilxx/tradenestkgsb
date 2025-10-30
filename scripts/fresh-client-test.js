/**
 * Fix Supabase schema cache issue by refreshing the client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Create a fresh client instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWithFreshClient() {
  console.log('Testing with fresh Supabase client...\n');

  try {
    // Test 1: Direct SQL query to verify table structure
    console.log('1. Checking table structure with SQL...');
    const { data: sqlData, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fx_rates' ORDER BY ordinal_position;"
      });

    if (sqlError) {
      console.log('SQL query not available, trying alternative...');

      // Alternative: Use a simple select to trigger schema refresh
      const { data, error } = await supabase
        .from('fx_rates')
        .select('id, currency_pair, rate, date, source, created_at')
        .limit(1);

      if (error) {
        console.error('❌ Schema refresh failed:', error.message);

        // Try with minimal fields
        console.log('\n2. Trying minimal field selection...');
        const { data: minData, error: minError } = await supabase
          .from('fx_rates')
          .select('id')
          .limit(1);

        if (minError) {
          console.error('❌ Even minimal query failed:', minError.message);
          console.log('\n💡 This suggests a deeper issue:');
          console.log('   - Table may not exist');
          console.log('   - Permissions issue');
          console.log('   - Supabase service down');
          return;
        } else {
          console.log('✅ Minimal query works - schema issue confirmed');
        }
      } else {
        console.log('✅ Schema refresh successful');
        console.log('Columns available:', Object.keys(data[0] || {}));
      }
    } else {
      console.log('✅ SQL query successful');
      console.log('Table structure:', sqlData);
    }

    // Test 2: Try insert with explicit column mapping
    console.log('\n3. Testing insert with explicit mapping...');
    const testRate = {
      currency_pair: 'MYR/USD',
      rate: 4.1905,
      date: '2025-01-29',
      source: 'BNM'
    };

    // Try different approaches
    const approaches = [
      { name: 'Direct insert', fn: () => supabase.from('fx_rates').insert(testRate) },
      { name: 'Insert with select', fn: () => supabase.from('fx_rates').insert(testRate).select() },
      { name: 'Upsert', fn: () => supabase.from('fx_rates').upsert(testRate) }
    ];

    for (const approach of approaches) {
      console.log(`   Trying ${approach.name}...`);
      const { data, error } = await approach.fn();

      if (error) {
        console.log(`   ❌ ${approach.name} failed:`, error.message);
      } else {
        console.log(`   ✅ ${approach.name} successful!`);
        console.log('   Data:', data);
        break; // Success, no need to try others
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithFreshClient().catch(console.error);
