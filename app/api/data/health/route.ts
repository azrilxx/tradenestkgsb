import { NextResponse } from 'next/server';
import { getAllDataSourceHealth } from '@/lib/data-sources/freshness';
import { supabase } from '@/lib/supabase/client';
import { DataSource } from '@/lib/data-sources/types';

/**
 * GET /api/data/health
 * Get health status of all data sources
 */
export async function GET(request: Request) {
  try {
    // Get health status from freshness tracker
    const healthStatuses = await getAllDataSourceHealth();

    // Get record counts per source
    const [fxCount, tradeCount] = await Promise.all([
      supabase.from('fx_rates').select('*', { count: 'exact', head: true }),
      supabase.from('trade_statistics').select('*', { count: 'exact', head: true })
    ]);

    // Build comprehensive health report
    const healthReport = {
      timestamp: new Date().toISOString(),
      overallStatus: 'healthy',
      sources: {
        fx_rates: {
          name: 'BNM Exchange Rates',
          source: DataSource.BNM,
          status: healthStatuses.find(h => h.source === DataSource.BNM)?.status || 'unknown',
          recordCount: fxCount.count || 0,
          lastUpdated: healthStatuses.find(h => h.source === DataSource.BNM)?.lastUpdated?.toISOString() || null,
          isStale: healthStatuses.find(h => h.source === DataSource.BNM)?.isStale || true,
          refreshFrequency: 'Daily'
        },
        trade_statistics: {
          name: 'MATRADE Trade Statistics',
          source: DataSource.MATRADE,
          status: healthStatuses.find(h => h.source === DataSource.MATRADE)?.status || 'unknown',
          recordCount: tradeCount.count || 0,
          lastUpdated: healthStatuses.find(h => h.source === DataSource.MATRADE)?.lastUpdated?.toISOString() || null,
          isStale: healthStatuses.find(h => h.source === DataSource.MATRADE)?.isStale || true,
          refreshFrequency: 'Quarterly (manual import)'
        }
      }
    };

    // Determine overall status
    const hasFailed = healthStatuses.some(h => h.status === 'failed');
    const hasDegraded = healthStatuses.some(h => h.status === 'degraded');

    if (hasFailed) {
      healthReport.overallStatus = 'failed';
    } else if (hasDegraded) {
      healthReport.overallStatus = 'degraded';
    }

    return NextResponse.json({
      success: true,
      health: healthReport
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      health: {
        timestamp: new Date().toISOString(),
        overallStatus: 'failed',
        sources: {}
      }
    }, { status: 500 });
  }
}

