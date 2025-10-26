/**
 * Benchmark calculation engine for market intelligence
 * Provides statistical analysis and peer comparison capabilities
 */

import { supabase } from '@/lib/supabase/client';
import { calculateMean, calculateStdDev, calculateVolatility } from '@/lib/anomaly-detection/statistics';

export interface BenchmarkFilters {
  hs_code?: string;
  country?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface PricePercentile {
  percentile: number;
  value: number;
}

export interface MarketShare {
  country: string;
  volume: number;
  value: number;
  percentage: number;
}

export interface BenchmarkData {
  avg_price: number;
  median_price: number;
  price_range: {
    min: number;
    max: number;
  };
  price_percentiles: PricePercentile[];
  top_exporters: MarketShare[];
  market_distribution: MarketShare[];
  price_volatility: number;
  total_volume: number;
  total_value: number;
  sample_size: number;
}

export interface ComparisonResult {
  user_price: number;
  market_avg: number;
  percentile_rank: number;
  deviation_percentage: number;
  is_outlier: boolean;
  recommendation: string;
}

export interface PriceTrendData {
  date: string;
  avg_price: number;
  volume: number;
}

/**
 * Calculate percentiles for price data
 */
export function calculatePercentiles(prices: number[]): PricePercentile[] {
  if (prices.length === 0) return [];

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const percentiles = [25, 50, 75, 90];

  return percentiles.map(percentile => ({
    percentile,
    value: getPercentileValue(sortedPrices, percentile)
  }));
}

/**
 * Get percentile value from sorted array
 */
function getPercentileValue(sortedArray: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
  if (lower === upper) return sortedArray[lower];

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calculate market share by country
 */
export function calculateMarketShare(shipments: any[]): MarketShare[] {
  const countryMap = new Map<string, { volume: number; value: number }>();

  shipments.forEach(shipment => {
    const country = shipment.company_country;
    const volume = shipment.container_count || 1;
    const value = shipment.total_value || 0;

    if (countryMap.has(country)) {
      const existing = countryMap.get(country)!;
      countryMap.set(country, {
        volume: existing.volume + volume,
        value: existing.value + value
      });
    } else {
      countryMap.set(country, { volume, value });
    }
  });

  const totalVolume = Array.from(countryMap.values()).reduce((sum, data) => sum + data.volume, 0);
  const totalValue = Array.from(countryMap.values()).reduce((sum, data) => sum + data.value, 0);

  return Array.from(countryMap.entries()).map(([country, data]) => ({
    country,
    volume: data.volume,
    value: data.value,
    percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0
  })).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculate Herfindahl-Hirschman Index for market concentration
 */
export function calculateHHI(marketShares: MarketShare[]): number {
  return marketShares.reduce((sum, share) => sum + Math.pow(share.percentage, 2), 0);
}

/**
 * Get benchmark data for a specific HS code and filters
 */
export async function getBenchmarkData(filters: BenchmarkFilters): Promise<BenchmarkData | null> {
  try {
    let query = supabase
      .from('shipment_details')
      .select('*');

    // Apply filters
    if (filters.hs_code) {
      query = query.eq('hs_code', filters.hs_code);
    }

    if (filters.country) {
      query = query.eq('company_country', filters.country);
    }

    if (filters.date_range) {
      query = query
        .gte('shipment_date', filters.date_range.start)
        .lte('shipment_date', filters.date_range.end);
    }

    const { data: shipments, error } = await query;

    if (error) {
      console.error('Error fetching benchmark data:', error);
      return null;
    }

    if (!shipments || shipments.length === 0) {
      return null;
    }

    // Extract prices and calculate statistics
    const prices = shipments
      .map(s => s.unit_price)
      .filter(price => price && price > 0);

    if (prices.length === 0) {
      return null;
    }

    const avgPrice = calculateMean(prices);
    const medianPrice = getPercentileValue([...prices].sort((a, b) => a - b), 50);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };

    const pricePercentiles = calculatePercentiles(prices);
    const marketDistribution = calculateMarketShare(shipments);
    const topExporters = marketDistribution.slice(0, 5);

    const priceVolatility = calculateVolatility(prices);

    const totalVolume = shipments.reduce((sum, s) => sum + (s.container_count || 1), 0);
    const totalValue = shipments.reduce((sum, s) => sum + (s.total_value || 0), 0);

    return {
      avg_price: avgPrice,
      median_price: medianPrice,
      price_range: priceRange,
      price_percentiles: pricePercentiles,
      top_exporters: topExporters,
      market_distribution: marketDistribution,
      price_volatility: priceVolatility,
      total_volume: totalVolume,
      total_value: totalValue,
      sample_size: shipments.length
    };

  } catch (error) {
    console.error('Error in getBenchmarkData:', error);
    return null;
  }
}

/**
 * Compare user's price against market benchmark
 */
export function compareUserPrice(
  userPrice: number,
  benchmarkData: BenchmarkData
): ComparisonResult {
  const marketAvg = benchmarkData.avg_price;
  const deviationPercentage = ((userPrice - marketAvg) / marketAvg) * 100;

  // Calculate percentile rank
  const allPrices = [
    benchmarkData.price_range.min,
    benchmarkData.price_range.max,
    ...benchmarkData.price_percentiles.map(p => p.value)
  ].sort((a, b) => a - b);

  const percentileRank = calculatePercentileRank(userPrice, allPrices);

  // Determine if outlier (>20% deviation)
  const isOutlier = Math.abs(deviationPercentage) > 20;

  // Generate recommendation
  let recommendation = '';
  if (deviationPercentage > 20) {
    recommendation = 'Price significantly above market average. Consider negotiating or finding alternative suppliers.';
  } else if (deviationPercentage < -20) {
    recommendation = 'Price significantly below market average. Verify product quality and authenticity.';
  } else if (deviationPercentage > 10) {
    recommendation = 'Price above market average. Monitor for potential cost savings opportunities.';
  } else if (deviationPercentage < -10) {
    recommendation = 'Price below market average. Good value, but ensure quality standards are met.';
  } else {
    recommendation = 'Price is within normal market range.';
  }

  return {
    user_price: userPrice,
    market_avg: marketAvg,
    percentile_rank: percentileRank,
    deviation_percentage: deviationPercentage,
    is_outlier: isOutlier,
    recommendation
  };
}

/**
 * Calculate percentile rank of a value in a dataset
 */
function calculatePercentileRank(value: number, sortedData: number[]): number {
  const count = sortedData.filter(x => x <= value).length;
  return (count / sortedData.length) * 100;
}

/**
 * Get price trend data for a specific HS code
 */
export async function getPriceTrendData(
  hsCode: string,
  months: number = 6
): Promise<{ date: string; avg_price: number; volume: number }[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const { data: shipments, error } = await supabase
      .from('shipment_details')
      .select('shipment_date, unit_price, container_count')
      .eq('hs_code', hsCode)
      .gte('shipment_date', startDate.toISOString().split('T')[0])
      .lte('shipment_date', endDate.toISOString().split('T')[0])
      .order('shipment_date');

    if (error || !shipments) {
      return [];
    }

    // Group by month and calculate averages
    const monthlyData = new Map<string, { prices: number[]; volumes: number[] }>();

    shipments.forEach(shipment => {
      const date = new Date(shipment.shipment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { prices: [], volumes: [] });
      }

      const data = monthlyData.get(monthKey)!;
      if (shipment.unit_price && shipment.unit_price > 0) {
        data.prices.push(shipment.unit_price);
        data.volumes.push(shipment.container_count || 1);
      }
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      date: month,
      avg_price: calculateMean(data.prices),
      volume: data.volumes.reduce((sum, vol) => sum + vol, 0)
    })).sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Error in getPriceTrendData:', error);
    return [];
  }
}

/**
 * Get top products by volume for benchmarking
 */
export async function getTopProductsByVolume(limit: number = 10): Promise<{
  hs_code: string;
  description: string;
  category: string;
  total_volume: number;
  avg_price: number;
}[]> {
  try {
    const { data: shipments, error } = await supabase
      .from('shipment_details')
      .select('hs_code, product_description, product_category, container_count, unit_price');

    if (error || !shipments) {
      return [];
    }

    const productMap = new Map<string, {
      description: string;
      category: string;
      volumes: number[];
      prices: number[];
    }>();

    shipments.forEach(shipment => {
      const hsCode = shipment.hs_code;
      if (!productMap.has(hsCode)) {
        productMap.set(hsCode, {
          description: shipment.product_description,
          category: shipment.product_category,
          volumes: [],
          prices: []
        });
      }

      const data = productMap.get(hsCode)!;
      data.volumes.push(shipment.container_count || 1);
      if (shipment.unit_price && shipment.unit_price > 0) {
        data.prices.push(shipment.unit_price);
      }
    });

    return Array.from(productMap.entries()).map(([hsCode, data]) => ({
      hs_code: hsCode,
      description: data.description,
      category: data.category,
      total_volume: data.volumes.reduce((sum, vol) => sum + vol, 0),
      avg_price: calculateMean(data.prices)
    })).sort((a, b) => b.total_volume - a.total_volume).slice(0, limit);

  } catch (error) {
    console.error('Error in getTopProductsByVolume:', error);
    return [];
  }
}
