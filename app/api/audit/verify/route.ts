/**
 * API Route: Verify Evidence Integrity
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
    const fileHash = searchParams.get('file_hash');

    if (!evidenceId || !evidenceType || !fileHash) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call database function to verify
    const { data, error } = await supabase.rpc('verify_evidence_integrity', {
      p_evidence_id: evidenceId,
      p_evidence_type: evidenceType,
      p_file_hash: fileHash,
    });

    if (error) {
      console.error('Error verifying evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      is_valid: data,
      evidence_id: evidenceId,
      evidence_type: evidenceType,
      message: data
        ? 'Evidence integrity verified'
        : 'Evidence has been tampered with',
    });

  } catch (error) {
    console.error('Error in verify route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





