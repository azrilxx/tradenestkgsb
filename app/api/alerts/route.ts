import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getServerUser } from '@/lib/supabase/server';

/**
 * GET /api/alerts - Get all alerts with details
 */
export async function GET(request: Request) {
  try {
    // Get authenticated user (optional for demo mode)
    const user = await getServerUser();

    // For demo mode, allow access without authentication
    // In production, uncomment the following lines:
    // if (!user) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Unauthorized',
    //     data: [],
    //     count: 0,
    //   }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const severity = searchParams.get('severity'); // Filter by severity
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('alerts')
      .select(`
        id,
        status,
        created_at,
        resolved_at,
        anomalies (
          id,
          type,
          severity,
          detected_at,
          details,
          products (
            id,
            hs_code,
            description,
            category
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    // Filter by severity if requested (post-query filter since it's in related table)
    let filteredData = data;
    if (severity && data) {
      filteredData = data.filter((alert: any) => {
        const anomaly = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
        return anomaly?.severity === severity;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      count: filteredData?.length || 0,
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts - Update alert status
 */
export async function PATCH(request: Request) {
  try {
    // Get authenticated user (optional for demo mode)
    const user = await getServerUser();

    // For demo mode, allow access without authentication
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing alertId or status' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', alertId);

    if (error) {
      console.error('Error updating alert:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert status updated',
    });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}