/**
 * Test updated BNM API integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBNMAPI() {
  console.log('Testing updated BNM API implementation...\n');

  try {
    // Make a direct fetch call to test the API
    const response = await fetch('https://api.bnm.gov.my/public/exchange-rate', {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json'
      }
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log('✅ API call successful');
    console.log(`Total currencies: ${data.meta?.total_result || data.data?.length || 0}`);
    console.log(`Last updated: ${data.meta?.last_updated || 'N/A'}\n`);

    // Test specific currencies
    const testCurrencies = ['USD', 'CNY', 'EUR', 'SGD'];
    console.log('Testing priority currency pairs:');

    for (const code of testCurrencies) {
      const currency = data.data.find((c) => c.currency_code === code);
      if (currency) {
        const rate = currency.rate.middle_rate;
        const unit = currency.unit || 1;
        const adjustedRate = rate / unit;
        console.log(`  ${code}: ${adjustedRate} (unit: ${unit})`);
      } else {
        console.log(`  ${code}: Not found`);
      }
    }

    // Test storing in database
    console.log('\n📊 Storing rates in database...');
    const rates = [];

    for (const code of testCurrencies) {
      const currency = data.data.find((c) => c.currency_code === code);
      if (currency && currency.rate) {
        const rate = currency.rate.middle_rate;
        const unit = currency.unit || 1;
        const adjustedRate = rate / unit;

        rates.push({
          base_currency: 'MYR',
          target_currency: code,
          rate: adjustedRate,
          date: currency.rate.date || new Date().toISOString().split('T')[0],
          source: 'BNM'
        });
      }
    }

    console.log(`Prepared ${rates.length} rates for storage`);

    // Store in database
    for (const rate of rates) {
      // Direct insert with correct schema
      const { error: insertError } = await supabase
        .from('fx_rates')
        .insert(rate);

      if (insertError) {
        console.error(`Error storing ${rate.base_currency}/${rate.target_currency}:`, insertError.message);
      } else {
        console.log(`✅ Stored ${rate.base_currency}/${rate.target_currency}: ${rate.rate}`);
      }
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBNMAPI().catch(console.error);

