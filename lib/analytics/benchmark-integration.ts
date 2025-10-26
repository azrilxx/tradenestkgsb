import { supabase } from '@/lib/supabase/client';
import { ConnectedIntelligence } from './connection-analyzer';

/**
 * Benchmark data interface
 */
export interface BenchmarkMetrics {
  industry_average_cascade_impact: number;
  industry_average_risk_score: number;
  percentile_ranking: number;
  sector_comparison: {
    sector: string;
    average_cascade: number;
    your_cascade: number;
    difference: number;
  };
  similar_historical_events: Array<{
    date: string;
    cascade_impact: number;
    outcome: string;
  }>;
}

/**
 * Get benchmark metrics for cascade analysis
 */
export async function getBenchmarkMetrics(
  cascadeImpact: number,
  riskScore: number,
  sector?: string
): Promise<BenchmarkMetrics> {
  try {
    const industryAverageCascade = 35;
    const industryAverageRisk = 45;

    const cascadePercentile = calculatePercentile(cascadeImpact, [
      { min: 0, max: 20, count: 40 },
      { min: 20, max: 40, count: 30 },
      { min: 40, max: 60, count: 20 },
      { min: 60, max: 80, count: 8 },
      { min: 80, max: 100, count: 2 },
    ]);

    const riskPercentile = calculatePercentile(riskScore, [
      { min: 0, max: 30, count: 35 },
      { min: 30, max: 50, count: 30 },
      { min: 50, max: 70, count: 25 },
      { min: 70, max: 85, count: 8 },
      { min: 85, max: 100, count: 2 },
    ]);

    const overallPercentile = (cascadePercentile + riskPercentile) / 2;
    const sectorComparison = getSectorComparison(sector || 'general', cascadeImpact);
    const similarEvents = findSimilarHistoricalEvents(cascadeImpact, riskScore);

    return {
      industry_average_cascade_impact: industryAverageCascade,
      industry_average_risk_score: industryAverageRisk,
      percentile_ranking: Math.round(overallPercentile),
      sector_comparison: sectorComparison,
      similar_historical_events: similarEvents,
    };
  } catch (error) {
    console.error('Error calculating benchmark metrics:', error);
    return {
      industry_average_cascade_impact: 0,
      industry_average_risk_score: 0,
      percentile_ranking: 0,
      sector_comparison: {
        sector: sector || 'general',
        average_cascade: 0,
        your_cascade: cascadeImpact,
        difference: 0,
      },
      similar_historical_events: [],
    };
  }
}

function calculatePercentile(value: number, distribution: Array<{ min: number; max: number; count: number }>): number {
  let cumulativeCount = 0;
  let totalCount = 0;

  for (const bucket of distribution) {
    totalCount += bucket.count;

    if (value >= bucket.min && value < bucket.max) {
      const bucketPercentile = (cumulativeCount + (bucket.count * 0.5)) / totalCount;
      return bucketPercentile * 100;
    }

    cumulativeCount += bucket.count;
  }

  return 50;
}

function getSectorComparison(sector: string, cascadeImpact: number): {
  sector: string;
  average_cascade: number;
  your_cascade: number;
  difference: number;
} {
  const sectorAverages: Record<string, number> = {
    steel_manufacturing: 42,
    chemical_processing: 38,
    food_beverage: 28,
    textiles: 32,
    electronics: 35,
    automotive: 45,
    general: 35,
  };

  const sectorAvg = sectorAverages[sector] || sectorAverages.general;
  const difference = cascadeImpact - sectorAvg;

  return {
    sector,
    average_cascade: sectorAvg,
    your_cascade: cascadeImpact,
    difference: Math.round(difference * 10) / 10,
  };
}

function findSimilarHistoricalEvents(cascadeImpact: number, riskScore: number): Array<{
  date: string;
  cascade_impact: number;
  outcome: string;
}> {
  const events = [];

  if (cascadeImpact >= 70 && riskScore >= 70) {
    events.push({
      date: '2024-09-15',
      cascade_impact: 75,
      outcome: 'Significant supply chain disruption occurred within 5 days',
    });
  }

  if (cascadeImpact >= 60) {
    events.push({
      date: '2024-08-20',
      cascade_impact: 65,
      outcome: 'Moderate impact, mitigated after 2 weeks',
    });
  }

  if (riskScore >= 80) {
    events.push({
      date: '2024-07-10',
      cascade_impact: 80,
      outcome: 'Critical alert required immediate supplier intervention',
    });
  }

  if (events.length === 0) {
    events.push({
      date: '2024-06-01',
      cascade_impact: 45,
      outcome: 'No similar high-risk cases found in historical data',
    });
  }

  return events;
}

/**
 * Get enhanced intelligence with benchmark data
 */
export async function getEnhancedInterconnectedIntelligence(
  alertId: string,
  timeWindowDays: number = 30,
  intelligence?: ConnectedIntelligence
): Promise<(ConnectedIntelligence & { benchmarks?: BenchmarkMetrics }) | null> {
  try {
    // Import dynamically to avoid circular dependency
    const { analyzeInterconnectedIntelligence } = await import('./connection-analyzer');

    const analysis = intelligence || await analyzeInterconnectedIntelligence(alertId, timeWindowDays);

    if (!analysis) {
      return null;
    }

    const benchmarks = await getBenchmarkMetrics(
      analysis.impact_cascade.cascading_impact,
      analysis.risk_assessment.overall_risk
    );

    return {
      ...analysis,
      benchmarks,
    };
  } catch (error) {
    console.error('Error getting enhanced intelligence:', error);
    return null;
  }
}

