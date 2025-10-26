import { NextRequest, NextResponse } from 'next/server';
import { riskAnalyst } from '@/lib/ai';

/**
 * POST /api/ai/explain-alert
 *
 * AI-powered alert explanation endpoint
 * Takes an alert and returns a plain-language explanation with investigation steps
 */
export async function POST(request: NextRequest) {
  try {
    const alert = await request.json();

    // Validate required fields
    if (!alert.type || !alert.companyName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, companyName' },
        { status: 400 }
      );
    }

    // Generate AI explanation
    const explanation = await riskAnalyst.explainAlert({
      id: alert.id || 'unknown',
      type: alert.type,
      severity: alert.severity || 'medium',
      companyName: alert.companyName,
      description: alert.description || '',
      shipmentDetails: alert.shipmentDetails,
    });

    return NextResponse.json({
      success: true,
      explanation,
      alert: {
        id: alert.id,
        type: alert.type,
        companyName: alert.companyName,
      },
    });
  } catch (error) {
    console.error('AI explain-alert error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate explanation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
