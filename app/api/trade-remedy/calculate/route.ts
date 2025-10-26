import { NextResponse } from 'next/server';
import {
  calculateDumpingMargin,
  calculateDumpingAmount,
  calculatePriceDepression,
  getDumpingSeverity,
  generateCausationSummary,
  getRecommendedMeasures,
  type DumpingCalculationInput,
  type DumpingCalculationResult,
} from '@/lib/trade-remedy/dumping-calculator';

// POST /api/trade-remedy/calculate - Calculate dumping margin and generate analysis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      exportPrice,
      normalValue,
      importVolumeCurrent,
      importVolumePrevious,
      domesticMarketShare,
      currency = 'USD',
    } = body;

    if (!exportPrice || !normalValue) {
      return NextResponse.json(
        { error: 'Export price and normal value are required' },
        { status: 400 }
      );
    }

    // Calculate dumping metrics
    const dumpingAmount = calculateDumpingAmount(exportPrice, normalValue);
    const dumpingMargin = calculateDumpingMargin(exportPrice, normalValue);
    const priceDepression = calculatePriceDepression(exportPrice, normalValue);
    const isDumping = dumpingMargin > 0;

    // Calculate volume impact if provided
    const volumeImpact =
      importVolumeCurrent && importVolumePrevious
        ? ((importVolumeCurrent - importVolumePrevious) / importVolumePrevious) * 100
        : null;

    // Calculate estimated injury
    const estimatedInjury =
      importVolumeCurrent && domesticMarketShare
        ? dumpingAmount * importVolumeCurrent * (domesticMarketShare / 100)
        : null;

    // Get severity assessment
    const severity = getDumpingSeverity(dumpingMargin);

    // Generate causation summary
    const causationSummary =
      importVolumeCurrent && importVolumePrevious && domesticMarketShare
        ? generateCausationSummary(
          dumpingMargin,
          volumeImpact || 0,
          priceDepression,
          domesticMarketShare
        )
        : 'Causation analysis requires complete data (volume, price depression, market share).';

    // Get recommended measures
    const recommendedMeasures = getRecommendedMeasures(dumpingMargin);

    const result = {
      dumping: {
        amount: dumpingAmount,
        margin: dumpingMargin,
        isDumping,
        currency,
      },
      price: {
        exportPrice,
        normalValue,
        depression: priceDepression,
      },
      volume: {
        current: importVolumeCurrent,
        previous: importVolumePrevious,
        impact: volumeImpact,
      },
      injury: {
        estimatedRevenueLoss: estimatedInjury,
        marketShareLoss: domesticMarketShare,
      },
      severity,
      causation: causationSummary,
      recommendedMeasures,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dumping', details: error.message },
      { status: 500 }
    );
  }
}

