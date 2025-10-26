import { supabase } from '@/lib/supabase/client';
import { AnomalyType } from '@/types/database';

export interface ConnectionFactor {
  id: string;
  type: AnomalyType;
  alert_id: string;
  timestamp: string;
  severity: string;
  product_id?: string;
  correlation_score?: number;
  details?: Record<string, any>;
}

export interface ConnectedIntelligence {
  primary_alert: {
    id: string;
    type: AnomalyType;
    severity: string;
    timestamp: string;
    product_id?: string;
    details?: Record<string, any>;
  };
  connected_factors: ConnectionFactor[];
  impact_cascade: {
    cascading_impact: number;
    total_factors: number;
    affected_supply_chain: boolean;
  };
  correlation_matrix: {
    factor_pairs: Array<{
      factor1: string;
      factor2: string;
      correlation: number;
    }>;
  };
  recommended_actions: string[];
  risk_assessment: {
    overall_risk: number; // 0-100
    risk_factors: string[];
    mitigation_priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Analyze interconnected anomalies to detect relationships
 * Inspired by Wood Mackenzie's "Intelligence Connected" approach
 */
export async function analyzeInterconnectedIntelligence(
  alertId: string,
  timeWindowDays: number = 30
): Promise<ConnectedIntelligence | null> {
  try {
    // Get the primary alert and anomaly
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          product_id,
          detected_at,
          details
        )
      `)
      .eq('id', alertId)
      .single();

    if (alertError || !alertData) {
      console.error('Error fetching primary alert:', alertError);
      return null;
    }

    const primaryAnomaly = Array.isArray(alertData.anomalies)
      ? alertData.anomalies[0]
      : alertData.anomalies;

    if (!primaryAnomaly) {
      return null;
    }

    // Get related anomalies within the time window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    const { data: relatedAlerts, error: relatedError } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          product_id,
          detected_at,
          details
        )
      `)
      .neq('id', alertId)
      .gte('created_at', cutoffDate.toISOString())
      .limit(50);

    if (relatedError) {
      console.error('Error fetching related alerts:', relatedError);
    }

    // Analyze connections
    const connectedFactors: ConnectionFactor[] = [];

    // 1. Find related product anomalies (same product, different type)
    if (primaryAnomaly.product_id) {
      const productRelated = (relatedAlerts || [])
        .map((a: any) => {
          const anom = Array.isArray(a.anomalies) ? a.anomalies[0] : a.anomalies;
          return anom?.product_id === primaryAnomaly.product_id && anom.type !== primaryAnomaly.type
            ? {
              id: a.id,
              type: anom.type,
              alert_id: a.id,
              timestamp: a.created_at,
              severity: anom.severity,
              product_id: anom.product_id,
              details: anom.details,
              correlation_score: calculateCorrelationScore(
                primaryAnomaly.type,
                anom.type,
                primaryAnomaly.details,
                anom.details
              ),
            }
            : null;
        })
        .filter((f): f is NonNullable<typeof f> => f !== null) as ConnectionFactor[];

      connectedFactors.push(...productRelated);
    }

    // 2. Find anomalies with similar patterns (price + freight, fx + tariff)
    const patternRelated = (relatedAlerts || [])
      .map((a: any) => {
        const anom = Array.isArray(a.anomalies) ? a.anomalies[0] : a.anomalies;
        if (!anom || anom.type === primaryAnomaly.type) return null;

        const correlation = calculatePatternCorrelation(
          primaryAnomaly.type,
          anom.type,
          primaryAnomaly.details,
          anom.details
        );

        if (correlation > 0.3) {
          return {
            id: a.id,
            type: anom.type,
            alert_id: a.id,
            timestamp: a.created_at,
            severity: anom.severity,
            product_id: anom.product_id,
            details: anom.details,
            correlation_score: correlation,
          };
        }
        return null;
      })
      .filter((f): f is NonNullable<typeof f> => f !== null) as ConnectionFactor[];

    connectedFactors.push(...patternRelated);

    // NEW: Find cross-product correlations (sector-wide patterns)
    const crossProductRelated = findCrossProductCorrelations(primaryAnomaly, relatedAlerts);
    connectedFactors.push(...crossProductRelated);

    // NEW: Find geographic proximity correlations
    const geographicRelated = findGeographicCorrelations(primaryAnomaly, relatedAlerts);
    connectedFactors.push(...geographicRelated);

    // NEW: Detect circular dependencies
    const circularDeps = detectCircularDependencies(primaryAnomaly, relatedAlerts);
    connectedFactors.push(...circularDeps);

    // NEW: Historical pattern matching
    const historicalMatches = findHistoricalPatterns(primaryAnomaly, relatedAlerts, cutoffDate);
    connectedFactors.push(...historicalMatches);

    // 3. Deduplicate and sort by correlation score
    const uniqueFactors = Array.from(
      new Map(connectedFactors.map((f) => [f.id, f])).values()
    ).sort((a, b) => (b.correlation_score || 0) - (a.correlation_score || 0));

    // Calculate impact cascade
    const cascadingImpact = calculateCascadingImpact(primaryAnomaly.type, uniqueFactors);
    const affectedSupplyChain = checkSupplyChainImpact(primaryAnomaly.type, uniqueFactors);

    // Generate correlation matrix
    const correlationMatrix = generateCorrelationMatrix([primaryAnomaly, ...uniqueFactors]);

    // Generate recommendations
    const recommendations = generateRecommendations(primaryAnomaly, uniqueFactors, cascadingImpact);

    // Calculate risk assessment
    const riskAssessment = calculateRiskAssessment(
      primaryAnomaly,
      uniqueFactors,
      cascadingImpact
    );

    return {
      primary_alert: {
        id: alertData.id,
        type: primaryAnomaly.type,
        severity: primaryAnomaly.severity,
        timestamp: alertData.created_at,
        product_id: primaryAnomaly.product_id || undefined,
        details: primaryAnomaly.details,
      },
      connected_factors: uniqueFactors.slice(0, 10), // Top 10 connections
      impact_cascade: {
        cascading_impact: cascadingImpact,
        total_factors: uniqueFactors.length,
        affected_supply_chain: affectedSupplyChain,
      },
      correlation_matrix: correlationMatrix,
      recommended_actions: recommendations,
      risk_assessment: riskAssessment,
    };
  } catch (error) {
    console.error('Error analyzing interconnected intelligence:', error);
    return null;
  }
}

/**
 * Calculate correlation score between two anomaly types
 */
function calculateCorrelationScore(
  type1: AnomalyType,
  type2: AnomalyType,
  details1?: Record<string, any>,
  details2?: Record<string, any>
): number {
  // High correlation: same product with different anomaly types
  if (type1 !== type2) {
    // Check for complementary patterns
    if (
      (type1 === 'price_spike' && type2 === 'freight_surge') ||
      (type2 === 'price_spike' && type1 === 'freight_surge')
    ) {
      return 0.9; // Price spike + freight surge = strong correlation
    }
    if (
      (type1 === 'tariff_change' && type2 === 'price_spike') ||
      (type2 === 'tariff_change' && type1 === 'price_spike')
    ) {
      return 0.85; // Tariff change affects prices
    }
    if (
      (type1 === 'fx_volatility' && type2 === 'price_spike') ||
      (type2 === 'fx_volatility' && type1 === 'price_spike')
    ) {
      return 0.75; // FX volatility affects prices
    }
  }

  // Medium correlation for different types on same product
  if (details1?.product_id && details2?.product_id) {
    if (details1.product_id === details2.product_id) {
      return 0.6;
    }
  }

  return 0.3;
}

/**
 * Calculate pattern-based correlation
 */
function calculatePatternCorrelation(
  type1: AnomalyType,
  type2: AnomalyType,
  details1?: Record<string, any>,
  details2?: Record<string, any>
): number {
  // Price anomalies often correlate with freight/fx/tariff
  if (type1 === 'price_spike') {
    if (type2 === 'freight_surge' && details1?.percentage_change && details2?.percentage_change) {
      const priceChange = Math.abs(details1.percentage_change);
      const freightChange = Math.abs(details2.percentage_change);
      // High correlation if both changes are significant
      if (priceChange > 20 && freightChange > 20) return 0.8;
    }
    if (type2 === 'fx_volatility' && details1?.percentage_change && details2?.percentage_change) {
      const priceChange = Math.abs(details1.percentage_change);
      const fxVolatility = Math.abs(details2.percentage_change);
      if (priceChange > 15 && fxVolatility > 10) return 0.75;
    }
  }

  // Tariff changes often correlate with price shifts
  if (type1 === 'tariff_change' && type2 === 'price_spike') {
    if (details1?.percentage_change && Math.abs(details1.percentage_change) > 10) {
      return 0.7;
    }
  }

  return 0.2;
}

/**
 * Calculate cascading impact score
 */
function calculateCascadingImpact(primaryType: AnomalyType, factors: ConnectionFactor[]): number {
  let impact = 0;

  // Base impact by severity
  const severityScores = { low: 10, medium: 30, high: 60, critical: 100 };
  impact += severityScores[factors[0]?.severity as keyof typeof severityScores] || 0;

  // Multiply by number of connected factors
  impact *= 1 + factors.length * 0.2;

  // Multipliers for different types
  const criticalTypes = ['critical', 'high'];
  const criticalCount = factors.filter((f) => criticalTypes.includes(f.severity)).length;
  impact += criticalCount * 20;

  return Math.min(impact, 100); // Cap at 100
}

/**
 * Check if supply chain is affected
 */
function checkSupplyChainImpact(primaryType: AnomalyType, factors: ConnectionFactor[]): boolean {
  // Supply chain affected if multiple types of anomalies
  const uniqueTypes = new Set(factors.map((f) => f.type));
  uniqueTypes.add(primaryType);

  // If 3+ different anomaly types, supply chain is affected
  return uniqueTypes.size >= 3;
}

/**
 * Generate correlation matrix
 */
function generateCorrelationMatrix(anomalies: any[]): {
  factor_pairs: Array<{
    factor1: string;
    factor2: string;
    correlation: number;
  }>;
} {
  const pairs: Array<{ factor1: string; factor2: string; correlation: number }> = [];

  for (let i = 0; i < anomalies.length; i++) {
    for (let j = i + 1; j < anomalies.length; j++) {
      const anomaly1 = Array.isArray(anomalies[i]) ? anomalies[i][0] : anomalies[i];
      const anomaly2 = Array.isArray(anomalies[j]) ? anomalies[j][0] : anomalies[j];

      if (anomaly1 && anomaly2) {
        const correlation = calculateCorrelationScore(
          anomaly1.type,
          anomaly2.type,
          anomaly1.details,
          anomaly2.details
        );

        pairs.push({
          factor1: `${anomaly1.type}`,
          factor2: `${anomaly2.type}`,
          correlation,
        });
      }
    }
  }

  return { factor_pairs: pairs };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  primaryAnomaly: any,
  factors: ConnectionFactor[],
  cascadingImpact: number
): string[] {
  const recommendations: string[] = [];

  // Price spike recommendations
  if (primaryAnomaly.type === 'price_spike') {
    recommendations.push('Review supplier pricing agreements for sudden changes');
    if (factors.some((f) => f.type === 'freight_surge')) {
      recommendations.push('Investigate freight route alternatives to reduce costs');
    }
    if (factors.some((f) => f.type === 'fx_volatility')) {
      recommendations.push('Consider hedging currency exposure with forward contracts');
    }
    if (cascadingImpact > 70) {
      recommendations.push('URGENT: Multiple factors affecting supply - escalate to management');
    }
  }

  // Tariff change recommendations
  if (primaryAnomaly.type === 'tariff_change') {
    recommendations.push('Update customs declaration templates with new rates');
    recommendations.push('Notify trading partners of compliance requirements');
    if (factors.some((f) => f.type === 'price_spike')) {
      recommendations.push('Negotiate price adjustments with suppliers to offset tariff impact');
    }
  }

  // Freight surge recommendations
  if (primaryAnomaly.type === 'freight_surge') {
    recommendations.push('Explore alternative shipping routes and carriers');
    recommendations.push('Consider consolidating shipments to reduce freight costs');
    if (factors.some((f) => f.type === 'price_spike')) {
      recommendations.push('Evaluate local sourcing or regional suppliers');
    }
  }

  // FX volatility recommendations
  if (primaryAnomaly.type === 'fx_volatility') {
    recommendations.push('Review FX exposure and implement hedging strategy');
    recommendations.push('Monitor central bank policy changes affecting exchange rates');
  }

  // High impact recommendations
  if (cascadingImpact > 80) {
    recommendations.unshift('CRITICAL: Immediate supply chain intervention required');
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Calculate risk assessment
 */
function calculateRiskAssessment(
  primaryAnomaly: any,
  factors: ConnectionFactor[],
  cascadingImpact: number
): {
  overall_risk: number;
  risk_factors: string[];
  mitigation_priority: 'low' | 'medium' | 'high' | 'critical';
} {
  let overallRisk = cascadingImpact;
  const riskFactors: string[] = [];

  // Risk based on severity
  if (primaryAnomaly.severity === 'critical') {
    overallRisk = Math.max(overallRisk, 90);
    riskFactors.push('Critical anomaly severity');
  }

  // Risk based on number of connections
  if (factors.length >= 5) {
    overallRisk += 15;
    riskFactors.push('Multiple interconnected anomalies detected');
  }

  // Risk based on types
  const anomalyTypes = new Set([primaryAnomaly.type, ...factors.map((f) => f.type)]);
  if (anomalyTypes.size >= 3) {
    overallRisk += 20;
    riskFactors.push('Multiple risk dimensions affected (price, freight, FX, tariff)');
  }

  // Severity-based risk factors
  if (factors.some((f) => f.severity === 'critical')) {
    overallRisk += 10;
    riskFactors.push('Critical-level connected factors detected');
  }

  // Determine mitigation priority
  let priority: 'low' | 'medium' | 'high' | 'critical';
  if (overallRisk >= 80) {
    priority = 'critical';
  } else if (overallRisk >= 60) {
    priority = 'high';
  } else if (overallRisk >= 40) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    overall_risk: Math.min(overallRisk, 100),
    risk_factors: riskFactors,
    mitigation_priority: priority,
  };
}

/**
 * Find cross-product correlations (sector-wide patterns)
 */
function findCrossProductCorrelations(
  primaryAnomaly: any,
  relatedAlerts: any[]
): ConnectionFactor[] {
  const factors: ConnectionFactor[] = [];

  // Find anomalies in the same sector/category even with different products
  relatedAlerts.forEach((alert: any) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom || !anom.product_id || !primaryAnomaly.product_id) return;

    // Check if products are in same category (if we have category data)
    const sameCategory = anom.details?.category === primaryAnomaly.details?.category;

    if (sameCategory && anom.type === primaryAnomaly.type) {
      factors.push({
        id: alert.id,
        type: anom.type,
        alert_id: alert.id,
        timestamp: alert.created_at,
        severity: anom.severity,
        product_id: anom.product_id,
        details: anom.details,
        correlation_score: 0.55, // Medium correlation for sector-wide patterns
      });
    }
  });

  return factors.slice(0, 10); // Limit to top 10
}

/**
 * Find geographic proximity correlations
 */
function findGeographicCorrelations(
  primaryAnomaly: any,
  relatedAlerts: any[]
): ConnectionFactor[] {
  const factors: ConnectionFactor[] = [];

  // Check for geographic proximity in details
  const primaryCountry = primaryAnomaly.details?.country || primaryAnomaly.details?.origin;

  relatedAlerts.forEach((alert: any) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    const alertCountry = anom.details?.country || anom.details?.origin;

    // Same country/region correlation
    if (primaryCountry && alertCountry && primaryCountry === alertCountry) {
      factors.push({
        id: alert.id,
        type: anom.type,
        alert_id: alert.id,
        timestamp: alert.created_at,
        severity: anom.severity,
        product_id: anom.product_id,
        details: anom.details,
        correlation_score: 0.45,
      });
    }
  });

  return factors.slice(0, 10);
}

/**
 * Detect circular dependencies (A affects B affects A patterns)
 */
function detectCircularDependencies(
  primaryAnomaly: any,
  relatedAlerts: any[]
): ConnectionFactor[] {
  const factors: ConnectionFactor[] = [];

  // Look for complementary bidirectional relationships
  const bidirectionalPatterns = [
    ['price_spike', 'freight_surge'],
    ['tariff_change', 'price_spike'],
    ['fx_volatility', 'price_spike'],
  ];

  relatedAlerts.forEach((alert: any) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    // Check if there's a bidirectional relationship
    const isBidirectional = bidirectionalPatterns.some(
      ([type1, type2]) =>
        (primaryAnomaly.type === type1 && anom.type === type2) ||
        (primaryAnomaly.type === type2 && anom.type === type1)
    );

    if (isBidirectional) {
      factors.push({
        id: alert.id,
        type: anom.type,
        alert_id: alert.id,
        timestamp: alert.created_at,
        severity: anom.severity,
        product_id: anom.product_id,
        details: { ...anom.details, circular_dependency: true },
        correlation_score: 0.65, // Higher score for circular dependencies
      });
    }
  });

  return factors.slice(0, 5);
}

/**
 * Find historical patterns
 * Match similar patterns from earlier time periods
 */
function findHistoricalPatterns(
  primaryAnomaly: any,
  relatedAlerts: any[],
  cutoffDate: Date
): ConnectionFactor[] {
  const factors: ConnectionFactor[] = [];

  // Group anomalies by type and time
  const typeGroups: Record<string, any[]> = {};

  relatedAlerts.forEach((alert: any) => {
    const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    if (!anom) return;

    if (!typeGroups[anom.type]) {
      typeGroups[anom.type] = [];
    }
    typeGroups[anom.type].push({ alert, anomaly: anom });
  });

  // Look for recurring patterns
  Object.entries(typeGroups).forEach(([type, occurrences]) => {
    if (occurrences.length >= 3) {
      // Multiple occurrences suggest historical pattern
      occurrences.forEach(({ alert, anomaly }) => {
        const timeDiff =
          (Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60 * 24);

        if (timeDiff > 14) {
          // Historical (more than 2 weeks ago)
          factors.push({
            id: alert.id,
            type: anomaly.type,
            alert_id: alert.id,
            timestamp: alert.created_at,
            severity: anomaly.severity,
            product_id: anomaly.product_id,
            details: { ...anomaly.details, historical_pattern: true, occurrences: occurrences.length },
            correlation_score: 0.4,
          });
        }
      });
    }
  });

  return factors.slice(0, 10);
}
