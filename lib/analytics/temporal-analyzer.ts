import { supabase } from '@/lib/supabase/client';

/**
 * Temporal insights from time-series analysis
 */
export interface TemporalInsights {
  leading_indicators: Array<{
    type: string;
    indicator_type: string;
    lead_time_days: number;
    confidence: number;
  }>;
  lagging_indicators: Array<{
    type: string;
    indicator_type: string;
    lag_time_days: number;
    confidence: number;
  }>;
  causal_relationships: Array<{
    cause: string;
    effect: string;
    confidence: number;
    lag_days: number;
  }>;
  seasonal_patterns: Array<{
    type: string;
    period_days: number;
    strength: number;
  }>;
  trends: Array<{
    type: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
  }>;
}

/**
 * Analyze temporal relationships in anomalies
 */
export async function analyzeTemporalRelationships(
  alertId: string,
  timeWindowDays: number = 90
): Promise<TemporalInsights | null> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    // Get primary alert
    const { data: primaryAlert } = await supabase
      .from('alerts')
      .select(
        `
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          detected_at,
          details
        )
      `
      )
      .eq('id', alertId)
      .single();

    if (!primaryAlert) return null;

    const primaryAnomaly = Array.isArray(primaryAlert.anomalies)
      ? primaryAlert.anomalies[0]
      : primaryAlert.anomalies;

    if (!primaryAnomaly) return null;

    // Get time-series data for related anomalies
    const { data: relatedAlerts } = await supabase
      .from('alerts')
      .select(
        `
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          detected_at,
          details
        )
      `
      )
      .neq('id', alertId)
      .gte('created_at', cutoffDate.toISOString())
      .limit(200);

    // Analyze lead-lag relationships
    const leadingIndicators = findLeadingIndicators(primaryAlert, relatedAlerts || []);
    const laggingIndicators = findLaggingIndicators(primaryAlert, relatedAlerts || []);

    // Analyze causal relationships (Granger causality)
    const causalRelationships = analyzeCausality(
      primaryAnomaly,
      relatedAlerts || [],
      timeWindowDays
    );

    // Detect seasonal patterns
    const seasonalPatterns = detectSeasonality(relatedAlerts || []);

    // Analyze trends
    const trends = analyzeTrends(relatedAlerts || []);

    return {
      leading_indicators: leadingIndicators,
      lagging_indicators: laggingIndicators,
      causal_relationships: causalRelationships,
      seasonal_patterns: seasonalPatterns,
      trends,
    };
  } catch (error) {
    console.error('Error analyzing temporal relationships:', error);
    return null;
  }
}

/**
 * Find leading indicators (predictors) for the primary anomaly
 */
function findLeadingIndicators(
  primaryAlert: any,
  relatedAlerts: any[]
): Array<{ type: string; indicator_type: string; lead_time_days: number; confidence: number }> {
  const leadingIndicators: Array<{
    type: string;
    indicator_type: string;
    lead_time_days: number;
    confidence: number;
  }> = [];

  const primaryDate = new Date(primaryAlert.created_at);

  relatedAlerts.forEach((alert) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    const alertDate = new Date(alert.created_at);
    const leadTime = Math.floor(
      (primaryDate.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only consider alerts that occurred before the primary alert
    if (leadTime > 0 && leadTime <= 90) {
      // Calculate correlation
      const correlation = calculateTemporalCorrelation(
        primaryAlert.anomalies,
        anom
      );

      if (correlation > 0.5) {
        leadingIndicators.push({
          type: anom.type,
          indicator_type: `${anom.type} → ${primaryAlert.anomalies?.type || 'primary'}`,
          lead_time_days: leadTime,
          confidence: correlation * 100,
        });
      }
    }
  });

  return leadingIndicators
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

/**
 * Find lagging indicators (consequences) of the primary anomaly
 */
function findLaggingIndicators(
  primaryAlert: any,
  relatedAlerts: any[]
): Array<{ type: string; indicator_type: string; lag_time_days: number; confidence: number }> {
  const laggingIndicators: Array<{
    type: string;
    indicator_type: string;
    lag_time_days: number;
    confidence: number;
  }> = [];

  const primaryDate = new Date(primaryAlert.created_at);

  relatedAlerts.forEach((alert) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    const alertDate = new Date(alert.created_at);
    const lagTime = Math.floor(
      (alertDate.getTime() - primaryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only consider alerts that occurred after the primary alert
    if (lagTime > 0 && lagTime <= 90) {
      const correlation = calculateTemporalCorrelation(anom, primaryAlert.anomalies);

      if (correlation > 0.5) {
        laggingIndicators.push({
          type: anom.type,
          indicator_type: `${primaryAlert.anomalies?.type || 'primary'} → ${anom.type}`,
          lag_time_days: lagTime,
          confidence: correlation * 100,
        });
      }
    }
  });

  return laggingIndicators.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

/**
 * Analyze causal relationships using Granger causality concepts
 */
function analyzeCausality(
  primaryAnomaly: any,
  relatedAlerts: any[],
  timeWindowDays: number
): Array<{ cause: string; effect: string; confidence: number; lag_days: number }> {
  const causalRelationships: Array<{
    cause: string;
    effect: string;
    confidence: number;
    lag_days: number;
  }> = [];

  // Group alerts by time windows
  const timeWindowSize = Math.floor(timeWindowDays / 5);
  const timeWindows: Record<number, any[]> = {};

  relatedAlerts.forEach((alert) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    const daysAgo = Math.floor(
      (Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const window = Math.floor(daysAgo / timeWindowSize);

    if (!timeWindows[window]) {
      timeWindows[window] = [];
    }
    timeWindows[window].push({ ...anom, original: alert });
  });

  // Check for predictive patterns
  Object.keys(timeWindows)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((window) => {
      const currentWindow = timeWindows[window];
      const nextWindow = timeWindows[window + 1];

      if (currentWindow && nextWindow) {
        currentWindow.forEach((cause: any) => {
          nextWindow.forEach((effect: any) => {
            if (cause.type !== effect.type) {
              const correlation = calculateCausalCorrelation(cause, effect);
              if (correlation > 0.6) {
                causalRelationships.push({
                  cause: cause.type,
                  effect: effect.type,
                  confidence: correlation * 100,
                  lag_days: timeWindowSize,
                });
              }
            }
          });
        });
      }
    });

  // Remove duplicates and deduplicate
  const uniqueRelationships = Array.from(
    new Map(
      causalRelationships.map((rel) => [`${rel.cause}-${rel.effect}`, rel])
    ).values()
  );

  return uniqueRelationships.sort((a, b) => b.confidence - a.confidence).slice(0, 15);
}

/**
 * Detect seasonal patterns in anomalies
 */
function detectSeasonality(relatedAlerts: any[]): Array<{
  type: string;
  period_days: number;
  strength: number;
}> {
  const seasonalPatterns: Array<{ type: string; period_days: number; strength: number }> = [];
  const typeCounts: Record<string, { dates: number[]; total: number }> = {};

  // Group by type and collect timestamps
  relatedAlerts.forEach((alert) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    if (!typeCounts[anom.type]) {
      typeCounts[anom.type] = { dates: [], total: 0 };
    }

    typeCounts[anom.type].dates.push(
      Math.floor(new Date(alert.created_at).getTime() / (1000 * 60 * 60 * 24))
    );
    typeCounts[anom.type].total++;
  });

  // Detect patterns for each type
  Object.entries(typeCounts).forEach(([type, data]) => {
    if (data.dates.length < 5) return;

    // Sort dates
    const sortedDates = [...data.dates].sort((a, b) => a - b);

    // Check for weekly patterns (7 days)
    const weeklyCorrelation = calculatePatternStrength(sortedDates, 7);
    if (weeklyCorrelation > 0.3) {
      seasonalPatterns.push({
        type,
        period_days: 7,
        strength: weeklyCorrelation * 100,
      });
    }

    // Check for monthly patterns (30 days)
    const monthlyCorrelation = calculatePatternStrength(sortedDates, 30);
    if (monthlyCorrelation > 0.3) {
      seasonalPatterns.push({
        type,
        period_days: 30,
        strength: monthlyCorrelation * 100,
      });
    }

    // Check for quarterly patterns (90 days)
    const quarterlyCorrelation = calculatePatternStrength(sortedDates, 90);
    if (quarterlyCorrelation > 0.3) {
      seasonalPatterns.push({
        type,
        period_days: 90,
        strength: quarterlyCorrelation * 100,
      });
    }
  });

  return seasonalPatterns.slice(0, 10);
}

/**
 * Analyze trends in anomalies
 */
function analyzeTrends(relatedAlerts: any[]): Array<{
  type: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;
}> {
  const trends: Array<{
    type: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
  }> = [];

  const typeData: Record<
    string,
    Array<{ timestamp: number; value: number }>
  > = {};

  // Group by type
  relatedAlerts.forEach((alert) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    if (!typeData[anom.type]) {
      typeData[anom.type] = [];
    }

    const severityValue = getSeverityValue(anom.severity);
    typeData[anom.type].push({
      timestamp: new Date(alert.created_at).getTime(),
      value: severityValue,
    });
  });

  // Calculate trends for each type
  Object.entries(typeData).forEach(([type, data]) => {
    if (data.length < 3) return;

    // Sort by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);

    // Linear regression to find slope
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.timestamp, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d) => sum + d.timestamp * d.value, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) < 0.001) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    trends.push({
      type,
      direction,
      rate: Math.abs(slope) * 1e-10, // Normalize to reasonable scale
    });
  });

  return trends;
}

/**
 * Helper: Calculate temporal correlation
 */
function calculateTemporalCorrelation(anomaly1: any, anomaly2: any): number {
  if (!anomaly1 || !anomaly2) return 0;

  // Type-based correlation
  if (anomaly1.type === anomaly2.type) return 0.3;

  // Complementary pattern correlation
  if (
    (anomaly1.type === 'price_spike' && anomaly2.type === 'freight_surge') ||
    (anomaly2.type === 'price_spike' && anomaly1.type === 'freight_surge')
  ) {
    return 0.8;
  }

  if (
    (anomaly1.type === 'tariff_change' && anomaly2.type === 'price_spike') ||
    (anomaly2.type === 'tariff_change' && anomaly1.type === 'price_spike')
  ) {
    return 0.75;
  }

  return 0.2;
}

/**
 * Helper: Calculate causal correlation
 */
function calculateCausalCorrelation(cause: any, effect: any): number {
  let baseCorrelation = 0.2;

  // Strong causality patterns
  if (cause.type === 'tariff_change' && effect.type === 'price_spike') {
    baseCorrelation = 0.9;
  }

  if (cause.type === 'fx_volatility' && effect.type === 'price_spike') {
    baseCorrelation = 0.85;
  }

  if (cause.type === 'freight_surge' && effect.type === 'price_spike') {
    baseCorrelation = 0.8;
  }

  return baseCorrelation;
}

/**
 * Helper: Calculate pattern strength for seasonality
 */
function calculatePatternStrength(sortedDates: number[], period: number): number {
  if (sortedDates.length < 3) return 0;

  // Check if dates cluster around periodic intervals
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(sortedDates[i] - sortedDates[i - 1]);
  }

  // Calculate how many gaps are close to the period
  const nearPeriod = gaps.filter(
    (gap) => Math.abs(gap - period) < period * 0.3
  ).length;

  return nearPeriod / gaps.length;
}

/**
 * Helper: Get severity value
 */
function getSeverityValue(severity: string): number {
  const values = { low: 1, medium: 2, high: 3, critical: 4 };
  return values[severity as keyof typeof values] || 0;
}

