import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserSubscription } from '@/lib/subscription/tier-checker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/analytics/connections/subscribe
 * Create a webhook subscription for real-time connection updates
 * Enterprise tier only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds, webhookUrl, filters, timeWindow = 30 } = body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds array is required' },
        { status: 400 }
      );
    }

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
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

    // Check subscription tier (webhooks only for Enterprise)
    const subscription = await getUserSubscription(user.id);

    if (subscription?.tier !== 'enterprise') {
      return NextResponse.json(
        {
          error: 'Webhook subscriptions require Enterprise tier',
          requiredTier: 'enterprise',
          currentTier: subscription?.tier || 'free',
        },
        { status: 403 }
      );
    }

    // Validate webhook URL
    try {
      new URL(webhookUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      );
    }

    // Create subscription in database
    const { data: subscriptionData, error: subError } = await supabase
      .from('intelligence_webhook_subscriptions')
      .insert({
        user_id: user.id,
        webhook_url: webhookUrl,
        alert_ids: alertIds,
        filters: filters || {},
        time_window: timeWindow,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating webhook subscription:', subError);
      return NextResponse.json(
        { error: 'Failed to create webhook subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription_id: subscriptionData.id,
      webhook_url: webhookUrl,
      alert_ids: alertIds,
      status: 'active',
      message: 'Webhook subscription created successfully',
      webhook_format: {
        type: 'connection_update',
        alert_id: 'string',
        timestamp: 'ISO 8601',
        update_type: 'new_connection | cascade_update | risk_change',
        data: 'varies',
      },
    });
  } catch (error) {
    console.error('Error creating webhook subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/connections/subscribe
 * List webhook subscriptions for current user
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('intelligence_webhook_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
      total_count: (subscriptions || []).length,
    });
  } catch (error) {
    console.error('Error getting webhook subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/connections/subscribe?subscriptionId=xxx
 * Delete a webhook subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
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

    // Delete subscription (only if owned by user)
    const { error } = await supabase
      .from('intelligence_webhook_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription deleted',
      subscription_id: subscriptionId,
    });
  } catch (error) {
    console.error('Error deleting webhook subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook subscription' },
      { status: 500 }
    );
  }
}

