import { NextRequest, NextResponse } from 'next/server';
import {
  getBenchmarkData,
  getPriceTrendData,
  getTopProductsByVolume,
  BenchmarkFilters
} from '@/lib/analytics/benchmarks';

/**
 * GET /api/benchmark
 * Get benchmark data for market intelligence
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const hsCode = searchParams.get('hs_code');
    const country = searchParams.get('country');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const trendMonths = parseInt(searchParams.get('trend_months') || '6');
    const topProductsLimit = parseInt(searchParams.get('top_products_limit') || '10');

    // Build filters
    const filters: BenchmarkFilters = {};
    if (hsCode) filters.hs_code = hsCode;
    if (country) filters.country = country;
    if (startDate && endDate) {
      filters.date_range = { start: startDate, end: endDate };
    }

    // Get benchmark data
    const benchmarkData = await getBenchmarkData(filters);

    if (!benchmarkData) {
      return NextResponse.json(
        { error: 'No benchmark data found for the specified criteria' },
        { status: 404 }
      );
    }

    // Get additional data if HS code is specified
    let priceTrendData = [];
    if (hsCode) {
      priceTrendData = await getPriceTrendData(hsCode, trendMonths);
    }

    // Get top products for context
    const topProducts = await getTopProductsByVolume(topProductsLimit);

    return NextResponse.json({
      success: true,
      data: {
        benchmark: benchmarkData,
        price_trend: priceTrendData,
        top_products: topProducts,
        filters_applied: filters,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in benchmark API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/benchmark
 * Compare user's price against market benchmark
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_price, hs_code, country, date_range } = body;

    if (!user_price || !hs_code) {
      return NextResponse.json(
        { error: 'user_price and hs_code are required' },
        { status: 400 }
      );
    }

    // Build filters
    const filters: BenchmarkFilters = {
      hs_code,
      country,
      date_range
    };

    // Get benchmark data
    const benchmarkData = await getBenchmarkData(filters);

    if (!benchmarkData) {
      return NextResponse.json(
        { error: 'No benchmark data found for the specified criteria' },
        { status: 404 }
      );
    }

    // Compare user price against benchmark
    const comparison = {
      user_price,
      market_avg: benchmarkData.avg_price,
      median_price: benchmarkData.median_price,
      price_range: benchmarkData.price_range,
      percentile_rank: calculatePercentileRank(user_price, [
        benchmarkData.price_range.min,
        benchmarkData.price_range.max,
        ...benchmarkData.price_percentiles.map(p => p.value)
      ]),
      deviation_percentage: ((user_price - benchmarkData.avg_price) / benchmarkData.avg_price) * 100,
      is_outlier: Math.abs(((user_price - benchmarkData.avg_price) / benchmarkData.avg_price) * 100) > 20,
      recommendation: generateRecommendation(user_price, benchmarkData),
      benchmark_context: {
        sample_size: benchmarkData.sample_size,
        price_volatility: benchmarkData.price_volatility,
        top_exporters: benchmarkData.top_exporters.slice(0, 3)
      }
    };

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error in benchmark comparison API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate percentile rank of a value in a dataset
 */
function calculatePercentileRank(value: number, sortedData: number[]): number {
  const count = sortedData.filter(x => x <= value).length;
  return (count / sortedData.length) * 100;
}

/**
 * Generate recommendation based on price comparison
 */
function generateRecommendation(userPrice: number, benchmarkData: any): string {
  const deviationPercentage = ((userPrice - benchmarkData.avg_price) / benchmarkData.avg_price) * 100;

  if (deviationPercentage > 30) {
    return 'Price significantly above market average. Strongly consider negotiating or finding alternative suppliers.';
  } else if (deviationPercentage > 20) {
    return 'Price above market average. Consider negotiating for better terms or exploring alternative suppliers.';
  } else if (deviationPercentage > 10) {
    return 'Price slightly above market average. Monitor for potential cost savings opportunities.';
  } else if (deviationPercentage < -30) {
    return 'Price significantly below market average. Verify product quality, authenticity, and compliance.';
  } else if (deviationPercentage < -20) {
    return 'Price below market average. Ensure quality standards are met and verify supplier credentials.';
  } else if (deviationPercentage < -10) {
    return 'Price below market average. Good value, but ensure quality standards are maintained.';
  } else {
    return 'Price is within normal market range. Continue monitoring for market changes.';
  }
}
