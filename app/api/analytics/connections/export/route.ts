import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import {
  getUserSubscription,
  checkUsageLimit,
} from '@/lib/subscription/tier-checker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/analytics/connections/export?alertId=xxx&format=csv|json
 * Export interconnected intelligence data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');
    const format = searchParams.get('format') || 'json'; // csv or json

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

    // Get time window
    const timeWindowParam = searchParams.get('window');
    const requestedTimeWindow = parseInt(timeWindowParam || '30');
    const subscription = await getUserSubscription(user.id);
    const maxTimeWindow = subscription?.usage_limits?.max_time_window_days || 30;
    const timeWindow = Math.min(requestedTimeWindow, maxTimeWindow);

    // Analyze intelligence
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Could not analyze interconnected intelligence' },
        { status: 404 }
      );
    }

    // Export based on format
    if (format === 'csv') {
      return exportAsCSV(intelligence, alertId);
    } else {
      return exportAsJSON(intelligence, alertId);
    }
  } catch (error) {
    console.error('Error in export:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Export data as CSV
 */
function exportAsCSV(intelligence: any, alertId: string): NextResponse {
  const csvLines: string[] = [];

  // Header
  csvLines.push('Interconnected Intelligence Export');
  csvLines.push(`Alert ID: ${alertId}`);
  csvLines.push(`Generated: ${new Date().toISOString()}`);
  csvLines.push('');

  // Primary Alert
  csvLines.push('PRIMARY ALERT');
  csvLines.push('Type,Severity,Timestamp');
  csvLines.push(
    `${intelligence.primary_alert.type},${intelligence.primary_alert.severity},${intelligence.primary_alert.timestamp}`
  );
  csvLines.push('');

  // Connected Factors
  csvLines.push('CONNECTED FACTORS');
  csvLines.push('ID,Type,Severity,Correlation Score,Timestamp');
  intelligence.connected_factors.forEach((factor: any) => {
    csvLines.push(
      `${factor.id},${factor.type},${factor.severity},${factor.correlation_score || 'N/A'},${factor.timestamp}`
    );
  });
  csvLines.push('');

  // Impact Cascade
  csvLines.push('IMPACT CASCADE');
  csvLines.push('Metric,Value');
  csvLines.push(`Cascading Impact,${intelligence.impact_cascade.cascading_impact}%`);
  csvLines.push(`Total Factors,${intelligence.impact_cascade.total_factors}`);
  csvLines.push(`Supply Chain Affected,${intelligence.impact_cascade.affected_supply_chain ? 'Yes' : 'No'}`);
  csvLines.push('');

  // Risk Assessment
  csvLines.push('RISK ASSESSMENT');
  csvLines.push('Overall Risk,Priority');
  csvLines.push(
    `${intelligence.risk_assessment.overall_risk},${intelligence.risk_assessment.mitigation_priority}`
  );
  csvLines.push('');

  // Risk Factors
  csvLines.push('Risk Factors');
  intelligence.risk_assessment.risk_factors.forEach((factor: string) => {
    csvLines.push(factor);
  });
  csvLines.push('');

  // Recommendations
  csvLines.push('RECOMMENDED ACTIONS');
  intelligence.recommended_actions.forEach((action: string, idx: number) => {
    csvLines.push(`${idx + 1}. ${action}`);
  });

  const csvContent = csvLines.join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="intelligence-export-${alertId}.csv"`,
    },
  });
}

/**
 * Export data as JSON
 */
function exportAsJSON(intelligence: any, alertId: string): NextResponse {
  const exportData = {
    alert_id: alertId,
    exported_at: new Date().toISOString(),
    version: '1.0',
    data: intelligence,
  };

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="intelligence-export-${alertId}.json"`,
    },
  });
}

