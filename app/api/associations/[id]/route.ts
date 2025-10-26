import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getServerUser } from '@/lib/supabase/server';

const supabase = createClient();

/**
 * GET /api/associations/[id] - Get association details
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

    const { data: association, error } = await supabase
      .from('associations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching association:', error);
      return NextResponse.json(
        { success: false, error: 'Association not found' },
        { status: 404 }
      );
    }

    // Get user's membership
    const { data: membership } = await supabase
      .from('association_members')
      .select('*')
      .eq('association_id', params.id)
      .eq('user_id', user.id)
      .single();

    // Get watchlist count
    const { count: watchlistCount } = await supabase
      .from('shared_watchlists')
      .select('*', { count: 'exact', head: true })
      .eq('association_id', params.id);

    // Get recent alerts count
    const { count: alertCount } = await supabase
      .from('group_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('association_id', params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...association,
        user_role: membership?.role || null,
        user_status: membership?.status || null,
        watchlist_count: watchlistCount || 0,
        alert_count: alertCount || 0,
      },
    });
  } catch (error) {
    console.error('Association details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

