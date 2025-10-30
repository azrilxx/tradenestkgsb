/**
 * Data Ingestion Pipeline
 * Task 3.3: Orchestrate all data sources - BNM (daily), MATRADE (quarterly)
 * 
 * This script works standalone without requiring the Next.js API
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables  
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// BNM API Configuration
// Portal URL: https://apikijangportal.bnm.gov.my (for documentation)
// API Base URL: https://api.bnm.gov.my (for actual API calls)
const BNM_API_BASE_URL = 'https://api.bnm.gov.my/public';
const PRIORITY_CURRENCY_PAIRS = [
  { pair: 'MYR/USD', code: 'USD' },
  { pair: 'MYR/CNY', code: 'CNY' },
  { pair: 'MYR/EUR', code: 'EUR' },
  { pair: 'MYR/SGD', code: 'SGD' },
  { pair: 'MYR/JPY', code: 'JPY' },
  { pair: 'MYR/GBP', code: 'GBP' },
  { pair: 'MYR/THB', code: 'THB' },
  { pair: 'MYR/IDR', code: 'IDR' },
];

/**
 * Fetch exchange rate from BNM API
 */
async function fetchBNMExchangeRate(currencyCode) {
  try {
    // BNM uses this endpoint format for latest rates
    const endpoint = `/exchange-rate`;
    const response = await fetch(`${BNM_API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json',
      },
    });

    if (!response.ok) {
      console.error(`BNM API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.meta && data.meta.code !== 200) {
      console.error(`BNM API returned error: ${data.meta.message}`);
      return null;
    }

    // BNM API returns all currencies at once
    const rates = data.data;
    if (!rates || rates.length === 0) {
      return [];
    }

    // Find the specific currency we need
    const currencyData = rates.find(r => r.currency_code === currencyCode);
    if (!currencyData || !currencyData.rate) {
      return null;
    }

    // Parse nested rate structure
    const rateInfo = currencyData.rate;
    const rate = parseFloat(rateInfo.middle_rate);

    // Adjust rate based on unit (some currencies are per 100 units)
    const adjustedRate = rate / currencyData.unit;

    return {
      base_currency: 'MYR',
      target_currency: currencyCode,
      rate: adjustedRate,
      date: rateInfo.date || new Date().toISOString().split('T')[0],
      source: 'BNM',
    };
  } catch (error) {
    console.error(`Error fetching BNM rate for ${currencyCode}:`, error.message);
    return null;
  }
}

/**
 * Refresh BNM FX rates (daily)
 * Works standalone without requiring the API server
 */
async function refreshBNMRates() {
  console.log('🔄 Refreshing BNM exchange rates...');

  try {
    const rates = [];

    // Fetch all priority rates
    for (const { code } of PRIORITY_CURRENCY_PAIRS) {
      const rate = await fetchBNMExchangeRate(code);
      if (rate) {
        rates.push(rate);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (rates.length === 0) {
      console.log('⚠️  No rates fetched from BNM API');
      return { success: false, error: 'No rates returned from BNM' };
    }

    console.log(`📊 Fetched ${rates.length} currency pairs from BNM`);

    // Store rates in database
    let inserted = 0;

    for (const rate of rates) {
      try {
        const { error } = await supabase
          .from('fx_rates')
          .upsert({
            base_currency: rate.base_currency,
            target_currency: rate.target_currency,
            rate: rate.rate,
            date: rate.date,
            source: 'BNM',
          }, {
            onConflict: 'base_currency,target_currency,date'
          });

        if (!error) {
          inserted++;
        }
      } catch (err) {
        console.log(`⚠️  Could not store ${rate.currency_pair}: ${err.message}`);
      }
    }

    console.log(`✅ BNM rates refreshed: ${inserted} pairs stored`);
    return { success: true, count: inserted };
  } catch (error) {
    console.error('❌ BNM refresh error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check MATRADE trade statistics (quarterly)
 * Gracefully handles missing table
 */
async function checkMatradeStats() {
  console.log('🔄 Checking MATRADE trade statistics...');

  try {
    // Check if table exists by trying to query it
    const { data: latestStat, error: checkError } = await supabase
      .from('trade_statistics')
      .select('year, month')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
        console.log('⚠️  trade_statistics table not found');
        console.log('   Run migrations: 018_add_data_source_tracking.sql and 019_trade_statistics.sql');
        return { success: true, skipped: true, reason: 'Table does not exist' };
      }
      throw checkError;
    }

    if (!latestStat || latestStat.length === 0) {
      console.log('📥 No MATRADE data found in database');
      console.log('   Run: node scripts/import-matrade-data.js to import data');
      return { success: true, needsImport: true };
    }

    const lastRefresh = latestStat[0];
    console.log(`✅ MATRADE data current (last updated: ${lastRefresh.year}-${lastRefresh.month})`);
    return { success: true, current: true };
  } catch (error) {
    console.error('❌ MATRADE check error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check data source health
 */
async function checkDataSourceHealth() {
  console.log('\n📊 Data Source Health Check...\n');

  // Check FX rates
  try {
    const { data: fxData, count: fxCount, error: fxError } = await supabase
      .from('fx_rates')
      .select('date, source', { count: 'exact', head: false })
      .order('date', { ascending: false })
      .limit(1);

    if (fxError) {
      console.log('FX Rates: ❌ Error -', fxError.message);
    } else {
      console.log('FX Rates:');
      console.log(`  Total records: ${fxCount || 0}`);
      console.log(`  Latest: ${fxData?.[0]?.date || 'N/A'} (${fxData?.[0]?.source || 'N/A'})`);
    }
  } catch (error) {
    console.log('FX Rates: ❌ Error -', error.message);
  }

  // Check trade statistics
  try {
    const { data: statsData, count: statsCount, error: statsError } = await supabase
      .from('trade_statistics')
      .select('year, month, source', { count: 'exact', head: false })
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    if (statsError) {
      if (statsError.message.includes('relation') || statsError.message.includes('does not exist')) {
        console.log('\nTrade Statistics: ⚠️  Table not found');
        console.log('  Run migrations to create table: 019_trade_statistics.sql');
      } else {
        console.log('\nTrade Statistics: ❌ Error -', statsError.message);
      }
    } else {
      console.log('\nTrade Statistics:');
      console.log(`  Total records: ${statsCount || 0}`);
      if (statsData?.[0]) {
        console.log(`  Latest: ${statsData[0].year}-${statsData[0].month} (${statsData[0].source || 'N/A'})`);
      } else {
        console.log(`  Latest: N/A (no data)`);
      }
    }
  } catch (error) {
    console.log('\nTrade Statistics: ❌ Error -', error.message);
  }
}

/**
 * Main pipeline orchestration
 */
async function runDataIngestionPipeline() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   TradeNest Data Ingestion Pipeline          ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results = {
    bnm: null,
    matrade: null,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Refresh BNM rates (daily)
    results.bnm = await refreshBNMRates();

    // 2. Check MATRADE status (gracefully handle missing table)
    results.matrade = await checkMatradeStats();

    // 3. Check overall health
    await checkDataSourceHealth();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 Pipeline Summary');
    console.log('='.repeat(50));
    console.log(`BNM FX Rates: ${results.bnm.success ? '✅' : '❌'}`);
    console.log(`MATRADE Stats: ${results.matrade.success ? '✅' : '⚠️'}`);
    console.log('='.repeat(50));

    if (!results.matrade.success || results.matrade.needsImport) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Apply migrations to create trade_statistics table');
      console.log('   2. Run: node scripts/import-matrade-data.js');
    }

    return results;
  } catch (error) {
    console.error('\n❌ Pipeline error:', error);
    return { ...results, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  runDataIngestionPipeline()
    .then(results => {
      const exitCode = results.bnm?.success ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runDataIngestionPipeline, refreshBNMRates, checkMatradeStats };
