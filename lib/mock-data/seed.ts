import { createClient } from '@supabase/supabase-js';
import { MOCK_PRODUCTS } from './products';
import { FMM_COMPANIES } from './fmm-companies';
import { FMM_COMPANIES_SCRAPED } from './fmm-companies-scraped';
import { MALAYSIA_PORTS } from './malaysia-ports';
import { generateMalaysiaShipments } from './malaysia-shipments';
import { MOCK_CUSTOM_RULES, generateRuleExecutions } from './custom-rules';
import { generateSubscriptions, generateIntelligenceUsage } from './subscriptions';
import {
  generatePriceData,
  generateTariffData,
  generateFxRates,
  generateFreightIndex,
  generateDemoAnomalies,
  getHistoricalDateRange,
  randomInRange,
} from './generators';
import { subDays } from 'date-fns';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseClient = serviceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

if (!supabaseClient) {
  throw new Error('Missing Supabase configuration for seeding');
}

const supabase = supabaseClient!;

/**
 * Main seeding function - populates database with mock data
 */
export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Step 0: Fix anomalies schema (add description, make product_id nullable)
    console.log('🔧 Checking and fixing anomalies table schema...');
    try {
      // Check if description column exists
      const { data: checkDesc, error: checkError } = await supabase
        .from('anomalies')
        .select('description')
        .limit(1);

      if (checkError && checkError.message.includes('column "description" does not exist')) {
        console.log('  Adding description column...');
        // We can't run DDL directly, but we can log the SQL
        console.log('  ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log('  ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS description TEXT;');
        console.log('  ALTER TABLE anomalies ALTER COLUMN product_id DROP NOT NULL;');
      } else {
        console.log('  ✅ Schema looks good or will be handled by constraints');
      }
    } catch (schemaError) {
      console.log('  ⚠️  Schema check failed, will attempt seeding anyway');
    }

    // Step 1: Insert Products
    console.log('📦 Inserting products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert(MOCK_PRODUCTS, { onConflict: 'hs_code', ignoreDuplicates: false })
      .select();

    if (productsError) {
      console.error('Error inserting products:', productsError);
      throw productsError;
    }

    console.log(`✅ Inserted ${products?.length} products`);

    // Step 2: Insert FMM Companies (both mock and scraped)
    console.log('🏢 Inserting FMM companies...');

    // Combine mock companies with scraped real companies
    const scrapedCompaniesForDB = FMM_COMPANIES_SCRAPED.map(c => ({
      name: c.name,
      country: c.country,
      type: c.type,
      sector: c.sector
    }));

    const allCompanies = [...FMM_COMPANIES, ...scrapedCompaniesForDB];

    console.log(`   Mock companies: ${FMM_COMPANIES.length}`);
    console.log(`   Scraped FMM companies: ${FMM_COMPANIES_SCRAPED.length}`);
    console.log(`   Total to insert: ${allCompanies.length}`);

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert(allCompanies)
      .select();

    if (companiesError) {
      console.error('Error inserting companies:', companiesError);
      throw companiesError;
    }

    console.log(`✅ Inserted ${companies?.length} FMM companies (${FMM_COMPANIES_SCRAPED.length} real + ${FMM_COMPANIES.length} mock)`);

    // Step 3: Insert Malaysia Ports
    console.log('🚢 Inserting Malaysia ports...');
    const { data: ports, error: portsError } = await supabase
      .from('ports')
      .upsert(MALAYSIA_PORTS, { onConflict: 'code', ignoreDuplicates: false })
      .select();

    if (portsError) {
      console.error('Error inserting ports:', portsError);
      throw portsError;
    }

    console.log(`✅ Inserted ${ports?.length} ports`);

    // Step 4: Generate historical data
    const { startDate, endDate } = getHistoricalDateRange();
    console.log(`📅 Generating 6 months of data (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);

    // Step 3: Insert Price Data with anomalies
    console.log('💰 Generating price data...');
    const allPriceData = [];

    if (products) {
      for (const product of products.slice(0, 30)) { // Seed first 30 products
        const basePrice = randomInRange(100, 5000);

        // Some products get anomalies
        const shouldHaveAnomaly = Math.random() > 0.7; // 30% chance
        const anomalyConfig = shouldHaveAnomaly
          ? { date: subDays(endDate, Math.floor(Math.random() * 10)), multiplier: randomInRange(1.5, 2.5) }
          : undefined;

        const priceData = generatePriceData(
          product.id,
          basePrice,
          startDate,
          endDate,
          anomalyConfig
        );

        allPriceData.push(...priceData);
      }
    }

    // Insert in batches to avoid payload size limits
    const batchSize = 500;
    for (let i = 0; i < allPriceData.length; i += batchSize) {
      const batch = allPriceData.slice(i, i + batchSize);
      const { error } = await supabase.from('price_data').insert(batch);
      if (error) {
        console.error('Error inserting price data batch:', error);
      }
    }
    console.log(`✅ Inserted ${allPriceData.length} price records`);

    // Step 4: Insert Tariff Data
    console.log('📊 Generating tariff data...');
    const allTariffData = [];

    if (products) {
      for (const product of products.slice(0, 30)) {
        const baseRate = randomInRange(0, 25);

        // Some products get tariff changes
        const shouldHaveChange = Math.random() > 0.8; // 20% chance
        const changes = shouldHaveChange
          ? [{ date: subDays(endDate, Math.floor(Math.random() * 60)), newRate: randomInRange(5, 30) }]
          : undefined;

        const tariffData = generateTariffData(
          product.id,
          baseRate,
          startDate,
          endDate,
          changes
        );

        allTariffData.push(...tariffData);
      }
    }

    const { error: tariffError } = await supabase.from('tariff_data').insert(allTariffData);
    if (tariffError) {
      console.error('Error inserting tariff data:', tariffError);
    } else {
      console.log(`✅ Inserted ${allTariffData.length} tariff records`);
    }

    // Step 5: Insert FX Rates
    console.log('💱 Generating FX rates...');
    const fxPairs = [
      { pair: 'MYR/USD', rate: 4.56 },
      { pair: 'MYR/CNY', rate: 0.63 },
      { pair: 'MYR/EUR', rate: 4.98 },
      { pair: 'MYR/SGD', rate: 3.38 },
      { pair: 'MYR/JPY', rate: 0.031 },
    ];

    const allFxData = [];
    for (const { pair, rate } of fxPairs) {
      const fxData = generateFxRates(pair, rate, startDate, endDate, 0.02);
      allFxData.push(...fxData);
    }

    for (let i = 0; i < allFxData.length; i += batchSize) {
      const batch = allFxData.slice(i, i + batchSize);
      const { error } = await supabase.from('fx_rates').insert(batch);
      if (error) {
        console.error('Error inserting FX data batch:', error);
      }
    }
    console.log(`✅ Inserted ${allFxData.length} FX rate records`);

    // Step 6: Insert Freight Index
    console.log('🚢 Generating freight index data...');
    const routes = [
      { route: 'China-Malaysia', baseIndex: 1200 },
      { route: 'Europe-Malaysia', baseIndex: 2100 },
      { route: 'USA-Malaysia', baseIndex: 1800 },
      { route: 'Singapore-Malaysia', baseIndex: 400 },
      { route: 'Thailand-Malaysia', baseIndex: 350 },
    ];

    const allFreightData = [];
    for (const { route, baseIndex } of routes) {
      // Add some freight spikes
      const shouldHaveSpike = Math.random() > 0.7;
      const spikes = shouldHaveSpike
        ? [{ date: subDays(endDate, Math.floor(Math.random() * 10)), multiplier: randomInRange(1.3, 1.6) }]
        : undefined;

      const freightData = generateFreightIndex(route, baseIndex, startDate, endDate, spikes);
      allFreightData.push(...freightData);
    }

    for (let i = 0; i < allFreightData.length; i += batchSize) {
      const batch = allFreightData.slice(i, i + batchSize);
      const { error } = await supabase.from('freight_index').insert(batch);
      if (error) {
        console.error('Error inserting freight data batch:', error);
      }
    }
    console.log(`✅ Inserted ${allFreightData.length} freight index records`);

    // Step 7: Generate Malaysia Shipments
    console.log('📦 Generating Malaysia shipment data...');
    let shipments: any[] = [];
    let shipmentsInserted = 0;
    if (companies && ports && products) {
      shipments = generateMalaysiaShipments(
        companies,
        ports,
        products,
        startDate,
        endDate,
        2000 // Generate 2000 shipments (increased from 800)
      );

      // Insert shipments in batches
      const shipmentBatchSize = 100;
      let totalInserted = 0;
      let failedBatches = 0;
      for (let i = 0; i < shipments.length; i += shipmentBatchSize) {
        const batch = shipments.slice(i, i + shipmentBatchSize);
        const batchNum = i / shipmentBatchSize + 1;
        const { data, error } = await supabase.from('shipments').insert(batch).select();
        if (error) {
          failedBatches++;
          console.error(`❌ Error inserting shipment batch ${batchNum}/${Math.ceil(shipments.length / shipmentBatchSize)}:`);
          console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
          console.error(`   Error Message: ${error.message}`);
          console.error(`   Error Hint: ${error.hint || 'No hint provided'}`);
          console.error(`   Error Details: ${error.details || 'No details provided'}`);
          console.error('   First item in batch:', JSON.stringify(batch[0], null, 2));
        } else {
          totalInserted += data?.length || 0;
          console.log(`  ✓ Batch ${batchNum}: Inserted ${data?.length || 0} shipments`);
        }
      }
      if (failedBatches > 0) {
        console.error(`❌ Shipments insertion had ${failedBatches} failed batches`);
        console.error(`   Total inserted: ${totalInserted} of ${shipments.length} expected`);
      } else {
        console.log(`✅ Inserted ${totalInserted} of ${shipments.length} shipment records`);
      }

      // Store the actual inserted count
      shipmentsInserted = totalInserted;
    }

    // Step 8: Insert Anomalies
    console.log('🚨 Generating anomalies...');
    const anomalies = generateDemoAnomalies(100);
    console.log(`✅ Generated ${anomalies.length} anomalies`);

    // Map product placeholders to real IDs
    const anomaliesWithRealIds = anomalies.map((anomaly) => {
      if (anomaly.product_id && products && products.length > 0) {
        // Extract category hint from the fake product_id
        const fakeId = anomaly.product_id;

        // Map category hints to actual product categories
        let categoryMatch: string | null = null;
        if (fakeId.includes('electronics')) categoryMatch = 'Electronics';
        else if (fakeId.includes('textiles')) categoryMatch = 'Textiles';
        else if (fakeId.includes('agriculture') || fakeId.includes('palm-oil')) categoryMatch = 'Agriculture';
        else if (fakeId.includes('automotive')) categoryMatch = 'Automotive';
        else if (fakeId.includes('furniture')) categoryMatch = 'Furniture';
        else if (fakeId.includes('rubber')) categoryMatch = 'Rubber';
        else if (fakeId.includes('chemicals')) categoryMatch = 'Chemicals';
        else if (fakeId.includes('petroleum')) categoryMatch = 'Petroleum';
        else if (fakeId.includes('machinery')) categoryMatch = 'Machinery';
        else if (fakeId.includes('food')) categoryMatch = 'Food';

        // Find a matching product
        const matchedProduct = categoryMatch
          ? products.find((p) => p.category === categoryMatch)
          : null;

        // If no match, pick a random product
        const productToUse = matchedProduct || products[Math.floor(Math.random() * products.length)];

        return {
          ...anomaly,
          product_id: productToUse?.id || null,
        };
      }
      return { ...anomaly, product_id: null };
    });

    console.log(`📤 Inserting ${anomaliesWithRealIds.length} anomalies into database...`);
    console.log(`Sample anomaly:`, JSON.stringify(anomaliesWithRealIds[0], null, 2));

    const { data: insertedAnomalies, error: anomalyError } = await supabase
      .from('anomalies')
      .insert(anomaliesWithRealIds)
      .select();

    if (anomalyError) {
      console.error('❌ Error inserting anomalies:', JSON.stringify(anomalyError, null, 2));

      // Check if it's a missing column error
      if (anomalyError.message && anomalyError.message.includes("details' column")) {
        console.error('\n❌ ISSUE: The anomalies table is missing the "details" column.');
        console.error('📝 SOLUTION: Run this SQL in your Supabase SQL Editor:');
        console.error('   ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT \'{}\';');
        console.error('   Then run the seed again.\n');
      }

      throw new Error(`Failed to insert anomalies: ${JSON.stringify(anomalyError)}`);
    } else {
      console.log(`✅ Inserted ${insertedAnomalies?.length} anomalies`);
    }

    // Step 8: Insert Alerts for Anomalies
    console.log('🔔 Creating alerts...');
    if (insertedAnomalies) {
      const alerts = insertedAnomalies.map((anomaly) => ({
        anomaly_id: anomaly.id,
        status: 'new' as const,
      }));

      const { error: alertError } = await supabase.from('alerts').insert(alerts);
      if (alertError) {
        console.error('Error inserting alerts:', alertError);
      } else {
        console.log(`✅ Created ${alerts.length} alerts`);
      }
    }

    // Step 9: Insert Custom Rules
    console.log('📋 Inserting custom rules...');

    if (!MOCK_CUSTOM_RULES || MOCK_CUSTOM_RULES.length === 0) {
      console.log('⚠️ No custom rules to insert');
    } else {
      // Insert in smaller batches to avoid payload limits
      const batchSize = 5;
      let totalInserted = 0;

      for (let i = 0; i < MOCK_CUSTOM_RULES.length; i += batchSize) {
        const batch = MOCK_CUSTOM_RULES.slice(i, i + batchSize);
        const { data: batchRules, error: batchError } = await supabase
          .from('custom_rules')
          .insert(batch)
          .select();

        if (batchError) {
          console.error(`Error inserting custom rules batch ${i / batchSize + 1}:`, batchError);
        } else {
          totalInserted += batchRules?.length || 0;
        }
      }

      console.log(`✅ Inserted ${totalInserted} custom rules`);
    }

    // Get the inserted rules for next step
    const { data: insertedRules } = await supabase
      .from('custom_rules')
      .select('id');

    // Step 10: Insert Rule Executions
    console.log('⚙️ Generating rule executions...');
    let insertedExecutions = 0;
    if (insertedRules && insertedRules.length > 0) {
      const ruleIds = insertedRules.map(r => r.id);
      const executions = generateRuleExecutions(ruleIds, 30);

      const { error: executionsError } = await supabase
        .from('rule_executions')
        .insert(executions);

      if (executionsError) {
        console.error('Error inserting rule executions:', executionsError);
      } else {
        insertedExecutions = executions.length;
        console.log(`✅ Inserted ${insertedExecutions} rule executions`);
      }
    }

    // Step 11: Insert User Subscriptions
    console.log('💳 Inserting user subscriptions...');
    const subscriptions = generateSubscriptions();
    const { data: insertedSubscriptions, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptions)
      .select();

    if (subscriptionError) {
      console.error('Error inserting subscriptions:', subscriptionError);
    } else {
      console.log(`✅ Inserted ${insertedSubscriptions?.length} user subscriptions`);
    }

    // Step 12: Insert Intelligence Usage Data
    console.log('📊 Generating intelligence usage data...');
    let insertedUsage = 0;
    if (insertedAnomalies && insertedAnomalies.length > 0) {
      // Get alert IDs that were created from anomalies
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('id')
        .limit(insertedAnomalies.length);

      const alertIds = alertsData ? alertsData.map(a => a.id) : [];
      const usage = generateIntelligenceUsage(alertIds);

      const { error: usageError } = await supabase
        .from('intelligence_analysis_usage')
        .insert(usage);

      if (usageError) {
        console.error('Error inserting intelligence usage:', usageError);
      } else {
        insertedUsage = usage.length;
        console.log(`✅ Inserted ${insertedUsage} intelligence usage records`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Products: ${products?.length || 0}`);
    console.log(`   - Companies: ${companies?.length || 0}`);
    console.log(`   - Ports: ${ports?.length || 0}`);
    console.log(`   - Shipments: ${shipments?.length || 0}`);
    console.log(`   - Price records: ${allPriceData.length}`);
    console.log(`   - Tariff records: ${allTariffData.length}`);
    console.log(`   - FX rates: ${allFxData.length}`);
    console.log(`   - Freight indexes: ${allFreightData.length}`);
    console.log(`   - Anomalies: ${insertedAnomalies?.length || 0}`);
    console.log(`   - Alerts: ${insertedAnomalies?.length || 0}`);
    console.log(`   - Custom rules: ${insertedRules?.length || 0}`);
    console.log(`   - Rule executions: ${insertedExecutions}`);
    console.log(`   - Subscriptions: ${insertedSubscriptions?.length || 0}`);
    console.log(`   - Intelligence usage: ${insertedUsage}`);

    return {
      success: true,
      stats: {
        products: products?.length || 0,
        companies: companies?.length || 0,
        ports: ports?.length || 0,
        shipments: shipmentsInserted || shipments?.length || 0,
        prices: allPriceData.length,
        tariffs: allTariffData.length,
        fxRates: allFxData.length,
        freight: allFreightData.length,
        anomalies: insertedAnomalies?.length || 0,
        alerts: insertedAnomalies?.length || 0,
        customRules: insertedRules?.length || 0,
        ruleExecutions: insertedExecutions,
        subscriptions: insertedSubscriptions?.length || 0,
        intelligenceUsage: insertedUsage,
      },
    };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code || 'UNKNOWN',
        details: (error as any)?.details || null,
        hint: (error as any)?.hint || null,
      },
    };
  }
}

/**
 * Clear all data from tables (for re-seeding)
 */
export async function clearDatabase() {
  console.log('🧹 Clearing database...');

  // Clear tables in proper order to avoid foreign key violations
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
    'products',
  ];

  for (const table of tables) {
    try {
      // First, try to delete all rows (some tables don't have created_at)
      const { error } = await supabase.from(table).delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error(`Error clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    } catch (err) {
      console.error(`Failed to clear ${table}:`, err);
    }
  }

  console.log('✅ Database cleared');
}