import { NextRequest, NextResponse } from 'next/server';
import { riskAnalyst } from '@/lib/ai';

/**
 * POST /api/ai/analyze-company
 *
 * AI-powered company risk analysis endpoint
 * Analyzes a company's profile and trade patterns for TBML risk
 */
export async function POST(request: NextRequest) {
  try {
    const company = await request.json();

    // Validate required fields
    if (!company.name || !company.country) {
      return NextResponse.json(
        { error: 'Missing required fields: name, country' },
        { status: 400 }
      );
    }

    // Generate AI analysis
    const analysis = await riskAnalyst.analyzeCompany({
      name: company.name,
      country: company.country,
      type: company.type || 'importer',
      sector: company.sector || 'General',
      recentShipments: company.recentShipments,
      products: company.products,
    });

    return NextResponse.json({
      success: true,
      analysis,
      company: {
        name: company.name,
        country: company.country,
        sector: company.sector,
      },
    });
  } catch (error) {
    console.error('AI analyze-company error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
