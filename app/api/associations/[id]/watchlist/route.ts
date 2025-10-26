import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getServerUser } from '@/lib/supabase/server';

const supabase = createClient();

/**
 * GET /api/associations/[id]/watchlist - Get association watchlists
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

    const { data: watchlists, error } = await supabase
      .from('shared_watchlists')
      .select('*')
      .eq('association_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlists:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch watchlists' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: watchlists,
      count: watchlists?.length || 0,
    });
  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/associations/[id]/watchlist - Create shared watchlist
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

    // Verify user has permission (admin or member)
    const { data: membership } = await supabase
      .from('association_members')
      .select('role')
      .eq('association_id', params.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'member')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { watchlist_name, hs_codes, alert_types, description } = body;

    if (!watchlist_name || !hs_codes || hs_codes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Watchlist name and HS codes are required' },
        { status: 400 }
      );
    }

    const { data: watchlist, error } = await supabase
      .from('shared_watchlists')
      .insert({
        association_id: params.id,
        watchlist_name,
        hs_codes,
        alert_types: alert_types || [],
        description,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating watchlist:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    console.error('Create watchlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

