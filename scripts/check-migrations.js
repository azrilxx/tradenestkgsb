/**
 * Check which migrations have been applied to Supabase
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

async function checkMigrations() {
  console.log('🔍 Checking migration status...\n');

  // List of all migration files
  const migrations = [
    '001_initial_schema',
    '002_company_drilldown_schema',
    '003_custom_rules_schema',
    '004_gazette_tracker_schema',
    '005_trade_remedy_schema',
    '006_fmm_association_schema',
    '007_subscription_tiers',
    '008_intelligence_webhooks',
    '008_performance_indexes',
    '009_fix_anomalies_details',
    '010_fix_anomalies_schema',
    '012_fix_shipments_rls_policies',
    '013_add_missing_shipment_columns',
    '014_fix_shipment_details_view_permissions',
    '015_gazette_industry_analytics',
    '016_gazette_complete',
    '017_hs_tariff_schema',
    '018_add_data_source_tracking',
    '019_trade_statistics'
  ];

  console.log('Checking for key tables from migrations:\n');

  const tablesToCheck = [
    // 001
    'products', 'tariff_data', 'price_data', 'fx_rates', 'freight_index', 'anomalies', 'alerts',
    // 002
    'companies', 'ports', 'shipments',
    // 003
    'custom_rules', 'rule_executions',
    // 004
    'gazettes', 'gazette_affected_items',
    // 005
    'trade_remedies', 'trade_remedy_applications',
    // 006
    'associations', 'association_members',
    // 007
    'user_subscriptions', 'intelligence_analysis_usage',
    // 017
    'hs_tariff_rules', 'trade_agreements',
    // 018
    'data_sources',
    // 019
    'trade_statistics'
  ];

  const results = [];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116') {
          results.push({ table, exists: false, error: 'Table not found' });
        } else {
          results.push({ table, exists: false, error: error.message });
        }
      } else {
        results.push({ table, exists: true, count: data === null ? 0 : 'N/A' });
      }
    } catch (err) {
      results.push({ table, exists: false, error: err.message });
    }
  }

  // Print results
  console.log('Table Status:');
  console.log('───────────────\n');

  let allExist = true;
  for (const result of results) {
    const status = result.exists ? '✅' : '❌';
    const info = result.exists ? '' : ` (${result.error})`;
    console.log(`${status} ${result.table}${info}`);
    if (!result.exists) allExist = false;
  }

  console.log('\n───────────────\n');

  if (allExist) {
    console.log('✅ All migrations appear to have been applied!');
    console.log('   You can proceed to test the data refresh.');
  } else {
    console.log('⚠️  Some migrations have not been applied.');
    console.log('   You need to run the missing migrations in Supabase.');
    console.log('\n   Steps:');
    console.log('   1. Go to: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/sql/new');
    console.log('   2. Copy the contents of supabase/migrations/XXX_migration_name.sql');
    console.log('   3. Paste into SQL Editor and run');
  }

  return allExist;
}

checkMigrations()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

