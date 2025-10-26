import { supabase } from '@/lib/supabase/client';
import { AnomalyType, AnomalySeverity } from '@/types/database';

export interface RiskScore {
  alert_id: string;
  anomaly_id: string;
  composite_risk_score: number; // 0-100
  risk_breakdown: {
    price_deviation: number;
    volume_surge: number;
    fx_exposure: number;
    supply_chain_risk: number;
    historical_volatility: number;
  };
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  ranking: number;
  prioritization_reason: string;
}

export interface RiskAnalysis {
  overall_risk_score: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  top_risks: RiskScore[];
  recommendations: string[];
}

/**
 * Calculate comprehensive risk score for all alerts
 */
export async function calculateRiskScores(): Promise<RiskScore[]> {
  try {
    // Get all active alerts with anomaly details
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        status,
        anomalies (
          id,
          type,
          severity,
          product_id,
          detected_at,
          details
        )
      `)
      .neq('status', 'resolved');

    if (error || !alerts) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    // Get products for supply chain analysis
    const productIds = alerts
      .map((alert: any) => alert.anomalies?.product_id)
      .filter((id: any) => id !== null);
    const productCounts = new Map<string, number>();
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);
      products?.forEach((p: any) => {
        productCounts.set(p.id, (productCounts.get(p.id) || 0) + 1);
      });
    }

    const riskScores: RiskScore[] = [];

    for (const alert of alerts) {
      const anomaly = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
      if (!anomaly) continue;

      const riskScore = await calculateAlertRiskScore(alert, anomaly, productCounts);
      if (riskScore) {
        riskScores.push(riskScore);
      }
    }

    // Sort by composite risk score
    riskScores.sort((a, b) => b.composite_risk_score - a.composite_risk_score);

    // Add ranking
    riskScores.forEach((score, index) => {
      score.ranking = index + 1;
    });

    return riskScores;
  } catch (error) {
    console.error('Error calculating risk scores:', error);
    return [];
  }
}

/**
 * Calculate risk score for a single alert
 */
async function calculateAlertRiskScore(
  alert: any,
  anomaly: any,
  productCounts: Map<string, number>
): Promise<RiskScore | null> {
  try {
    let priceDeviation = 0;
    let volumeSurge = 0;
    let fxExposure = 0;
    let supplyChainRisk = 0;
    let historicalVolatility = 0;

    // 1. Price Deviation Score
    if (anomaly.type === 'price_spike') {
      const percentageChange = Math.abs(anomaly.details?.percentage_change || 0);
      priceDeviation = Math.min(percentageChange / 2, 100); // Cap at 100
    } else if (anomaly.type === 'tariff_change') {
      const percentageChange = Math.abs(anomaly.details?.percentage_change || 0);
      priceDeviation = Math.min(percentageChange, 100);
    }

    // 2. Volume Surge Score
    if (anomaly.details?.volume_surge) {
      volumeSurge = Math.min(anomaly.details.volume_surge * 10, 100);
    }

    // 3. FX Exposure Score
    if (anomaly.type === 'fx_volatility') {
      const volatility = anomaly.details?.volatility || 0;
      fxExposure = Math.min(volatility * 10, 100);
    } else if (anomaly.details?.currency_risk) {
      fxExposure = Math.min(anomaly.details.currency_risk * 20, 100);
    }

    // 4. Supply Chain Risk Score
    const productId = anomaly.product_id;
    if (productId) {
      // Check dependency count
      const dependencyCount = productCounts.get(productId) || 0;
      supplyChainRisk = Math.min(dependencyCount * 5, 100);

      // Check if product is from critical sector
      const { data: product } = await supabase
        .from('products')
        .select('category')
        .eq('id', productId)
        .single();

      if (product?.category === 'Steel & Metals' || product?.category === 'Electronics') {
        supplyChainRisk += 20; // Critical sectors get higher risk
      }
    }

    // 5. Historical Volatility Score
    if (anomaly.details?.z_score) {
      const zScore = Math.abs(anomaly.details.z_score);
      historicalVolatility = Math.min(zScore * 15, 100);
    }

    // Calculate composite score (weighted average)
    const compositeScore = Math.round(
      priceDeviation * 0.3 +
      volumeSurge * 0.2 +
      fxExposure * 0.15 +
      supplyChainRisk * 0.2 +
      historicalVolatility * 0.15
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (compositeScore >= 70) riskLevel = 'critical';
    else if (compositeScore >= 50) riskLevel = 'high';
    else if (compositeScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate prioritization reason
    const reason = generatePrioritizationReason(
      compositeScore,
      priceDeviation,
      volumeSurge,
      fxExposure,
      supplyChainRisk,
      historicalVolatility,
      anomaly
    );

    return {
      alert_id: alert.id,
      anomaly_id: anomaly.id,
      composite_risk_score: compositeScore,
      risk_breakdown: {
        price_deviation: Math.round(priceDeviation),
        volume_surge: Math.round(volumeSurge),
        fx_exposure: Math.round(fxExposure),
        supply_chain_risk: Math.round(supplyChainRisk),
        historical_volatility: Math.round(historicalVolatility),
      },
      risk_level: riskLevel,
      ranking: 0, // Will be set later
      prioritization_reason: reason,
    };
  } catch (error) {
    console.error('Error calculating alert risk score:', error);
    return null;
  }
}

/**
 * Generate overall risk analysis
 */
export async function getRiskAnalysis(): Promise<RiskAnalysis | null> {
  try {
    const riskScores = await calculateRiskScores();

    if (riskScores.length === 0) {
      return null;
    }

    // Calculate overall risk
    const overallRisk =
      riskScores.reduce((sum, s) => sum + s.composite_risk_score, 0) / riskScores.length;

    // Count by risk level
    const distribution = {
      low: riskScores.filter((s) => s.risk_level === 'low').length,
      medium: riskScores.filter((s) => s.risk_level === 'medium').length,
      high: riskScores.filter((s) => s.risk_level === 'high').length,
      critical: riskScores.filter((s) => s.risk_level === 'critical').length,
    };

    // Top 5 risks
    const topRisks = riskScores.slice(0, 5);

    // Generate recommendations
    const recommendations = generateRiskRecommendations(riskScores, distribution);

    return {
      overall_risk_score: Math.round(overallRisk),
      risk_distribution: distribution,
      top_risks: topRisks,
      recommendations,
    };
  } catch (error) {
    console.error('Error getting risk analysis:', error);
    return null;
  }
}

/**
 * Generate prioritization reason for risk score
 */
function generatePrioritizationReason(
  compositeScore: number,
  priceDeviation: number,
  volumeSurge: number,
  fxExposure: number,
  supplyChainRisk: number,
  historicalVolatility: number,
  anomaly: any
): string {
  const reasons: string[] = [];

  if (compositeScore >= 70) {
    reasons.push('CRITICAL RISK');
  } else if (compositeScore >= 50) {
    reasons.push('HIGH RISK');
  }

  if (priceDeviation > 40) {
    reasons.push(`Price deviation ${anomaly.details?.percentage_change?.toFixed(1) || 0}%`);
  }
  if (volumeSurge > 40) {
    reasons.push('Significant volume surge');
  }
  if (fxExposure > 40) {
    reasons.push('High FX volatility exposure');
  }
  if (supplyChainRisk > 40) {
    reasons.push('Critical supply chain dependency');
  }
  if (historicalVolatility > 40) {
    reasons.push(`High statistical deviation (Z-score: ${anomaly.details?.z_score?.toFixed(2) || 0})`);
  }

  return reasons.join(' · ') || 'Medium priority risk';
}

/**
 * Generate risk-based recommendations
 */
function generateRiskRecommendations(
  riskScores: RiskScore[],
  distribution: { low: number; medium: number; high: number; critical: number }
): string[] {
  const recommendations: string[] = [];

  if (distribution.critical > 0) {
    recommendations.push(
      `URGENT: ${distribution.critical} critical risk alerts require immediate attention`
    );
  }

  if (distribution.high > 3) {
    recommendations.push(`${distribution.high} high-risk alerts detected - implement risk mitigation strategies`);
  }

  const avgRisk =
    riskScores.reduce((sum, s) => sum + s.composite_risk_score, 0) / riskScores.length;
  if (avgRisk > 60) {
    recommendations.push('Overall risk profile is elevated - consider hedging and contingency planning');
  }

  // Find most common risk factor
  const riskBreakdowns = riskScores.map((s) => s.risk_breakdown);
  const maxPriceRisk = Math.max(...riskBreakdowns.map((r) => r.price_deviation));
  const maxFxRisk = Math.max(...riskBreakdowns.map((r) => r.fx_exposure));
  const maxVolumeRisk = Math.max(...riskBreakdowns.map((r) => r.volume_surge));

  if (maxPriceRisk > 50) {
    recommendations.push('Price volatility is a primary risk factor - review supplier contracts and pricing models');
  }

  if (maxFxRisk > 50) {
    recommendations.push('Currency volatility detected - implement FX hedging strategies');
  }

  if (maxVolumeRisk > 50) {
    recommendations.push('Volume surges detected - review demand forecasting and supply chain capacity');
  }

  return recommendations;
}

/**
 * Update risk scores in database for alerts
 */
export async function updateAlertRiskScores(): Promise<number> {
  try {
    const riskScores = await calculateRiskScores();

    // Update alerts with risk scores
    let updatedCount = 0;
    for (const score of riskScores) {
      const { error } = await supabase
        .from('alerts')
        .update({
          risk_score: score.composite_risk_score,
          risk_level: score.risk_level,
          risk_breakdown: score.risk_breakdown,
        })
        .eq('id', score.alert_id);

      if (!error) {
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error('Error updating alert risk scores:', error);
    return 0;
  }
}

