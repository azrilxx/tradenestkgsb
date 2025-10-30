/**
 * Backfill Historical FX Data from BNM
 * Fetches last 6 months of FX rates and imports to database
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BNM_API_BASE_URL = 'https://api.bnm.gov.my';
const START_DATE = new Date();
START_DATE.setMonth(START_DATE.getMonth() - 6); // 6 months ago
const END_DATE = new Date();

const CURRENCY_PAIRS = ['USD', 'CNY', 'EUR', 'SGD', 'JPY'];

async function backfillFXHistorical() {
  console.log('🔄 Starting FX historical backfill...');
  console.log(`📅 Date range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const currency of CURRENCY_PAIRS) {
    console.log(`\n📊 Fetching ${currency} rates...`);

    try {
      const url = `${BNM_API_BASE_URL}/exchange-rate/history`;
      const params = new URLSearchParams({
        session: '0730',
        quote: currency,
        start_date: START_DATE.toISOString().split('T')[0],
        end_date: END_DATE.toISOString().split('T')[0]
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Accept': 'application/vnd.BNM.API.v1+json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch ${currency}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        console.log(`⚠️  No data available for ${currency}`);
        continue;
      }

      // Insert each rate
      for (const item of data.data) {
        const rate = parseFloat(item.rate);

        if (isNaN(rate) || rate <= 0) {
          continue;
        }

        const record = {
          currency_pair: `MYR/${currency}`,
          rate: rate.toString(),
          date: item.date,
          source: 'BNM'
        };

        // Check if record exists
        const { data: existing } = await supabase
          .from('fx_rates')
          .select('id')
          .eq('currency_pair', record.currency_pair)
          .eq('date', record.date)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('fx_rates')
            .update(record)
            .eq('id', existing.id);

          if (!error) {
            totalUpdated++;
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('fx_rates')
            .insert(record);

          if (!error) {
            totalInserted++;
          }
        }
      }

      console.log(`✅ ${currency}: Processed ${data.data.length} records`);

    } catch (error) {
      console.error(`❌ Error fetching ${currency}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Backfill Summary');
  console.log('='.repeat(50));
  console.log(`✅ Inserted: ${totalInserted} new records`);
  console.log(`🔄 Updated: ${totalUpdated} existing records`);
  console.log(`📈 Total processed: ${totalInserted + totalUpdated}`);
  console.log('='.repeat(50));
}

// Run the backfill
backfillFXHistorical().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

