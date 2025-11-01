/**
 * API Route: Store Evidence Hash
 * Stage 7: Audit Trails & Legal Defensibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      evidence_id,
      evidence_type,
      file_name,
      file_size,
      file_url,
      sha256_hash,
      generated_by,
      generation_metadata,
    } = body;

    // Insert evidence hash
    const { data, error } = await supabase
      .from('evidence_hashes')
      .insert({
        evidence_id,
        evidence_type,
        file_name,
        file_size,
        file_url,
        sha256_hash,
        generated_by,
        generation_metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing evidence hash:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also create audit log for this action
    await supabase.from('audit_logs').insert({
      action_type: 'report_generated',
      entity_type: evidence_type,
      entity_id: evidence_id,
      changes: {
        file_name,
        sha256_hash,
      },
      metadata: {
        generated_by,
      },
    });

    return NextResponse.json({
      id: data.id,
      sha256_hash: data.sha256_hash,
      message: 'Evidence hash stored successfully'
    });

  } catch (error) {
    console.error('Error in evidence-hash route:', error);
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

    const evidenceId = searchParams.get('evidence_id');
    const evidenceType = searchParams.get('evidence_type');

    if (!evidenceId || !evidenceType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get evidence hash
    const { data, error } = await supabase
      .from('evidence_hashes')
      .select('*')
      .eq('evidence_id', evidenceId)
      .eq('evidence_type', evidenceType)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching evidence hash:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Evidence hash not found' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in evidence-hash GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








