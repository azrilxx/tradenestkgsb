import { supabase } from '@/lib/supabase/client';
import { calculatePercentageChange } from './statistics';
import { AnomalySeverity } from '@/types/database';

export interface TariffAnomalyResult {
  productId: string;
  currentRate: number;
  previousRate: number;
  percentageChange: number;
  effectiveDate: string;
  severity: AnomalySeverity;
  detectedAt: string;
  details: Record<string, any>;
}

/**
 * Detect tariff changes for a specific product
 */
export async function detectTariffChanges(
  productId: string,
  changeThreshold: number = 10 // percentage
): Promise<TariffAnomalyResult | null> {
  try {
    // Fetch recent tariff data (get last 2 records to compare)
    const { data: tariffData, error } = await supabase
      .from('tariff_data')
      .select('rate, effective_date')
      .eq('product_id', productId)
      .order('effective_date', { ascending: false })
      .limit(2);

    if (error || !tariffData || tariffData.length < 2) {
      return null; // Need at least 2 records to detect change
    }

    const currentTariff = tariffData[0];
    const previousTariff = tariffData[1];

    const currentRate = currentTariff.rate;
    const previousRate = previousTariff.rate;
    const percentageChange = calculatePercentageChange(previousRate, currentRate);

    // Check if change exceeds threshold
    if (Math.abs(percentageChange) < changeThreshold) {
      return null; // Change is within acceptable range
    }

    // Determine severity
    const severity = determineTariffSeverity(percentageChange, currentRate, previousRate);

    return {
      productId,
      currentRate,
      previousRate,
      percentageChange,
      effectiveDate: currentTariff.effective_date,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        threshold: changeThreshold,
        change_type: percentageChange > 0 ? 'increase' : 'decrease',
        absolute_change: currentRate - previousRate,
        effective_date: currentTariff.effective_date,
        previous_effective_date: previousTariff.effective_date,
      },
    };
  } catch (error) {
    console.error('Error detecting tariff changes:', error);
    return null;
  }
}

/**
 * Detect tariff changes across all products
 */
export async function detectAllTariffChanges(
  changeThreshold: number = 10
): Promise<TariffAnomalyResult[]> {
  try {
    // Get all products that have tariff data
    const { data: products, error } = await supabase
      .from('products')
      .select('id')
      .limit(50);

    if (error || !products) {
      return [];
    }

    const anomalies: TariffAnomalyResult[] = [];

    // Check each product for tariff changes
    for (const product of products) {
      const anomaly = await detectTariffChanges(product.id, changeThreshold);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting all tariff changes:', error);
    return [];
  }
}

/**
 * Check for recent tariff changes (last N days)
 */
export async function detectRecentTariffChanges(
  daysBack: number = 30,
  changeThreshold: number = 10
): Promise<TariffAnomalyResult[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Get all recent tariff records
    const { data: recentTariffs, error } = await supabase
      .from('tariff_data')
      .select('product_id, rate, effective_date')
      .gte('effective_date', cutoffDateStr)
      .order('effective_date', { ascending: false });

    if (error || !recentTariffs || recentTariffs.length === 0) {
      return [];
    }

    // Group by product_id
    const productTariffs = new Map<string, typeof recentTariffs>();
    recentTariffs.forEach((tariff) => {
      const existing = productTariffs.get(tariff.product_id) || [];
      existing.push(tariff);
      productTariffs.set(tariff.product_id, existing);
    });

    const anomalies: TariffAnomalyResult[] = [];

    // Check each product for changes
    for (const [productId, tariffs] of productTariffs) {
      if (tariffs.length >= 2) {
        const anomaly = await detectTariffChanges(productId, changeThreshold);
        if (anomaly) {
          anomalies.push(anomaly);
        }
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting recent tariff changes:', error);
    return [];
  }
}

/**
 * Determine severity based on percentage change and absolute values
 */
function determineTariffSeverity(
  percentageChange: number,
  currentRate: number,
  previousRate: number
): AnomalySeverity {
  const absPercentChange = Math.abs(percentageChange);
  const absoluteChange = Math.abs(currentRate - previousRate);

  // Critical: Very large percentage change OR high absolute change
  if (absPercentChange >= 200 || absoluteChange >= 20) {
    return 'critical';
  }

  // High: Large percentage change OR moderate absolute change
  if (absPercentChange >= 100 || absoluteChange >= 10) {
    return 'high';
  }

  // Medium: Moderate percentage change
  if (absPercentChange >= 50 || absoluteChange >= 5) {
    return 'medium';
  }

  // Low: Anything above threshold
  return 'low';
}

/**
 * Get current tariff rate for a product
 */
export async function getCurrentTariffRate(productId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('tariff_data')
      .select('rate')
      .eq('product_id', productId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.rate;
  } catch (error) {
    return null;
  }
}