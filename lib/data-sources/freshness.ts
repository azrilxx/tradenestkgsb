/**
 * Data Freshness Tracker
 * Monitors when data was last updated and identifies stale data
 */

import { DataSource, DataSourceHealth } from './types';
import { supabase } from '@/lib/supabase/client';

/**
 * Check freshness of FX rates
 */
export async function checkFXRateFreshness(): Promise<DataSourceHealth> {
  try {
    const { data, error } = await supabase
      .from('fx_rates')
      .select('date, source')
      .order('date', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return {
        source: DataSource.BNM,
        lastUpdated: null,
        recordCount: 0,
        isStale: true,
        status: 'failed'
      };
    }

    const lastUpdated = new Date(data[0].date);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const isStale = daysSinceUpdate > 7; // Stale if > 7 days old

    // Get total record count
    const { count } = await supabase
      .from('fx_rates')
      .select('*', { count: 'exact', head: true });

    return {
      source: DataSource.BNM,
      lastUpdated,
      recordCount: count || 0,
      isStale,
      status: isStale ? 'degraded' : 'healthy'
    };
  } catch (error) {
    return {
      source: DataSource.BNM,
      lastUpdated: null,
      recordCount: 0,
      isStale: true,
      status: 'failed'
    };
  }
}

/**
 * Check freshness of trade statistics
 */
export async function checkTradeStatisticsFreshness(): Promise<DataSourceHealth> {
  try {
    const { data, error } = await supabase
      .from('trade_statistics')
      .select('year, month, source')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return {
        source: DataSource.MATRADE,
        lastUpdated: null,
        recordCount: 0,
        isStale: true,
        status: 'failed'
      };
    }

    const stat = data[0];
    const lastUpdated = new Date(stat.year, stat.month - 1, 1);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const isStale = daysSinceUpdate > 90; // Stale if > 90 days old (quarterly updates)

    // Get total record count
    const { count } = await supabase
      .from('trade_statistics')
      .select('*', { count: 'exact', head: true });

    return {
      source: DataSource.MATRADE,
      lastUpdated,
      recordCount: count || 0,
      isStale,
      status: isStale ? 'degraded' : 'healthy'
    };
  } catch (error) {
    return {
      source: DataSource.MATRADE,
      lastUpdated: null,
      recordCount: 0,
      isStale: true,
      status: 'failed'
    };
  }
}

/**
 * Get freshness status for all data sources
 */
export async function getAllDataSourceHealth(): Promise<DataSourceHealth[]> {
  const [fxHealth, tradeStatsHealth] = await Promise.all([
    checkFXRateFreshness(),
    checkTradeStatisticsFreshness()
  ]);

  return [fxHealth, tradeStatsHealth];
}

/**
 * Calculate data age in days
 */
export function calculateDataAge(lastUpdated: Date | null): number {
  if (!lastUpdated) return Infinity;

  return (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Determine if data source needs refresh based on its type
 */
export function needsRefresh(source: DataSource, ageInDays: number): boolean {
  switch (source) {
    case DataSource.BNM:
      return ageInDays > 1; // FX rates should be refreshed daily
    case DataSource.MATRADE:
      return ageInDays > 90; // Trade stats are quarterly
    default:
      return ageInDays > 7; // Default: weekly
  }
}

