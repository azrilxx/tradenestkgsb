/**
 * Data Sources Refresh API
 * Task 3.3: Manual trigger for data source refresh
 * Orchestrates BNM FX rates and MATRADE statistics updates
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data_sources } = await request.json();
    const sourcesToRefresh = data_sources || ['bnm', 'matrade']; // Default: refresh all

    const results = {
      bnm: null as any,
      matrade: null as any,
      timestamp: new Date().toISOString()
    };

    // 1. Refresh BNM rates if requested
    if (sourcesToRefresh.includes('bnm') || sourcesToRefresh.includes('all')) {
      try {
        console.log('🔄 Refreshing BNM exchange rates...');

        const { data, error } = await supabase.rpc('refresh_bnm_rates');

        if (error) {
          console.error('BNM refresh error:', error);
          results.bnm = { success: false, error: error.message };
        } else {
          results.bnm = { success: true, data };
        }
      } catch (error: any) {
        console.error('BNM refresh error:', error);
        results.bnm = { success: false, error: error.message };
      }
    }

    // 2. Refresh MATRADE statistics if requested
    if (sourcesToRefresh.includes('matrade') || sourcesToRefresh.includes('all')) {
      try {
        console.log('🔄 Checking MATRADE statistics...');

        const { data: stats, error } = await supabase
          .from('trade_statistics')
          .select('year, month, source')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1);

        if (error) {
          if (error.message.includes('does not exist')) {
            results.matrade = {
              success: true,
              skipped: true,
              message: 'Table does not exist. Run migration 019_trade_statistics.sql'
            };
          } else {
            results.matrade = { success: false, error: error.message };
          }
        } else {
          results.matrade = {
            success: true,
            current: stats && stats.length > 0,
            lastUpdated: stats?.[0] ? `${stats[0].year}-${stats[0].month}` : 'N/A'
          };
        }
      } catch (error: any) {
        console.error('MATRADE check error:', error);
        results.matrade = { success: false, error: error.message };
      }
    }

    // Calculate success summary
    const successful = Object.values(results).filter(
      (r: any) => r && r.success && !r.skipped
    ).length;
    const failed = Object.values(results).filter(
      (r: any) => r && !r.success
    ).length;

    return NextResponse.json({
      success: failed === 0,
      summary: {
        requested: sourcesToRefresh,
        successful,
        failed,
        skipped: Object.values(results).filter((r: any) => r?.skipped).length
      },
      results,
      timestamp: results.timestamp
    });

  } catch (error) {
    console.error('Data refresh API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh data sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data-sources/refresh
 * Check status of data sources
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check FX rates health
    const { data: fxData, error: fxError } = await supabase
      .from('fx_rates')
      .select('date, source, currency_pair')
      .order('date', { ascending: false })
      .limit(10);

    // Check trade statistics health
    const { data: statsData, error: statsError } = await supabase
      .from('trade_statistics')
      .select('year, month, source')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    const health = {
      fx_rates: {
        status: fxError ? 'error' : 'healthy',
        latest: fxData?.[0]?.date || 'N/A',
        source: fxData?.[0]?.source || 'N/A',
        count: fxData?.length || 0,
        error: fxError?.message
      },
      trade_statistics: {
        status: statsError ? 'error' : statsData && statsData.length > 0 ? 'healthy' : 'no_data',
        latest: statsData?.[0] ? `${statsData[0].year}-${statsData[0].month}` : 'N/A',
        source: statsData?.[0]?.source || 'N/A',
        error: statsError?.message
      }
    };

    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check data source health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

