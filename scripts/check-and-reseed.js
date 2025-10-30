/**
 * Check Database Status and Reseed
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 Checking Database Status...\n');

  const tables = [
    'products',
    'companies',
    'ports',
    'shipments',
    'price_data',
    'tariff_data',
    'fx_rates',
    'freight_index',
    'anomalies',
    'alerts'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${table}: Error - ${error.message}`);
    } else {
      console.log(`  ${table}: ${count || 0} records`);
    }
  }
}

async function clearDatabase() {
  console.log('\n🧹 Clearing Database...\n');

  // Order matters for foreign keys
  const tables = [
    'intelligence_analysis_usage',
    'rule_executions',
    'alerts',
    'anomalies',
    'user_subscriptions',
    'custom_rules',
    'shipments',
    'price_data',
    'tariff_data',
    'freight_index',
    'fx_rates',
    'companies',
    'ports',
    'products'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000001');
      if (error) {
        console.log(`  ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ Cleared ${table}`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${table}: Skipped`);
    }
  }
}

async function reseed() {
  console.log('\n🌱 Re-seeding Database...\n');

  try {
    // Try multiple ports in case dev server is running on different port
    const ports = ['3000', '3001', '3002', '3003', '3004'];
    let response;
    let port = 3000;

    for (const p of ports) {
      try {
        console.log(`Trying port ${p}...`);
        response = await fetch(`http://localhost:${p}/api/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' })
        });
        port = p;
        if (response.ok) break;
      } catch (e) {
        continue;
      }
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Seeding successful!\n');
      console.log('Statistics:');
      console.log(`  Products: ${data.stats.products}`);
      console.log(`  Companies: ${data.stats.companies}`);
      console.log(`  Ports: ${data.stats.ports}`);
      console.log(`  Shipments: ${data.stats.shipments}`);
      console.log(`  Price Records: ${data.stats.prices}`);
      console.log(`  Anomalies: ${data.stats.anomalies}`);
    } else {
      console.error('❌ Seeding failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Error calling seed API:', err.message);
  }
}

async function main() {
  // Step 1: Check current state
  await checkDatabase();

  // Step 2: Clear
  await clearDatabase();

  // Step 3: Reseed
  await reseed();

  // Step 4: Verify final state
  console.log('\n🔍 Final Verification...\n');
  await checkDatabase();

  console.log('\n✅ Done!');
}

main().catch(console.error);
