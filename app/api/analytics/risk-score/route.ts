import { NextRequest, NextResponse } from 'next/server';
import { calculateRiskScores, getRiskAnalysis, updateAlertRiskScores } from '@/lib/analytics/risk-scorer';

/**
 * GET /api/analytics/risk-score
 * Get risk scores for all alerts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'scores';

    if (type === 'analysis') {
      const analysis = await getRiskAnalysis();
      return NextResponse.json({ analysis });
    }

    // Get risk scores
    const riskScores = await calculateRiskScores();

    // Filter if needed
    const minScore = searchParams.get('minScore');
    const riskLevel = searchParams.get('riskLevel');
    const limit = searchParams.get('limit');

    let filteredScores = riskScores;

    if (minScore) {
      filteredScores = filteredScores.filter((s) => s.composite_risk_score >= parseInt(minScore));
    }

    if (riskLevel) {
      filteredScores = filteredScores.filter((s) => s.risk_level === riskLevel);
    }

    if (limit) {
      filteredScores = filteredScores.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      risk_scores: filteredScores,
      total: filteredScores.length,
      type: 'scores',
    });
  } catch (error) {
    console.error('Error in risk score API:', error);
    return NextResponse.json({ error: 'Failed to calculate risk scores' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/risk-score
 * Update risk scores in database
 */
export async function POST(request: NextRequest) {
  try {
    const updatedCount = await updateAlertRiskScores();

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      message: `Updated risk scores for ${updatedCount} alerts`,
    });
  } catch (error) {
    console.error('Error updating risk scores:', error);
    return NextResponse.json({ error: 'Failed to update risk scores' }, { status: 500 });
  }
}

