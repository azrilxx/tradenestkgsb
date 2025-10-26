import { supabase } from '@/lib/supabase/client';
import {
  calculateMean,
  calculateStdDev,
  calculateZScore,
  calculatePercentageChange,
  findOutliers,
} from './statistics';
import { AnomalySeverity } from '@/types/database';

export interface PriceAnomalyResult {
  productId: string;
  currentPrice: number;
  previousPrice: number;
  averagePrice: number;
  stdDev: number;
  zScore: number;
  percentageChange: number;
  severity: AnomalySeverity;
  detectedAt: string;
  details: Record<string, any>;
}

/**
 * Detect price anomalies for a specific product
 */
export async function detectPriceAnomalies(
  productId: string,
  lookbackDays: number = 30,
  zScoreThreshold: number = 2.0
): Promise<PriceAnomalyResult | null> {
  try {
    // Fetch recent price data
    const { data: priceData, error } = await supabase
      .from('price_data')
      .select('price, date')
      .eq('product_id', productId)
      .order('date', { ascending: true })
      .limit(lookbackDays + 1);

    if (error || !priceData || priceData.length < 2) {
      return null;
    }

    // Separate current price from historical data
    const currentData = priceData[priceData.length - 1];
    const historicalData = priceData.slice(0, -1);

    const currentPrice = currentData.price;
    const previousPrice = historicalData[historicalData.length - 1]?.price || currentPrice;
    const historicalPrices = historicalData.map((d) => d.price);

    // Calculate statistics
    const averagePrice = calculateMean(historicalPrices);
    const stdDev = calculateStdDev(historicalPrices);
    const zScore = calculateZScore(currentPrice, averagePrice, stdDev);
    const percentageChange = calculatePercentageChange(previousPrice, currentPrice);

    // Check if this is an anomaly
    if (Math.abs(zScore) < zScoreThreshold) {
      return null; // Not an anomaly
    }

    // Determine severity based on Z-score and percentage change
    const severity = determinePriceSeverity(zScore, percentageChange);

    return {
      productId,
      currentPrice,
      previousPrice,
      averagePrice,
      stdDev,
      zScore,
      percentageChange,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        lookback_days: lookbackDays,
        threshold: zScoreThreshold,
        historical_min: Math.min(...historicalPrices),
        historical_max: Math.max(...historicalPrices),
        data_points: historicalPrices.length,
      },
    };
  } catch (error) {
    console.error('Error detecting price anomalies:', error);
    return null;
  }
}

/**
 * Detect price anomalies across all products
 */
export async function detectAllPriceAnomalies(
  lookbackDays: number = 30,
  zScoreThreshold: number = 2.0
): Promise<PriceAnomalyResult[]> {
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id')
      .limit(50);

    if (error || !products) {
      return [];
    }

    const anomalies: PriceAnomalyResult[] = [];

    // Check each product for anomalies
    for (const product of products) {
      const anomaly = await detectPriceAnomalies(product.id, lookbackDays, zScoreThreshold);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting all price anomalies:', error);
    return [];
  }
}

/**
 * Detect price spikes using moving average method
 */
export async function detectPriceSpikeByMovingAverage(
  productId: string,
  shortWindow: number = 7,
  longWindow: number = 30,
  thresholdPercentage: number = 20
): Promise<PriceAnomalyResult | null> {
  try {
    const { data: priceData, error } = await supabase
      .from('price_data')
      .select('price, date')
      .eq('product_id', productId)
      .order('date', { ascending: true })
      .limit(longWindow + 1);

    if (error || !priceData || priceData.length < longWindow) {
      return null;
    }

    const prices = priceData.map((d) => d.price);
    const currentPrice = prices[prices.length - 1];

    // Calculate short-term and long-term averages
    const shortTermPrices = prices.slice(-shortWindow);
    const longTermPrices = prices.slice(-longWindow, -shortWindow);

    const shortTermAvg = calculateMean(shortTermPrices);
    const longTermAvg = calculateMean(longTermPrices);
    const percentageChange = calculatePercentageChange(longTermAvg, shortTermAvg);

    // Check if short-term average significantly exceeds long-term average
    if (percentageChange < thresholdPercentage) {
      return null; // Not a spike
    }

    const stdDev = calculateStdDev(prices);
    const zScore = calculateZScore(currentPrice, longTermAvg, stdDev);
    const severity = determinePriceSeverity(zScore, percentageChange);

    return {
      productId,
      currentPrice,
      previousPrice: longTermAvg,
      averagePrice: longTermAvg,
      stdDev,
      zScore,
      percentageChange,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        short_term_avg: shortTermAvg,
        long_term_avg: longTermAvg,
        detection_method: 'moving_average',
        short_window: shortWindow,
        long_window: longWindow,
      },
    };
  } catch (error) {
    console.error('Error detecting price spike by MA:', error);
    return null;
  }
}

/**
 * Determine severity based on Z-score and percentage change
 */
function determinePriceSeverity(zScore: number, percentageChange: number): AnomalySeverity {
  const absZScore = Math.abs(zScore);
  const absPercentChange = Math.abs(percentageChange);

  // Critical: Very high Z-score OR very large percentage change
  if (absZScore >= 4.0 || absPercentChange >= 100) {
    return 'critical';
  }

  // High: High Z-score OR large percentage change
  if (absZScore >= 3.0 || absPercentChange >= 50) {
    return 'high';
  }

  // Medium: Moderate Z-score OR moderate percentage change
  if (absZScore >= 2.5 || absPercentChange >= 25) {
    return 'medium';
  }

  // Low: Anything above threshold but below medium
  return 'low';
}

/**
 * Get latest price for a product
 */
export async function getLatestPrice(productId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('price_data')
      .select('price')
      .eq('product_id', productId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.price;
  } catch (error) {
    return null;
  }
}