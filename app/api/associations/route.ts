import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getServerUser } from '@/lib/supabase/server';

const supabase = createClient();

/**
 * GET /api/associations - Get all associations user is member of
 */
export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's associations
    const { data: memberships, error: membershipError } = await supabase
      .from('association_members')
      .select('association_id, role, status, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch memberships' },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Get full association details
    const associationIds = memberships.map(m => m.association_id);
    const { data: associations, error: assocError } = await supabase
      .from('associations')
      .select('*')
      .in('id', associationIds);

    if (assocError) {
      console.error('Error fetching associations:', assocError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch associations' },
        { status: 500 }
      );
    }

    // Attach membership info to each association
    const associationsWithRole = associations?.map(assoc => {
      const membership = memberships.find(m => m.association_id === assoc.id);
      return {
        ...assoc,
        user_role: membership?.role || 'viewer',
        joined_at: membership?.joined_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: associationsWithRole,
      count: associationsWithRole?.length || 0,
    });
  } catch (error) {
    console.error('Associations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/associations - Create new association
 */
export async function POST(request: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, sector, description } = body;

    if (!name || !sector) {
      return NextResponse.json(
        { success: false, error: 'Name and sector are required' },
        { status: 400 }
      );
    }

    // Create association
    const { data: association, error: assocError } = await supabase
      .from('associations')
      .insert({
        name,
        sector,
        description,
        admin_user_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (assocError) {
      console.error('Error creating association:', assocError);
      return NextResponse.json(
        { success: false, error: 'Failed to create association' },
        { status: 500 }
      );
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('association_members')
      .insert({
        association_id: association.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
    }

    return NextResponse.json({
      success: true,
      data: association,
    });
  } catch (error) {
    console.error('Create association error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

