import { supabase } from '@/lib/supabase/client';
import { calculateVolatility, calculateMean, calculateStdDev, calculatePercentageChange } from './statistics';
import { AnomalySeverity } from '@/types/database';

export interface FxAnomalyResult {
  currencyPair: string;
  currentRate: number;
  averageRate: number;
  volatility: number;
  percentageChange: number;
  severity: AnomalySeverity;
  detectedAt: string;
  details: Record<string, any>;
}

/**
 * Detect FX rate volatility for a currency pair
 */
export async function detectFxVolatility(
  currencyPair: string,
  lookbackDays: number = 30,
  volatilityThreshold: number = 2.5 // percentage
): Promise<FxAnomalyResult | null> {
  try {
    // Fetch recent FX data
    const { data: fxData, error } = await supabase
      .from('fx_rates')
      .select('rate, date')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: true })
      .limit(lookbackDays + 1);

    if (error || !fxData || fxData.length < 7) {
      return null; // Need at least a week of data
    }

    const rates = fxData.map((d) => d.rate);
    const currentRate = rates[rates.length - 1];
    const averageRate = calculateMean(rates);
    const volatility = calculateVolatility(rates);
    const percentageChange = calculatePercentageChange(averageRate, currentRate);

    // Check if volatility exceeds threshold
    if (volatility < volatilityThreshold) {
      return null; // Volatility is within acceptable range
    }

    const severity = determineFxSeverity(volatility, percentageChange);

    return {
      currencyPair,
      currentRate,
      averageRate,
      volatility,
      percentageChange,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        lookback_days: lookbackDays,
        threshold: volatilityThreshold,
        min_rate: Math.min(...rates),
        max_rate: Math.max(...rates),
        std_dev: calculateStdDev(rates),
        rate_range: `${Math.min(...rates).toFixed(6)} - ${Math.max(...rates).toFixed(6)}`,
      },
    };
  } catch (error) {
    console.error('Error detecting FX volatility:', error);
    return null;
  }
}

/**
 * Detect FX volatility across all currency pairs
 */
export async function detectAllFxVolatility(
  lookbackDays: number = 30,
  volatilityThreshold: number = 2.5
): Promise<FxAnomalyResult[]> {
  try {
    // Get all unique currency pairs
    const { data: pairs, error } = await supabase
      .from('fx_rates')
      .select('currency_pair')
      .order('currency_pair');

    if (error || !pairs) {
      return [];
    }

    // Get unique pairs
    const uniquePairs = [...new Set(pairs.map((p) => p.currency_pair))];
    const anomalies: FxAnomalyResult[] = [];

    // Check each pair for volatility
    for (const pair of uniquePairs) {
      const anomaly = await detectFxVolatility(pair, lookbackDays, volatilityThreshold);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting all FX volatility:', error);
    return [];
  }
}

/**
 * Detect sudden FX rate spikes (rapid changes)
 */
export async function detectFxSpike(
  currencyPair: string,
  lookbackDays: number = 7,
  spikeThreshold: number = 3 // percentage in a week
): Promise<FxAnomalyResult | null> {
  try {
    const { data: fxData, error } = await supabase
      .from('fx_rates')
      .select('rate, date')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(lookbackDays);

    if (error || !fxData || fxData.length < 2) {
      return null;
    }

    const latestRate = fxData[0].rate;
    const oldestRate = fxData[fxData.length - 1].rate;
    const percentageChange = calculatePercentageChange(oldestRate, latestRate);

    // Check if change exceeds threshold
    if (Math.abs(percentageChange) < spikeThreshold) {
      return null;
    }

    const rates = fxData.map((d) => d.rate);
    const averageRate = calculateMean(rates);
    const volatility = calculateVolatility(rates);
    const severity = determineFxSeverity(volatility, percentageChange);

    return {
      currencyPair,
      currentRate: latestRate,
      averageRate,
      volatility,
      percentageChange,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        lookback_days: lookbackDays,
        threshold: spikeThreshold,
        change_type: percentageChange > 0 ? 'appreciation' : 'depreciation',
        previous_rate: oldestRate,
        detection_method: 'spike',
      },
    };
  } catch (error) {
    console.error('Error detecting FX spike:', error);
    return null;
  }
}

/**
 * Get FX trend for a currency pair
 */
export async function getFxTrend(
  currencyPair: string,
  lookbackDays: number = 30
): Promise<'strengthening' | 'weakening' | 'stable' | null> {
  try {
    const { data: fxData, error } = await supabase
      .from('fx_rates')
      .select('rate, date')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: true })
      .limit(lookbackDays);

    if (error || !fxData || fxData.length < 7) {
      return null;
    }

    // Compare first week to last week
    const firstWeek = fxData.slice(0, 7);
    const lastWeek = fxData.slice(-7);

    const firstWeekAvg = calculateMean(firstWeek.map((d) => d.rate));
    const lastWeekAvg = calculateMean(lastWeek.map((d) => d.rate));

    const percentageChange = calculatePercentageChange(firstWeekAvg, lastWeekAvg);

    if (percentageChange > 1) return 'strengthening';
    if (percentageChange < -1) return 'weakening';
    return 'stable';
  } catch (error) {
    console.error('Error getting FX trend:', error);
    return null;
  }
}

/**
 * Detect FX rates approaching risk thresholds
 */
export async function detectFxRiskThreshold(
  currencyPair: string,
  riskThreshold: number, // e.g., 5.0 for MYR/USD
  direction: 'above' | 'below'
): Promise<FxAnomalyResult | null> {
  try {
    const { data, error } = await supabase
      .from('fx_rates')
      .select('rate, date')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(7);

    if (error || !data || data.length === 0) {
      return null;
    }

    const currentRate = data[0].rate;
    const rates = data.map((d) => d.rate);
    const averageRate = calculateMean(rates);

    // Check if threshold is breached
    const thresholdBreached =
      direction === 'above' ? currentRate > riskThreshold : currentRate < riskThreshold;

    if (!thresholdBreached) {
      return null;
    }

    const percentageChange = calculatePercentageChange(riskThreshold, currentRate);
    const volatility = calculateVolatility(rates);

    return {
      currencyPair,
      currentRate,
      averageRate,
      volatility,
      percentageChange,
      severity: 'high', // Threshold breaches are always significant
      detectedAt: new Date().toISOString(),
      details: {
        risk_threshold: riskThreshold,
        direction,
        threshold_breach: true,
        distance_from_threshold: Math.abs(currentRate - riskThreshold),
      },
    };
  } catch (error) {
    console.error('Error detecting FX risk threshold:', error);
    return null;
  }
}

/**
 * Determine severity based on volatility and percentage change
 */
function determineFxSeverity(volatility: number, percentageChange: number): AnomalySeverity {
  const absPercentChange = Math.abs(percentageChange);

  // Critical: Extreme volatility OR very large change
  if (volatility >= 5.0 || absPercentChange >= 5.0) {
    return 'critical';
  }

  // High: High volatility OR large change
  if (volatility >= 3.5 || absPercentChange >= 3.5) {
    return 'high';
  }

  // Medium: Moderate volatility OR moderate change
  if (volatility >= 2.5 || absPercentChange >= 2.0) {
    return 'medium';
  }

  // Low: Above threshold but below medium
  return 'low';
}

/**
 * Get current FX rate for a currency pair
 */
export async function getCurrentFxRate(currencyPair: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('fx_rates')
      .select('rate')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.rate;
  } catch (error) {
    return null;
  }
}