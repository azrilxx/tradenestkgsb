import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import {
  getUserSubscription,
  trackUsage,
  checkUsageLimit,
  getMaxTimeWindow,
  getPromotionMessage,
} from '@/lib/subscription/tier-checker';

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

    // Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user subscription
    const subscription = await getUserSubscription(user.id);

    // Check usage limit
    const usageData = await checkUsageLimit(user.id);

    if (!usageData.can_use) {
      const promotion = getPromotionMessage(true, subscription?.tier || 'free');
      return NextResponse.json(
        {
          error: 'Monthly limit reached',
          message: promotion.message,
          cta: promotion.cta,
          upgrade_tier: promotion.upgradeTo,
          limit_reached: true,
        },
        { status: 403 }
      );
    }

    // Get time window parameter (default: 30 days)
    const { searchParams } = new URL(request.url);
    const timeWindowParam = searchParams.get('window');
    const requestedTimeWindow = parseInt(timeWindowParam || '30');

    // Enforce time window limit based on tier
    const maxTimeWindow = getMaxTimeWindow(subscription?.tier || 'free');
    const timeWindow = Math.min(requestedTimeWindow, maxTimeWindow);

    // Analyze interconnected intelligence
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Could not analyze interconnected intelligence' },
        { status: 404 }
      );
    }

    // Track usage
    await trackUsage(user.id, alertId, 'connection', timeWindow, {
      tier: subscription?.tier,
      actual_window: timeWindow,
      requested_window: requestedTimeWindow,
      was_capped: requestedTimeWindow > maxTimeWindow,
    });

    // Return limited data for free tier
    if (subscription?.tier === 'free') {
      return NextResponse.json({
        ...intelligence,
        connected_factors: intelligence.connected_factors.slice(0, 5), // Limit to 5 for free tier
        tier_limit: true,
        upgrade_message: 'Upgrade to Professional to see all connections and extended time windows',
      });
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
