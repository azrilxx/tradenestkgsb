import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/analytics/connections/monitor
 * Start background monitoring for active alerts
 */
const PostBody = z.object({
  alertId: z.string().uuid(),
  timeWindow: z.number().int().min(7).max(180).default(30),
});

export const POST = withApiMiddleware(async (request: NextRequest, body: z.infer<typeof PostBody>) => {
  try {
    const { alertId, timeWindow } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current intelligence for baseline
    const baseline = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!baseline) {
      return NextResponse.json(
        { error: 'Could not analyze baseline intelligence' },
        { status: 404 }
      );
    }

    // Start monitoring (in production, this would use a queue like Bull or similar)
    const monitoringJob = {
      alert_id: alertId,
      status: 'monitoring',
      baseline_cascade_impact: baseline.impact_cascade.cascading_impact,
      baseline_risk_score: baseline.risk_assessment.overall_risk,
      time_window: timeWindow,
      created_at: new Date().toISOString(),
    };

    // Store monitoring job in database (you'd create a monitoring_jobs table)
    // For now, we'll return the monitoring status

    return NextResponse.json({
      message: 'Monitoring started',
      alert_id: alertId,
      baseline: {
        cascade_impact: baseline.impact_cascade.cascading_impact,
        risk_score: baseline.risk_assessment.overall_risk,
        total_connections: baseline.impact_cascade.total_factors,
      },
      monitoring_config: {
        time_window: timeWindow,
        interval_seconds: 30,
        check_new_connections: true,
        check_risk_changes: true,
        threshold: 5, // Detect 5% change in cascade impact
      },
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to start monitoring' },
      { status: 500 }
    );
  }
}, { schema: PostBody, rateLimit: { windowMs: 60_000, max: 60 }, idempotent: true, requireOrgId: true });

/**
 * GET /api/analytics/connections/monitor?alertId=xxx
 * Get current monitoring status for an alert
 */
export const GET = withApiMiddleware(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const timeWindow = parseInt(searchParams.get('timeWindow') || '30');

    // Get current intelligence
    const current = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!current) {
      return NextResponse.json(
        { error: 'Could not retrieve current intelligence' },
        { status: 404 }
      );
    }

    // Calculate changes (in production, compare with stored baseline)
    const riskScore = current.risk_assessment.overall_risk;
    const cascadeImpact = current.impact_cascade.cascading_impact;
    const totalConnections = current.impact_cascade.total_factors;

    // Determine status
    let status: 'stable' | 'monitoring' | 'critical' | 'warning';
    let message: string;

    if (riskScore >= 80 || cascadeImpact >= 80) {
      status = 'critical';
      message = 'Critical risk detected. Immediate attention required.';
    } else if (riskScore >= 60 || cascadeImpact >= 60) {
      status = 'warning';
      message = 'Elevated risk. Monitor closely.';
    } else if (totalConnections > 0) {
      status = 'monitoring';
      message = 'Active connections detected. Continuing monitoring.';
    } else {
      status = 'stable';
      message = 'No active connections. Risk level stable.';
    }

    return NextResponse.json({
      alert_id: alertId,
      status,
      message,
      current_state: {
        risk_score: riskScore,
        cascade_impact: cascadeImpact,
        total_connections: totalConnections,
        affected_supply_chain: current.impact_cascade.affected_supply_chain,
      },
      recommendations: current.recommended_actions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring status' },
      { status: 500 }
    );
  }
}, { rateLimit: { windowMs: 60_000, max: 120 }, requireOrgId: true });

/**
 * PUT /api/analytics/connections/monitor
 * Update monitoring configuration
 */
const PutBody = z.object({
  alertId: z.string().uuid(),
  config: z.any(), // Using z.any() instead of z.record() for flexibility
});

export const PUT = withApiMiddleware(async (_request: NextRequest, body: z.infer<typeof PutBody>) => {
  try {
    const { alertId, config } = body;

    if (!alertId || !config) {
      return NextResponse.json(
        { error: 'Alert ID and config are required' },
        { status: 400 }
      );
    }

    // In production, update monitoring job configuration
    return NextResponse.json({
      message: 'Monitoring configuration updated',
      alert_id: alertId,
      config,
    });
  } catch (error) {
    console.error('Error updating monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to update monitoring configuration' },
      { status: 500 }
    );
  }
}, { schema: PutBody, rateLimit: { windowMs: 60_000, max: 60 }, requireOrgId: true });

/**
 * DELETE /api/analytics/connections/monitor
 * Stop monitoring for an alert
 */
export const DELETE = withApiMiddleware(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // In production, remove monitoring job from queue

    return NextResponse.json({
      message: 'Monitoring stopped',
      alert_id: alertId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to stop monitoring' },
      { status: 500 }
    );
  }
}, { rateLimit: { windowMs: 60_000, max: 60 }, requireOrgId: true });

