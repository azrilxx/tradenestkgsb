import { supabase } from '@/lib/supabase/client';
import { AnomalyType, AnomalySeverity } from '@/types/database';
import { detectAllPriceAnomalies } from './price-detector';
import { detectAllTariffChanges } from './tariff-detector';
import { detectAllFreightSurges } from './freight-detector';
import { detectAllFxVolatility } from './fx-detector';

export interface AlertGenerationResult {
  success: boolean;
  alertsCreated: number;
  anomaliesDetected: number;
  breakdown: {
    price_spikes: number;
    tariff_changes: number;
    freight_surges: number;
    fx_volatility: number;
  };
  errors: string[];
}

/**
 * Run all detection algorithms and generate alerts
 */
export async function generateAllAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    success: false,
    alertsCreated: 0,
    anomaliesDetected: 0,
    breakdown: {
      price_spikes: 0,
      tariff_changes: 0,
      freight_surges: 0,
      fx_volatility: 0,
    },
    errors: [],
  };

  try {
    console.log('🔍 Starting anomaly detection...');

    // 1. Detect price anomalies
    console.log('💰 Detecting price spikes...');
    const priceAnomalies = await detectAllPriceAnomalies(30, 2.0);
    result.breakdown.price_spikes = priceAnomalies.length;

    for (const anomaly of priceAnomalies) {
      await createAnomalyAndAlert(
        'price_spike',
        anomaly.productId,
        anomaly.severity,
        {
          previous_price: anomaly.previousPrice,
          current_price: anomaly.currentPrice,
          average_price: anomaly.averagePrice,
          z_score: anomaly.zScore,
          percentage_change: anomaly.percentageChange,
          std_dev: anomaly.stdDev,
          ...anomaly.details,
        }
      );
    }

    // 2. Detect tariff changes
    console.log('📊 Detecting tariff changes...');
    const tariffAnomalies = await detectAllTariffChanges(10);
    result.breakdown.tariff_changes = tariffAnomalies.length;

    for (const anomaly of tariffAnomalies) {
      await createAnomalyAndAlert(
        'tariff_change',
        anomaly.productId,
        anomaly.severity,
        {
          previous_rate: anomaly.previousRate,
          current_rate: anomaly.currentRate,
          percentage_change: anomaly.percentageChange,
          effective_date: anomaly.effectiveDate,
          ...anomaly.details,
        }
      );
    }

    // 3. Detect freight surges
    console.log('🚢 Detecting freight surges...');
    const freightAnomalies = await detectAllFreightSurges(30, 15);
    result.breakdown.freight_surges = freightAnomalies.length;

    for (const anomaly of freightAnomalies) {
      await createAnomalyAndAlert(
        'freight_surge',
        null, // Freight anomalies are route-based, not product-based
        anomaly.severity,
        {
          route: anomaly.route,
          current_index: anomaly.currentIndex,
          average_index: anomaly.averageIndex,
          percentage_change: anomaly.percentageChange,
          ...anomaly.details,
        }
      );
    }

    // 4. Detect FX volatility
    console.log('💱 Detecting FX volatility...');
    const fxAnomalies = await detectAllFxVolatility(30, 2.5);
    result.breakdown.fx_volatility = fxAnomalies.length;

    for (const anomaly of fxAnomalies) {
      await createAnomalyAndAlert(
        'fx_volatility',
        null, // FX anomalies are currency pair-based
        anomaly.severity,
        {
          currency_pair: anomaly.currencyPair,
          current_rate: anomaly.currentRate,
          average_rate: anomaly.averageRate,
          volatility: anomaly.volatility,
          percentage_change: anomaly.percentageChange,
          ...anomaly.details,
        }
      );
    }

    // Calculate totals
    result.anomaliesDetected =
      result.breakdown.price_spikes +
      result.breakdown.tariff_changes +
      result.breakdown.freight_surges +
      result.breakdown.fx_volatility;

    result.alertsCreated = result.anomaliesDetected; // One alert per anomaly
    result.success = true;

    console.log('✅ Anomaly detection complete!');
    console.log(`   - Price spikes: ${result.breakdown.price_spikes}`);
    console.log(`   - Tariff changes: ${result.breakdown.tariff_changes}`);
    console.log(`   - Freight surges: ${result.breakdown.freight_surges}`);
    console.log(`   - FX volatility: ${result.breakdown.fx_volatility}`);
    console.log(`   - Total alerts created: ${result.alertsCreated}`);

    return result;
  } catch (error) {
    console.error('❌ Error generating alerts:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Create an anomaly record and corresponding alert
 */
async function createAnomalyAndAlert(
  type: AnomalyType,
  productId: string | null,
  severity: AnomalySeverity,
  details: Record<string, any>
): Promise<{ anomalyId: string; alertId: string } | null> {
  try {
    // Check if similar anomaly already exists (within last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: existingAnomalies } = await supabase
      .from('anomalies')
      .select('id')
      .eq('type', type)
      .eq('product_id', productId)
      .gte('detected_at', yesterday.toISOString())
      .limit(1);

    // Don't create duplicate anomalies
    if (existingAnomalies && existingAnomalies.length > 0) {
      return null;
    }

    // Create anomaly record
    const { data: anomaly, error: anomalyError } = await supabase
      .from('anomalies')
      .insert({
        type,
        product_id: productId,
        severity,
        detected_at: new Date().toISOString(),
        details,
      })
      .select()
      .single();

    if (anomalyError || !anomaly) {
      console.error('Error creating anomaly:', anomalyError);
      return null;
    }

    // Create corresponding alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        anomaly_id: anomaly.id,
        status: 'new',
      })
      .select()
      .single();

    if (alertError || !alert) {
      console.error('Error creating alert:', alertError);
      return null;
    }

    return {
      anomalyId: anomaly.id,
      alertId: alert.id,
    };
  } catch (error) {
    console.error('Error in createAnomalyAndAlert:', error);
    return null;
  }
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  status: 'new' | 'viewed' | 'resolved'
): Promise<boolean> {
  try {
    const updateData: any = { status };

    // Set resolved_at timestamp if resolving
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', alertId);

    if (error) {
      console.error('Error updating alert status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateAlertStatus:', error);
    return false;
  }
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(): Promise<{
  total: number;
  new: number;
  viewed: number;
  resolved: number;
  bySeverity: Record<AnomalySeverity, number>;
  byType: Record<AnomalyType, number>;
}> {
  try {
    // Get all alerts with anomaly details
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        id,
        status,
        anomalies (
          severity,
          type
        )
      `);

    if (error || !alerts) {
      return null;
    }

    const stats = {
      total: alerts.length,
      new: 0,
      viewed: 0,
      resolved: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<AnomalySeverity, number>,
      byType: {
        price_spike: 0,
        tariff_change: 0,
        freight_surge: 0,
        fx_volatility: 0,
      } as Record<AnomalyType, number>,
    };

    alerts.forEach((alert: any) => {
      // Count by status
      if (alert.status === 'new') stats.new++;
      else if (alert.status === 'viewed') stats.viewed++;
      else if (alert.status === 'resolved') stats.resolved++;

      // Count by severity and type
      if (alert.anomalies) {
        const anomaly = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
        if (anomaly.severity) {
          stats.bySeverity[anomaly.severity as AnomalySeverity]++;
        }
        if (anomaly.type) {
          stats.byType[anomaly.type as AnomalyType]++;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting alert statistics:', error);
    // Return empty stats if database access fails
    return {
      total: 0,
      new: 0,
      viewed: 0,
      resolved: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: { price_spike: 0, tariff_change: 0, freight_surge: 0, fx_volatility: 0 },
    };
  }
}

/**
 * Clear old resolved alerts (older than X days)
 */
export async function clearOldAlerts(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('alerts')
      .delete()
      .eq('status', 'resolved')
      .lt('resolved_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('Error clearing old alerts:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in clearOldAlerts:', error);
    return 0;
  }
}