/**
 * API Route: Get Chain of Custody
 * Stage 7: Audit Trails & Legal Defensibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Call database function to get chain of custody
    const { data, error } = await supabase.rpc('get_evidence_chain_of_custody', {
      p_evidence_id: evidenceId,
      p_evidence_type: evidenceType,
    });

    if (error) {
      console.error('Error getting chain of custody:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      evidence_id: evidenceId,
      evidence_type: evidenceType,
      chain_of_custody: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Error in chain-of-custody route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







