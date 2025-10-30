// API Route for BNM Data Integration
// Task 3.1: Endpoint to fetch and store BNM exchange rate data

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchBNMExchangeRate,
  fetchAllPriorityRates,
  getBNMAttribution,
  PRIORITY_CURRENCY_PAIRS
} from '@/lib/data-sources/bnm-fetcher';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'fetch', 'store', 'both'
    const date = searchParams.get('date'); // Optional date filter

    const supabase = await createClient();

    if (action === 'fetch') {
      // Just fetch and return rates without storing
      const rates = await fetchAllPriorityRates(date || undefined);

      return NextResponse.json({
        success: true,
        data: rates,
        attribution: getBNMAttribution(),
        count: rates.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'store' || action === 'both' || !action) {
      // Fetch and store rates in database
      const rates = await fetchAllPriorityRates(date || undefined);

      const storedRates = [];

      for (const rate of rates) {
        const { data, error } = await supabase
          .from('fx_rates')
          .upsert({
            currency_pair: rate.currency_pair,
            rate: rate.rate,
            date: rate.date,
            source: 'BNM', // Add source attribution
          }, {
            onConflict: 'currency_pair,date'
          });

        if (!error && data) {
          storedRates.push(rate);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'BNM exchange rates stored successfully',
        stored: storedRates.length,
        data: storedRates,
        attribution: getBNMAttribution(),
        timestamp: new Date().toISOString(),
      });
    }

    // Invalid action
    return NextResponse.json(
      { error: 'Invalid action parameter. Use: fetch, store, or both' },
      { status: 400 }
    );
  } catch (error) {
    console.error('BNM API route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch BNM data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method to trigger manual refresh
export async function POST() {
  try {
    const supabase = await createClient();
    const rates = await fetchAllPriorityRates();

    const storedCount = [];

    for (const rate of rates) {
      const { error } = await supabase
        .from('fx_rates')
        .upsert({
          currency_pair: rate.currency_pair,
          rate: rate.rate,
          date: rate.date,
          source: 'BNM', // Add source attribution
        }, {
          onConflict: 'currency_pair,date'
        });

      if (!error) {
        storedCount.push(rate.currency_pair);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'BNM exchange rates refreshed successfully',
      stored: storedCount.length,
      pairs: storedCount,
      attribution: getBNMAttribution(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('BNM refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh BNM data' },
      { status: 500 }
    );
  }
}

