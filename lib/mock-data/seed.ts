import { supabase } from '@/lib/supabase/client';
import { MOCK_PRODUCTS } from './products';
import { FMM_COMPANIES } from './fmm-companies';
import { MALAYSIA_PORTS } from './malaysia-ports';
import { generateMalaysiaShipments } from './malaysia-shipments';
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

/**
 * Main seeding function - populates database with mock data
 */
export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Step 1: Insert Products
    console.log('📦 Inserting products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(MOCK_PRODUCTS)
      .select();

    if (productsError) {
      console.error('Error inserting products:', productsError);
      throw productsError;
    }

    console.log(`✅ Inserted ${products?.length} products`);

    // Step 2: Insert FMM Companies
    console.log('🏢 Inserting FMM companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert(FMM_COMPANIES)
      .select();

    if (companiesError) {
      console.error('Error inserting companies:', companiesError);
      throw companiesError;
    }

    console.log(`✅ Inserted ${companies?.length} FMM companies`);

    // Step 3: Insert Malaysia Ports
    console.log('🚢 Inserting Malaysia ports...');
    const { data: ports, error: portsError } = await supabase
      .from('ports')
      .insert(MALAYSIA_PORTS)
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
    if (companies && ports && products) {
      const shipments = generateMalaysiaShipments(
        companies,
        ports,
        products,
        startDate,
        endDate,
        800 // Generate 800 shipments
      );

      // Insert shipments in batches
      const shipmentBatchSize = 100;
      for (let i = 0; i < shipments.length; i += shipmentBatchSize) {
        const batch = shipments.slice(i, i + shipmentBatchSize);
        const { error } = await supabase.from('shipments').insert(batch);
        if (error) {
          console.error('Error inserting shipment batch:', error);
        }
      }
      console.log(`✅ Inserted ${shipments.length} shipment records`);
    }

    // Step 8: Insert Anomalies
    console.log('🚨 Generating anomalies...');
    const anomalies = generateDemoAnomalies();

    // Map product placeholders to real IDs
    const anomaliesWithRealIds = anomalies.map((anomaly) => {
      if (anomaly.product_id && products) {
        // Map placeholder to real product ID
        const categoryMatch = anomaly.product_id.includes('electronics')
          ? 'Electronics'
          : anomaly.product_id.includes('textiles')
            ? 'Textiles'
            : anomaly.product_id.includes('palm-oil')
              ? 'Agriculture'
              : anomaly.product_id.includes('automotive')
                ? 'Automotive'
                : anomaly.product_id.includes('furniture')
                  ? 'Furniture'
                  : anomaly.product_id.includes('rubber')
                    ? 'Rubber'
                    : anomaly.product_id.includes('chemicals')
                      ? 'Chemicals'
                      : null;

        const matchedProduct = products.find((p) => p.category === categoryMatch);
        return {
          ...anomaly,
          product_id: matchedProduct?.id || null,
        };
      }
      return { ...anomaly, product_id: null };
    });

    const { data: insertedAnomalies, error: anomalyError } = await supabase
      .from('anomalies')
      .insert(anomaliesWithRealIds)
      .select();

    if (anomalyError) {
      console.error('Error inserting anomalies:', anomalyError);
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

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Products: ${products?.length || 0}`);
    console.log(`   - Companies: ${companies?.length || 0}`);
    console.log(`   - Ports: ${ports?.length || 0}`);
    console.log(`   - Shipments: 800`);
    console.log(`   - Price records: ${allPriceData.length}`);
    console.log(`   - Tariff records: ${allTariffData.length}`);
    console.log(`   - FX rates: ${allFxData.length}`);
    console.log(`   - Freight indexes: ${allFreightData.length}`);
    console.log(`   - Anomalies: ${insertedAnomalies?.length || 0}`);
    console.log(`   - Alerts: ${insertedAnomalies?.length || 0}`);

    return {
      success: true,
      stats: {
        products: products?.length || 0,
        companies: companies?.length || 0,
        ports: ports?.length || 0,
        shipments: 800,
        prices: allPriceData.length,
        tariffs: allTariffData.length,
        fxRates: allFxData.length,
        freight: allFreightData.length,
        anomalies: insertedAnomalies?.length || 0,
        alerts: insertedAnomalies?.length || 0,
      },
    };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Clear all data from tables (for re-seeding)
 */
export async function clearDatabase() {
  console.log('🧹 Clearing database...');

  const tables = [
    'alerts',
    'anomalies',
    'shipments',
    'companies',
    'ports',
    'freight_index',
    'fx_rates',
    'price_data',
    'tariff_data',
    'products',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error(`Error clearing ${table}:`, error);
    } else {
      console.log(`✅ Cleared ${table}`);
    }
  }

  console.log('✅ Database cleared');
}