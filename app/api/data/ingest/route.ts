import { NextResponse } from 'next/server';
import { DataSource, DataIngestionResult, DataRefreshStatus } from '@/lib/data-sources/types';
import { fetchBNMFXRates } from '@/lib/data-sources/bnm-fx';
import { supabase } from '@/lib/supabase/client';
import { logDataSourceOperation } from '@/lib/data-sources/utils';

/**
 * POST /api/data/ingest
 * Unified endpoint to refresh all data sources
 */
export async function POST(request: Request) {
  const results: DataIngestionResult[] = [];
  const timestamp = new Date();

  logDataSourceOperation(DataSource.BNM, 'Starting unified data ingestion', {});

  try {
    // 1. Refresh BNM FX Rates
    try {
      logDataSourceOperation(DataSource.BNM, 'Refreshing FX rates', {});
      const rates = await fetchBNMFXRates();

      if (rates.length > 0) {
        let inserted = 0;
        let updated = 0;

        for (const rate of rates) {
          const record = {
            currency_pair: rate.currency_pair,
            rate: rate.rate.toString(),
            date: rate.date.toISOString().split('T')[0],
            source: rate.source
          };

          // Check if exists
          const { data: existing } = await supabase
            .from('fx_rates')
            .select('id')
            .eq('currency_pair', record.currency_pair)
            .eq('date', record.date)
            .single();

          if (existing) {
            await supabase
              .from('fx_rates')
              .update(record)
              .eq('id', existing.id);
            updated++;
          } else {
            await supabase.from('fx_rates').insert(record);
            inserted++;
          }
        }

        results.push({
          success: true,
          source: DataSource.BNM,
          recordsInserted: inserted,
          recordsUpdated: updated,
          timestamp
        });
      }
    } catch (error) {
      results.push({
        success: false,
        source: DataSource.BNM,
        recordsInserted: 0,
        recordsUpdated: 0,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Note: MATRADE data is not refreshed automatically
    // It's a one-time import via the script: scripts/import-matrade-data.js

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    const status: DataRefreshStatus = {
      totalSources: results.length,
      successful: successCount,
      failed: failCount,
      results,
      timestamp
    };

    return NextResponse.json({
      success: true,
      message: 'Data ingestion completed',
      status
    });

  } catch (error) {
    console.error('Unified ingestion error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/data/ingest
 * Get ingestion status and statistics
 */
export async function GET(request: Request) {
  try {
    // Get record counts per source
    const fxData = await supabase
      .from('fx_rates')
      .select('source, date')
      .order('date', { ascending: false })
      .limit(1);

    const statsData = await supabase
      .from('trade_statistics')
      .select('source, year, month')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    return NextResponse.json({
      success: true,
      sources: {
        fx_rates: {
          count: fxData.data?.length || 0,
          lastUpdated: fxData.data?.[0]?.date || null,
          source: fxData.data?.[0]?.source || 'UNKNOWN'
        },
        trade_statistics: {
          count: statsData.data?.length || 0,
          lastUpdated: statsData.data?.[0] ?
            `${statsData.data[0].year}-${statsData.data[0].month}` : null,
          source: statsData.data?.[0]?.source || 'UNKNOWN'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

