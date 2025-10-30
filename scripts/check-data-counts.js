/**
 * Check data counts in the database
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataCounts() {
  console.log('📊 Checking data counts in database...\n');

  const tables = [
    'products',
    'companies',
    'ports',
    'shipments',
    'anomalies',
    'alerts',
    'fx_rates',
    'price_data',
    'tariff_data',
    'trade_statistics',
    'gazettes',
    'custom_rules',
    'rule_executions'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.push({ table, count: 0, error: error.message });
      } else {
        results.push({ table, count: count || 0 });
      }
    } catch (err) {
      results.push({ table, count: 0, error: err.message });
    }
  }

  // Print results
  console.log('Data Counts:');
  console.log('───────────────\n');

  let totalRecords = 0;
  for (const result of results) {
    const status = result.error ? '⚠️' : '✅';
    const info = result.error ? ` (${result.error})` : `: ${result.count.toLocaleString()}`;
    console.log(`${status} ${result.table.padEnd(25)}${info}`);
    totalRecords += result.count || 0;
  }

  console.log('\n───────────────\n');
  console.log(`Total Records: ${totalRecords.toLocaleString()}\n`);

  // Check for any empty critical tables
  const criticalTables = ['shipments', 'companies', 'products'];
  const emptyCritical = results.filter(r => criticalTables.includes(r.table) && r.count === 0);

  if (emptyCritical.length > 0) {
    console.log('⚠️  Warning: The following critical tables are empty:');
    emptyCritical.forEach(r => console.log(`   - ${r.table}`));
    console.log('\n   You may need to seed the database via the setup page.');
  } else {
    console.log('✅ All critical tables have data!');
  }

  return results;
}

checkDataCounts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

