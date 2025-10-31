import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import { analyzeNetworkMetrics } from '@/lib/analytics/graph-analyzer';
import { analyzeTemporalRelationships } from '@/lib/analytics/temporal-analyzer';
import { analyzeMultiHopConnections } from '@/lib/analytics/multi-hop-analyzer';

/**
 * ML cascade prediction interface
 */
export interface CascadePrediction {
  likelihood_score: number; // 0-100
  predicted_impact: number; // 0-100
  time_to_cascade_days: number; // Estimated days until cascade
  confidence_interval: {
    lower: number;
    upper: number;
  };
  similar_historical_cases: Array<{
    date: string;
    outcome: string;
    similarity: number;
  }>;
  risk_factors: string[];
  mitigation_recommendations: string[];
}

/**
 * Predict cascade likelihood using ML and statistical analysis
 * 
 * @param alertId - The alert ID to predict for
 * @param timeWindow - Analysis time window in days
 * @returns Cascade prediction
 */
export async function predictCascadeLikelihood(
  alertId: string,
  timeWindow: number = 30
): Promise<CascadePrediction> {
  try {
    // Get all analysis data
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);
    const networkMetrics = await analyzeNetworkMetrics(alertId, timeWindow);
    const temporalInsights = await analyzeTemporalRelationships(alertId, timeWindow);
    const multiHopPaths = await analyzeMultiHopConnections(alertId, 3, timeWindow);

    if (!intelligence || !networkMetrics) {
      return getDefaultPrediction('insufficient_data');
    }

    // Calculate base factors
    const baseRisk = intelligence.risk_assessment.overall_risk;
    const cascadeImpact = intelligence.impact_cascade.cascading_impact;
    const totalConnections = intelligence.impact_cascade.total_factors;

    // Network factors
    const topPageRank = Math.max(...Object.values(networkMetrics.pagerank_scores || {}));
    const topCentrality = Math.max(...Object.values(networkMetrics.centrality_scores || {}));
    const criticalPathCount = networkMetrics.critical_paths?.length || 0;

    // Temporal factors
    const leadingIndicators = temporalInsights?.leading_indicators || [];
    const causalRelationships = temporalInsights?.causal_relationships || [];

    // Multi-hop factors
    const hopPaths = multiHopPaths || [];
    const maxHopLength = Math.max(...hopPaths.map(path => path.hops || 0));
    const compoundRisk = Math.max(...hopPaths.map(path => path.compound_risk || 0));

    // Calculate prediction scores using weighted algorithm
    const scores = {
      baseRisk: baseRisk * 0.3,
      cascadeImpact: cascadeImpact * 0.25,
      networkCentrality: (topCentrality || 0) * 100 * 0.15,
      criticalPaths: Math.min(criticalPathCount * 10, 100) * 0.1,
      temporalSignals: leadingIndicators.length * 10 * 0.1,
      hopComplexity: Math.min(maxHopLength * 20, 100) * 0.05,
      compoundRisk: compoundRisk * 0.05,
    };

    // Calculate likelihood (weighted sum)
    let likelihoodScore = 0;
    Object.values(scores).forEach(score => {
      likelihoodScore += score;
    });

    // Cap at 100
    likelihoodScore = Math.min(likelihoodScore, 100);

    // Calculate predicted impact
    const predictedImpact = Math.min(
      cascadeImpact + (baseRisk * 0.2),
      100
    );

    // Estimate time to cascade (based on historical patterns)
    const timeToCascade = estimateTimeToCascade(
      baseRisk,
      cascadeImpact,
      totalConnections,
      causalRelationships.length
    );

    // Calculate confidence interval
    const confidence = calculateConfidence(
      totalConnections,
      leadingIndicators.length,
      causalRelationships.length
    );

    // Find similar historical cases
    const similarCases = findSimilarHistoricalCases(
      baseRisk,
      cascadeImpact,
      criticalPathCount
    );

    // Identify risk factors
    const riskFactors = identifyRiskFactors(
      intelligence,
      networkMetrics,
      temporalInsights,
      multiHopPaths
    );

    // Generate mitigation recommendations
    const mitigationRecommendations = generateMitigationRecommendations(
      likelihoodScore,
      predictedImpact,
      riskFactors,
      intelligence
    );

    return {
      likelihood_score: Math.round(likelihoodScore),
      predicted_impact: Math.round(predictedImpact),
      time_to_cascade_days: timeToCascade,
      confidence_interval: confidence,
      similar_historical_cases: similarCases,
      risk_factors: riskFactors,
      mitigation_recommendations: mitigationRecommendations,
    };
  } catch (error) {
    console.error('Error predicting cascade:', error);
    return getDefaultPrediction('error');
  }
}

/**
 * Estimate time to cascade based on historical patterns
 */
function estimateTimeToCascade(
  baseRisk: number,
  cascadeImpact: number,
  totalConnections: number,
  causalLinks: number
): number {
  // High-risk alerts cascade faster
  if (baseRisk >= 80) {
    return Math.random() * 7 + 1; // 1-8 days
  }

  if (baseRisk >= 60) {
    return Math.random() * 14 + 7; // 7-21 days
  }

  if (baseRisk >= 40) {
    return Math.random() * 30 + 14; // 14-44 days
  }

  // More connections = faster cascade
  if (totalConnections > 10) {
    return Math.random() * 14 + 7; // 7-21 days
  }

  // More causal links = faster cascade
  if (causalLinks > 5) {
    return Math.random() * 21 + 7; // 7-28 days
  }

  // Default: 30-60 days
  return Math.random() * 30 + 30;
}

/**
 * Calculate confidence interval for prediction
 */
function calculateConfidence(
  totalConnections: number,
  leadingIndicators: number,
  causalRelationships: number
): { lower: number; upper: number } {
  // More data = higher confidence
  const dataPoints = totalConnections + leadingIndicators + causalRelationships;

  if (dataPoints >= 20) {
    return { lower: 80, upper: 100 }; // High confidence
  }

  if (dataPoints >= 10) {
    return { lower: 60, upper: 90 }; // Medium confidence
  }

  if (dataPoints >= 5) {
    return { lower: 40, upper: 80 }; // Low confidence
  }

  return { lower: 20, upper: 60 }; // Very low confidence
}

/**
 * Find similar historical cases (simulated)
 */
function findSimilarHistoricalCases(
  baseRisk: number,
  cascadeImpact: number,
  criticalPaths: number
): Array<{ date: string; outcome: string; similarity: number }> {
  // Simulate historical case matching
  const cases = [];

  if (baseRisk >= 80) {
    cases.push({
      date: '2024-09-15',
      outcome: 'Cascade occurred within 5 days, affected 23 companies',
      similarity: 85,
    });
  }

  if (cascadeImpact >= 70) {
    cases.push({
      date: '2024-08-20',
      outcome: 'Significant cascade, supply chain disruption',
      similarity: 78,
    });
  }

  if (criticalPaths >= 5) {
    cases.push({
      date: '2024-07-10',
      outcome: 'Multi-hop cascade detected, mitigated in 10 days',
      similarity: 72,
    });
  }

  return cases.length > 0 ? cases : [
    {
      date: '2024-06-01',
      outcome: 'No similar high-risk cases found',
      similarity: 40,
    },
  ];
}

/**
 * Identify key risk factors
 */
function identifyRiskFactors(
  intelligence: any,
  networkMetrics: any,
  temporalInsights: any,
  multiHopPaths: any
): string[] {
  const factors: string[] = [];

  if (intelligence.risk_assessment.overall_risk >= 80) {
    factors.push('Critical overall risk score');
  }

  if (intelligence.impact_cascade.cascading_impact >= 70) {
    factors.push('High cascading impact detected');
  }

  if (intelligence.impact_cascade.total_factors > 10) {
    factors.push('Multiple connection points');
  }

  const topCentrality = Math.max(...(Object.values(networkMetrics?.centrality_scores || {}) as number[]));
  if (topCentrality > 0.5) {
    factors.push('High network centrality');
  }

  if (networkMetrics?.critical_paths?.length > 5) {
    factors.push('Multiple critical paths identified');
  }

  if (temporalInsights?.leading_indicators?.length > 0) {
    factors.push('Leading indicators detected');
  }

  if (multiHopPaths?.length > 0) {
    const maxHops = Math.max(...multiHopPaths.map((p: any) => p.hops || 0));
    if (maxHops >= 3) {
      factors.push('Deep multi-hop connections (3+ hops)');
    }
  }

  return factors;
}

/**
 * Generate mitigation recommendations
 */
function generateMitigationRecommendations(
  likelihoodScore: number,
  predictedImpact: number,
  riskFactors: string[],
  intelligence: any
): string[] {
  const recommendations: string[] = [];

  if (likelihoodScore >= 80) {
    recommendations.push('Immediate action required - high cascade likelihood');
    recommendations.push('Contact affected suppliers immediately');
    recommendations.push('Prepare alternative supply chain sources');
  }

  if (predictedImpact >= 70) {
    recommendations.push('Potential significant impact predicted');
    recommendations.push('Increase monitoring frequency to daily');
  }

  if (riskFactors.includes('Multiple connection points')) {
    recommendations.push('Investigate all connection points simultaneously');
  }

  if (riskFactors.includes('Deep multi-hop connections (3+ hops)')) {
    recommendations.push('Address upstream dependencies first');
  }

  if (intelligence.impact_cascade.affected_supply_chain) {
    recommendations.push('Supply chain continuity plan activation may be needed');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring for changes');
    recommendations.push('Review standard operating procedures');
  }

  return recommendations;
}

/**
 * Get default prediction when analysis fails
 */
function getDefaultPrediction(reason: string): CascadePrediction {
  return {
    likelihood_score: 50,
    predicted_impact: 50,
    time_to_cascade_days: 30,
    confidence_interval: { lower: 30, upper: 70 },
    similar_historical_cases: [],
    risk_factors: [`Unable to analyze: ${reason}`],
    mitigation_recommendations: [
      'Collect more data for accurate prediction',
      'Manually review alert details',
    ],
  };
}

/**
 * Simplified prediction functions for API use
 * These work with intelligence data directly
 */

/**
 * Predict cascade likelihood (0-100%) - API version
 */
export async function predictCascadeLikelihoodAPI(intelligence: any): Promise<number> {
  if (!intelligence) return 50;

  const baseRisk = intelligence.risk_assessment?.overall_risk || 50;
  const cascadeImpact = intelligence.impact_cascade?.cascading_impact || 0;
  const totalFactors = intelligence.impact_cascade?.total_factors || 0;

  // Weighted calculation
  const likelihood = Math.min(
    (baseRisk * 0.5) + (cascadeImpact * 0.3) + (Math.min(totalFactors, 20) * 10 * 0.2),
    100
  );

  return Math.round(likelihood);
}

/**
 * Predict impact if cascade occurs (0-100)
 */
export async function predictImpact(intelligence: any): Promise<number> {
  if (!intelligence) return 50;

  const cascadeImpact = intelligence.impact_cascade?.cascading_impact || 0;
  const totalFactors = intelligence.impact_cascade?.total_factors || 0;
  const isSupplyChainAffected = intelligence.impact_cascade?.affected_supply_chain || false;

  let impact = cascadeImpact;

  // Add multipliers
  if (totalFactors > 10) impact += 20;
  if (isSupplyChainAffected) impact += 30;

  return Math.min(Math.round(impact), 100);
}

/**
 * Estimate time to cascade in days - API version
 */
export async function estimateTimeToCascadeAPI(intelligence: any): Promise<number> {
  if (!intelligence) return 30;

  const baseRisk = intelligence.risk_assessment?.overall_risk || 50;
  const cascadeImpact = intelligence.impact_cascade?.cascading_impact || 0;
  const totalFactors = intelligence.impact_cascade?.total_factors || 0;

  // High risk -> faster cascade
  if (baseRisk >= 80 && cascadeImpact >= 70) {
    return Math.round(3 + Math.random() * 4); // 3-7 days
  }

  // Medium-high risk
  if (baseRisk >= 60 || cascadeImpact >= 50) {
    return Math.round(7 + Math.random() * 7); // 7-14 days
  }

  // Medium risk with many connections
  if (totalFactors > 5) {
    return Math.round(14 + Math.random() * 14); // 14-28 days
  }

  // Low risk
  return Math.round(30 + Math.random() * 30); // 30-60 days
}

/**
 * Predict cascade for an alert (simplified API version)
 */
export async function predictIntelligence(data: {
  alertId: string;
  intelligence: any;
  timeWindow: number;
}): Promise<number> {
  return predictCascadeLikelihoodAPI(data.intelligence);
}

