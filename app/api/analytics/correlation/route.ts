import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { analyzeCorrelations, getSectorCorrelations, generateCorrelationMatrix } from '@/lib/analytics/correlation-analyzer';

/**
 * GET /api/analytics/correlation
 * Get correlation analysis data
 */
const Query = z.object({
  category: z.string().optional(),
  timeWindow: z.coerce.number().int().min(7).max(365).default(90),
  type: z.enum(['all', 'sector', 'matrix']).default('all'),
  productIds: z.string().optional(),
});

export const GET = withApiMiddleware(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = Query.parse({
      category: searchParams.get('category') || undefined,
      timeWindow: searchParams.get('timeWindow') || undefined,
      type: (searchParams.get('type') as any) || undefined,
      productIds: searchParams.get('productIds') || undefined,
    });

    // Get specific analysis type
    if (parsed.type === 'sector') {
      const sectors = await getSectorCorrelations(parsed.timeWindow);
      return NextResponse.json({ sectors, type: 'sector' });
    }

    if (parsed.type === 'matrix') {
      const productIds = parsed.productIds?.split(',');
      if (!productIds || productIds.length < 2) {
        return NextResponse.json({ error: 'At least 2 product IDs required' }, { status: 400 });
      }

      const matrix = await generateCorrelationMatrix(productIds, parsed.timeWindow);
      return NextResponse.json({ matrix, type: 'matrix' });
    }

    // Default: get all correlations
    const correlations = await analyzeCorrelations(parsed.category || undefined, parsed.timeWindow);

    return NextResponse.json({
      correlations,
      count: correlations.length,
      category: parsed.category || 'all',
      timeWindow: parsed.timeWindow,
    });
  } catch (error) {
    console.error('Error in correlation API:', error);
    return NextResponse.json({ error: 'Failed to analyze correlations' }, { status: 500 });
  }
}, { rateLimit: { windowMs: 60_000, max: 120 }, requireOrgId: true });

