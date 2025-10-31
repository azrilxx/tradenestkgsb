/**
 * API Route: Audit Logs
 * Stage 7: Audit Trails & Legal Defensibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      action_type,
      entity_type,
      entity_id,
      user_id,
      changes,
      metadata,
    } = body;

    if (!action_type) {
      return NextResponse.json(
        { error: 'Missing required field: action_type' },
        { status: 400 }
      );
    }

    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action_type,
        entity_type,
        entity_id,
        user_id,
        changes,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      log_hash: data.log_hash,
      message: 'Audit log created successfully'
    });

  } catch (error) {
    console.error('Error in audit logs route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const entityId = searchParams.get('entity_id');
    const entityType = searchParams.get('entity_type');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (entityId && entityType) {
      query = query
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Error in audit logs GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


