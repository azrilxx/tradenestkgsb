// FX Rate Alert System
// Monitors BNM exchange rates for significant changes

import { createClient } from '@/lib/supabase/server';

export interface FXAlert {
  id: string;
  currency_pair: string;
  previous_rate: number;
  current_rate: number;
  change_percent: number;
  threshold: number;
  created_at: string;
}

export interface AlertConfig {
  threshold_percent: number; // Default: 2%
  currency_pairs: string[];
  user_id?: string;
}

const DEFAULT_THRESHOLD = 2.0; // 2% default threshold

/**
 * Calculate percentage change between two rates
 */
export function calculateRateChange(previousRate: number, currentRate: number): number {
  return ((currentRate - previousRate) / previousRate) * 100;
}

/**
 * Check if rate change exceeds threshold
 */
export function exceedsThreshold(changePercent: number, threshold: number): boolean {
  return Math.abs(changePercent) >= threshold;
}

/**
 * Fetch latest and previous exchange rate
 */
export async function getRateHistory(
  currencyPair: string,
  days: number = 1
): Promise<{ current: any; previous: any } | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(days + 1);

    if (error || !data || data.length < 2) {
      return null;
    }

    return {
      current: data[0],
      previous: data[1],
    };
  } catch (error) {
    console.error('Error fetching rate history:', error);
    return null;
  }
}

/**
 * Check all priority rates for alerts
 */
export async function checkFXRatesForAlerts(
  config?: AlertConfig
): Promise<FXAlert[]> {
  const threshold = config?.threshold_percent || DEFAULT_THRESHOLD;
  const currencyPairs = config?.currency_pairs || [
    'MYR/USD',
    'MYR/CNY',
    'MYR/EUR',
    'MYR/SGD',
  ];

  const alerts: FXAlert[] = [];

  for (const pair of currencyPairs) {
    const history = await getRateHistory(pair);

    if (!history) continue;

    const changePercent = calculateRateChange(
      history.previous.rate,
      history.current.rate
    );

    if (exceedsThreshold(changePercent, threshold)) {
      alerts.push({
        id: history.current.id,
        currency_pair: pair,
        previous_rate: history.previous.rate,
        current_rate: history.current.rate,
        change_percent: changePercent,
        threshold: threshold,
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Store alert in database
 */
export async function storeFXAlert(alert: Omit<FXAlert, 'id' | 'created_at'>): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fx_alerts')
      .insert({
        currency_pair: alert.currency_pair,
        previous_rate: alert.previous_rate,
        current_rate: alert.current_rate,
        change_percent: alert.change_percent,
        threshold: alert.threshold,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error storing FX alert:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error storing FX alert:', error);
    return null;
  }
}

/**
 * Get recent FX alerts
 */
export async function getRecentFXAlerts(limit: number = 10): Promise<FXAlert[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fx_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching FX alerts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching FX alerts:', error);
    return [];
  }
}

/**
 * Run scheduled FX alert check
 * Should be called after daily rate fetch
 */
export async function runScheduledFXAlertCheck(): Promise<void> {
  try {
    const alerts = await checkFXRatesForAlerts();

    for (const alert of alerts) {
      await storeFXAlert(alert);
      console.log(`FX Alert: ${alert.currency_pair} changed by ${alert.change_percent.toFixed(2)}%`);
    }

    if (alerts.length > 0) {
      console.log(`Generated ${alerts.length} FX alerts`);
    }
  } catch (error) {
    console.error('Error running scheduled FX alert check:', error);
  }
}

