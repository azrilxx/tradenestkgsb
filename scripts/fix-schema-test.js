/**
 * Test and fix database schema issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSchema() {
  console.log('Testing database schema...\n');

  try {
    // Test 1: Check if table exists by querying structure
    console.log('1. Testing table structure...');
    const { data, error } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Table query failed:', error.message);

      // Try to create the table if it doesn't exist
      console.log('\n2. Attempting to create fx_rates table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS fx_rates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          currency_pair VARCHAR(7) NOT NULL,
          rate DECIMAL(10,6) NOT NULL,
          date DATE NOT NULL,
          source VARCHAR(50) DEFAULT 'MOCK',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(currency_pair, date)
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (createError) {
        console.error('❌ Could not create table:', createError.message);
        console.log('\n💡 Manual fix needed:');
        console.log('   1. Check Supabase dashboard');
        console.log('   2. Run migrations manually');
        console.log('   3. Verify table exists');
        return;
      } else {
        console.log('✅ Table created successfully');
      }
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // Test 2: Try a simple insert
    console.log('\n3. Testing simple insert...');
    const testRate = {
      currency_pair: 'MYR/USD',
      rate: 4.1905,
      date: new Date().toISOString().split('T')[0],
      source: 'BNM'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('fx_rates')
      .insert(testRate)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);

      // Try alternative approach with upsert
      console.log('\n4. Trying upsert approach...');
      const { error: upsertError } = await supabase
        .from('fx_rates')
        .upsert(testRate, {
          onConflict: 'currency_pair,date',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('❌ Upsert also failed:', upsertError.message);
      } else {
        console.log('✅ Upsert successful');
      }
    } else {
      console.log('✅ Insert successful:', insertData);
    }

    // Test 3: Query existing data
    console.log('\n5. Querying existing data...');
    const { data: queryData, error: queryError } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(5);

    if (queryError) {
      console.error('❌ Query failed:', queryError.message);
    } else {
      console.log('✅ Query successful, found', queryData?.length || 0, 'records');
      if (queryData && queryData.length > 0) {
        console.log('Sample record:', queryData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSchema().catch(console.error);
