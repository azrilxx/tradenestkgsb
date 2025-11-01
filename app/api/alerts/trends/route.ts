import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/alerts/trends - Get historical alert trends
 * Returns daily counts for last 7, 30, or 90 days
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const groupBy = searchParams.get('groupBy') || 'severity'; // 'severity' or 'type'

    const supabase = await createClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch alerts with anomaly details
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        created_at,
        anomalies (
          severity,
          type
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch trends',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Group data by day
    const trendsByDay: Record<string, Record<string, number>> = {};

    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      trendsByDay[dateKey] = {};
    }

    // Count alerts by date and severity/type
    alerts?.forEach((alert: any) => {
      const alertDate = new Date(alert.created_at).toISOString().split('T')[0];
      if (!trendsByDay[alertDate]) {
        trendsByDay[alertDate] = {};
      }

      if (alert.anomalies) {
        const anomaly = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
        const key = groupBy === 'type' ? anomaly.type : anomaly.severity;

        if (key) {
          trendsByDay[alertDate][key] = (trendsByDay[alertDate][key] || 0) + 1;
        }
      }
    });

    // Convert to array format for charts
    const trends = Object.entries(trendsByDay)
      .map(([date, counts]) => ({
        date,
        ...counts,
        total: Object.values(counts).reduce((sum: number, val) => sum + (val || 0), 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        trends,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
        groupBy,
      },
    });
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get trends',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

