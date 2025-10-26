import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;

    // Fetch alert with full details
    const { data: alert, error } = await supabase
      .from('alerts')
      .select(`
        id,
        status,
        created_at,
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
      .eq('id', alertId)
      .single();

    if (error || !alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Format data for PDF generation
    const anomaly = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
    const evidenceData = {
      alert: {
        id: alert.id,
        status: alert.status,
        created_at: alert.created_at,
      },
      anomaly: {
        type: anomaly.type,
        severity: anomaly.severity,
        detected_at: anomaly.detected_at,
        details: anomaly.details,
      },
      product: anomaly.products || undefined,
    };

    return NextResponse.json({
      success: true,
      data: evidenceData,
    });
  } catch (error) {
    console.error('Evidence API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}