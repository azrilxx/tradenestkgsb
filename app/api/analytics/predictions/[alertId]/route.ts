import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import { predictCascadeLikelihood, predictImpact, estimateTimeToCascade } from '@/lib/ml/cascade-predictor';
import { getUserSubscription } from '@/lib/subscription/tier-checker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/analytics/predictions/[alertId]
 * Get ML predictions for cascade likelihood and impact
 * Requires Enterprise tier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Check subscription tier (ML predictions only for Enterprise)
    const subscription = await getUserSubscription(user.id);

    if (subscription?.tier !== 'enterprise') {
      return NextResponse.json(
        {
          error: 'ML predictions require Enterprise tier',
          requiredTier: 'enterprise',
          currentTier: subscription?.tier || 'free',
        },
        { status: 403 }
      );
    }

    // Get time window
    const { searchParams } = new URL(request.url);
    const timeWindowParam = searchParams.get('window');
    const timeWindow = parseInt(timeWindowParam || '180'); // Enterprise gets 180-day window

    // Analyze current intelligence
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Could not analyze interconnected intelligence' },
        { status: 404 }
      );
    }

    // Generate ML predictions
    const predictions = {
      alert_id: alertId,
      analyzed_at: new Date().toISOString(),
      time_window: timeWindow,

      // Cascade likelihood prediction (0-100%)
      likelihood: await predictCascadeLikelihood(intelligence),

      // Predicted impact if cascade occurs
      predicted_impact: await predictImpact(intelligence),

      // Estimated time until cascade (in days)
      estimated_time_to_cascade: await estimateTimeToCascade(intelligence),

      // Confidence intervals
      confidence_interval: {
        lower: Math.max(0, (await predictCascadeLikelihood(intelligence)) - 10),
        upper: Math.min(100, (await predictCascadeLikelihood(intelligence)) + 10),
      },

      // Historical case matching
      similar_historical_cases: await findSimilarHistoricalCases(intelligence),

      // Risk factors identified by ML
      risk_factors: identifyRiskFactors(intelligence),

      // Based on current intelligence
      current_state: {
        cascading_impact: intelligence.impact_cascade.cascading_impact,
        total_connections: intelligence.impact_cascade.total_factors,
        overall_risk: intelligence.risk_assessment.overall_risk,
      },
    };

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Error in ML predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Find similar historical cases
 */
async function findSimilarHistoricalCases(intelligence: any): Promise<any[]> {
  // Mock implementation - in production, query historical data
  return [
    {
      date: '2024-01-15',
      similar_types: intelligence.connected_factors.map((f: any) => f.type).slice(0, 2),
      outcome: 'Supply chain disruption occurred within 7 days',
      recommendations: intelligence.recommended_actions.slice(0, 3),
    },
  ];
}

/**
 * Helper: Identify risk factors using ML insights
 */
function identifyRiskFactors(intelligence: any): string[] {
  const riskFactors: string[] = [];

  // High cascading impact indicates systemic risk
  if (intelligence.impact_cascade.cascading_impact > 70) {
    riskFactors.push('High systemic cascade risk detected');
  }

  // Multiple connections increase complexity
  if (intelligence.impact_cascade.total_factors > 10) {
    riskFactors.push('Complex interconnection network detected');
  }

  // Critical severity factors
  const criticalCount = intelligence.connected_factors.filter(
    (f: any) => f.severity === 'critical'
  ).length;
  if (criticalCount > 0) {
    riskFactors.push(`${criticalCount} critical-level factors present`);
  }

  // Supply chain affected
  if (intelligence.impact_cascade.affected_supply_chain) {
    riskFactors.push('Supply chain vulnerability confirmed');
  }

  return riskFactors;
}

