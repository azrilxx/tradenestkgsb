import { NextRequest, NextResponse } from 'next/server';
import { generateExpertInsights } from '@/lib/analytics/insights-generator';

/**
 * GET /api/analytics/insights/[alertId]
 * Get expert insights for a specific alert
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Generate expert insights
    const insights = await generateExpertInsights(alertId);

    if (!insights) {
      return NextResponse.json(
        { error: 'Could not generate insights for this alert' },
        { status: 404 }
      );
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in /api/analytics/insights/[alertId]:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
