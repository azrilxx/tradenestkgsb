/**
 * Check actual table structure and fix the schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAndFixSchema() {
  console.log('Checking actual table structure...\n');

  try {
    // Test what columns actually exist
    console.log('1. Testing available columns...');

    const testColumns = [
      'id',
      'currency_pair',
      'currency',
      'pair',
      'rate',
      'exchange_rate',
      'date',
      'source',
      'created_at'
    ];

    const existingColumns = [];

    for (const col of testColumns) {
      try {
        const { data, error } = await supabase
          .from('fx_rates')
          .select(col)
          .limit(1);

        if (!error) {
          existingColumns.push(col);
          console.log(`✅ Column '${col}' exists`);
        } else {
          console.log(`❌ Column '${col}' does not exist: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Column '${col}' error: ${err.message}`);
      }
    }

    console.log(`\nFound ${existingColumns.length} existing columns:`, existingColumns);

    // Try to insert with only existing columns
    if (existingColumns.length > 0) {
      console.log('\n2. Testing insert with existing columns...');

      const testData = {};

      // Map our data to existing columns
      if (existingColumns.includes('currency_pair')) {
        testData.currency_pair = 'MYR/USD';
      } else if (existingColumns.includes('currency')) {
        testData.currency = 'USD';
      } else if (existingColumns.includes('pair')) {
        testData.pair = 'MYR/USD';
      }

      if (existingColumns.includes('rate')) {
        testData.rate = 4.1905;
      } else if (existingColumns.includes('exchange_rate')) {
        testData.exchange_rate = 4.1905;
      }

      if (existingColumns.includes('date')) {
        testData.date = '2025-01-29';
      }

      if (existingColumns.includes('source')) {
        testData.source = 'BNM';
      }

      console.log('Test data:', testData);

      const { data, error } = await supabase
        .from('fx_rates')
        .insert(testData)
        .select();

      if (error) {
        console.error('❌ Insert failed:', error.message);
      } else {
        console.log('✅ Insert successful:', data);
      }
    }

    // Check if we need to add missing columns
    console.log('\n3. Checking if we need to add missing columns...');
    const requiredColumns = ['currency_pair', 'rate', 'date', 'source'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('Missing required columns:', missingColumns);
      console.log('\n💡 Solution: Run the migration to add missing columns');
      console.log('   Migration 001_initial_schema.sql should create currency_pair column');
      console.log('   Migration 018_add_data_source_tracking.sql should add source column');
    } else {
      console.log('✅ All required columns exist');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAndFixSchema().catch(console.error);
