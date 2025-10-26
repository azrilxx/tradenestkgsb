import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getServerUser } from '@/lib/supabase/server';

const supabase = createClient();

/**
 * GET /api/associations/[id]/alerts - Get group alerts
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: alerts, error } = await supabase
      .from('group_alerts')
      .select('*')
      .eq('association_id', params.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching group alerts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts?.length || 0,
    });
  } catch (error) {
    console.error('Group alerts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/associations/[id]/alerts - Create group alert
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has permission (admin only)
    const { data: membership } = await supabase
      .from('association_members')
      .select('role')
      .eq('association_id', params.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, alert_type, hs_codes, affected_products, priority } = body;

    if (!title || !message || !alert_type) {
      return NextResponse.json(
        { success: false, error: 'Title, message, and alert type are required' },
        { status: 400 }
      );
    }

    const { data: alert, error } = await supabase
      .from('group_alerts')
      .insert({
        association_id: params.id,
        title,
        message,
        alert_type,
        hs_codes: hs_codes || [],
        affected_products: affected_products || {},
        priority: priority || 'medium',
        created_by: user.id,
        broadcast_to_all: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group alert:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Create group alert error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

