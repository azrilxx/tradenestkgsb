import { NextRequest, NextResponse } from 'next/server';
import { analyzeCorrelations, getSectorCorrelations, generateCorrelationMatrix } from '@/lib/analytics/correlation-analyzer';

/**
 * GET /api/analytics/correlation
 * Get correlation analysis data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const timeWindow = searchParams.get('timeWindow') ? parseInt(searchParams.get('timeWindow')!) : 90;
    const type = searchParams.get('type') || 'all';

    // Get specific analysis type
    if (type === 'sector') {
      const sectors = await getSectorCorrelations(timeWindow);
      return NextResponse.json({ sectors, type: 'sector' });
    }

    if (type === 'matrix') {
      const productIds = searchParams.get('productIds')?.split(',');
      if (!productIds || productIds.length < 2) {
        return NextResponse.json({ error: 'At least 2 product IDs required' }, { status: 400 });
      }

      const matrix = await generateCorrelationMatrix(productIds, timeWindow);
      return NextResponse.json({ matrix, type: 'matrix' });
    }

    // Default: get all correlations
    const correlations = await analyzeCorrelations(category || undefined, timeWindow);

    return NextResponse.json({
      correlations,
      count: correlations.length,
      category: category || 'all',
      timeWindow,
    });
  } catch (error) {
    console.error('Error in correlation API:', error);
    return NextResponse.json({ error: 'Failed to analyze correlations' }, { status: 500 });
  }
}

