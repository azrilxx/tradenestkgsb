import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import {
  getUserSubscription,
  checkUsageLimit,
  trackUsage,
} from '@/lib/subscription/tier-checker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/analytics/connections/batch
 * Analyze multiple alerts at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds, timeWindow = 30 } = body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds array is required' },
        { status: 400 }
      );
    }

    if (alertIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 alerts can be analyzed at once' },
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

    // Check subscription and usage
    const subscription = await getUserSubscription(user.id);
    const usageData = await checkUsageLimit(user.id);

    // Check if user has access to batch analysis
    const canAccessBatch = subscription?.tier === 'enterprise' || subscription?.tier === 'professional';
    if (!canAccessBatch) {
      return NextResponse.json(
        {
          error: 'Batch analysis requires Professional or Enterprise tier',
          requiredTier: 'professional',
          currentTier: subscription?.tier || 'free',
        },
        { status: 403 }
      );
    }

    // Check usage limit (only for free tier - but we already checked they're not free)
    if (!usageData.can_use) {
      return NextResponse.json(
        { error: 'Monthly limit reached. Upgrade to continue.' },
        { status: 403 }
      );
    }

    // Enforce time window limit
    const maxTimeWindow = subscription?.usage_limits?.max_time_window_days || 30;
    const actualTimeWindow = Math.min(timeWindow, maxTimeWindow);

    // Process alerts in batches (to avoid overwhelming the system)
    const results: any[] = [];
    const errors: any[] = [];

    // Process 10 alerts at a time
    for (let i = 0; i < alertIds.length; i += 10) {
      const batch = alertIds.slice(i, i + 10);

      const batchResults = await Promise.allSettled(
        batch.map(alertId => analyzeInterconnectedIntelligence(alertId, actualTimeWindow))
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push({
            alertId: batch[idx],
            intelligence: result.value,
          });
        } else {
          errors.push({
            alertId: batch[idx],
            error: 'Failed to analyze',
          });
        }
      });
    }

    // Track usage for each successful analysis
    for (const result of results) {
      await trackUsage(user.id, result.alertId, 'connection', actualTimeWindow, {
        tier: subscription?.tier,
        batch_analysis: true,
      });
    }

    // Refresh usage data
    const updatedUsage = await checkUsageLimit(user.id);

    return NextResponse.json({
      success: true,
      total_alerts: alertIds.length,
      successful: results.length,
      failed: errors.length,
      results: results.map(r => ({
        alertId: r.alertId,
        cascading_impact: r.intelligence.impact_cascade.cascading_impact,
        total_factors: r.intelligence.impact_cascade.total_factors,
        overall_risk: r.intelligence.risk_assessment.overall_risk,
      })),
      errors: errors.length > 0 ? errors : undefined,
      usage: updatedUsage,
      processing_time_ms: Date.now(), // Could track actual time
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process batch analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/connections/batch?alertIds=id1,id2,id3
 * Get summary of multiple alerts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertIdsParam = searchParams.get('alertIds');

    if (!alertIdsParam) {
      return NextResponse.json(
        { error: 'alertIds query parameter is required (comma-separated)' },
        { status: 400 }
      );
    }

    const alertIds = alertIdsParam.split(',').filter(id => id.trim().length > 0);

    if (alertIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid alert IDs provided' },
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

    // Return summary without full analysis (read-only)
    const summaries = await Promise.all(
      alertIds.map(async (alertId) => {
        const intelligence = await analyzeInterconnectedIntelligence(alertId, 30);
        return {
          alertId,
          cascading_impact: intelligence?.impact_cascade.cascading_impact || 0,
          total_factors: intelligence?.impact_cascade.total_factors || 0,
          overall_risk: intelligence?.risk_assessment.overall_risk || 0,
          has_intelligence: !!intelligence,
        };
      })
    );

    return NextResponse.json({
      summaries,
      total_count: summaries.length,
    });
  } catch (error) {
    console.error('Error getting batch summary:', error);
    return NextResponse.json(
      { error: 'Failed to get batch summary' },
      { status: 500 }
    );
  }
}

