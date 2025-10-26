import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/analytics/connections/[alertId]
 * Get interconnected intelligence analysis for a specific alert
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

    // Get time window parameter (default: 30 days)
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('window') || '30');

    // Analyze interconnected intelligence
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Could not analyze interconnected intelligence' },
        { status: 404 }
      );
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Error in /api/analytics/connections/[alertId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interconnected intelligence' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/connections
 * Analyze connections for multiple alerts at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds, timeWindow } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'alertIds array is required' },
        { status: 400 }
      );
    }

    const window = timeWindow || 30;
    const results = await Promise.all(
      alertIds.map((id: string) => analyzeInterconnectedIntelligence(id, window))
    );

    return NextResponse.json({ results: results.filter((r) => r !== null) });
  } catch (error) {
    console.error('Error in POST /api/analytics/connections:', error);
    return NextResponse.json(
      { error: 'Failed to analyze connections' },
      { status: 500 }
    );
  }
}
