import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * Evidence Export API
 * Accepts filtered shipment data and returns structured data for PDF generation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters } = body;

    // Extract filters
    const hsCode = filters?.hs_code;
    const company = filters?.company;
    const country = filters?.country;
    const port = filters?.port;
    const startDate = filters?.start_date;
    const endDate = filters?.end_date;

    // Build query for shipments
    let query = supabase.from('shipment_details').select('*');

    // Apply filters
    if (hsCode) query = query.ilike('hs_code', `${hsCode}%`);
    if (company) query = query.ilike('company_name', `%${company}%`);
    if (country) query = query.or(`origin_country.eq.${country},destination_country.eq.${country}`);
    if (port) query = query.or(`origin_port_name.ilike.%${port}%,destination_port_name.ilike.%${port}%`);
    if (startDate) query = query.gte('shipment_date', startDate);
    if (endDate) query = query.lte('shipment_date', endDate);

    // Order by date descending
    query = query.order('shipment_date', { ascending: false });

    const { data: shipments, error } = await query;

    if (error) {
      console.error('Evidence export query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shipment data', details: error.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = calculateStats(shipments || []);

    // Calculate market benchmarks
    const benchmarks = await calculateBenchmarks(shipments || [], hsCode);

    // Identify anomalies
    const anomalies = identifyAnomalies(shipments || [], stats);

    return NextResponse.json({
      success: true,
      data: {
        shipments: shipments || [],
        statistics: stats,
        benchmarks,
        anomalies,
        filters: {
          hs_code: hsCode,
          company,
          country,
          port,
          start_date: startDate,
          end_date: endDate,
        },
      },
    });
  } catch (error) {
    console.error('Evidence export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * Calculate statistics from shipment data
 */
function calculateStats(shipments: any[]) {
  if (!shipments || shipments.length === 0) {
    return {
      totalShipments: 0,
      totalValue: 0,
      averagePrice: 0,
      totalWeight: 0,
      dateRange: { start: null, end: null },
    };
  }

  const totalShipments = shipments.length;
  const totalValue = shipments.reduce((sum, s) => sum + (s.total_value || 0), 0);
  const totalWeight = shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0);
  const averagePrice = shipments.reduce((sum, s) => sum + (s.unit_price || 0), 0) / totalShipments;

  // Calculate date range
  const dates = shipments.map(s => s.shipment_date).sort();
  const dateRange = {
    start: dates[0],
    end: dates[dates.length - 1],
  };

  return {
    totalShipments,
    totalValue: Math.round(totalValue),
    averagePrice: Math.round(averagePrice * 100) / 100,
    totalWeight: Math.round(totalWeight),
    dateRange,
  };
}

/**
 * Calculate market benchmarks
 */
async function calculateBenchmarks(shipments: any[], hsCode?: string) {
  if (!shipments || shipments.length === 0) {
    return {
      marketAverage: 0,
      percentile25: 0,
      percentile50: 0,
      percentile75: 0,
      percentile90: 0,
      peerCompanies: [],
    };
  }

  // If no HS code filter, calculate across all shipments
  let benchmarkQuery = supabase.from('shipment_details').select('unit_price, company_name, total_value');

  if (hsCode) {
    // Compare with market for same HS code (partial match)
    benchmarkQuery = benchmarkQuery.ilike('hs_code', `${hsCode}%`);
  } else if (shipments.length > 0) {
    // Use the HS codes from filtered results
    const hsCodes = [...new Set(shipments.map(s => s.hs_code))];
    benchmarkQuery = benchmarkQuery.in('hs_code', hsCodes);
  }

  const { data: benchmarkData } = await benchmarkQuery;

  if (!benchmarkData || benchmarkData.length === 0) {
    return {
      marketAverage: 0,
      percentile25: 0,
      percentile50: 0,
      percentile75: 0,
      percentile90: 0,
      peerCompanies: [],
    };
  }

  // Calculate percentiles
  const prices = benchmarkData.map(d => d.unit_price || 0).sort((a, b) => a - b);
  const marketAverage = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const getPercentile = (arr: number[], percentile: number) => {
    const index = Math.ceil((percentile / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  };

  // Get peer companies (top 5 by value)
  const companyStats = benchmarkData.reduce((acc, d) => {
    const name = d.company_name;
    if (!acc[name]) {
      acc[name] = { name, totalValue: 0, averagePrice: 0, count: 0 };
    }
    acc[name].totalValue += d.total_value || 0;
    acc[name].averagePrice += d.unit_price || 0;
    acc[name].count += 1;
    return acc;
  }, {} as Record<string, { name: string; totalValue: number; averagePrice: number; count: number }>);

  const peerCompanies = Object.values(companyStats)
    .map(c => ({ ...c, averagePrice: c.averagePrice / c.count }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  return {
    marketAverage: Math.round(marketAverage * 100) / 100,
    percentile25: Math.round(getPercentile(prices, 25) * 100) / 100,
    percentile50: Math.round(getPercentile(prices, 50) * 100) / 100,
    percentile75: Math.round(getPercentile(prices, 75) * 100) / 100,
    percentile90: Math.round(getPercentile(prices, 90) * 100) / 100,
    peerCompanies,
  };
}

/**
 * Identify anomalies in shipment data
 */
function identifyAnomalies(shipments: any[], stats: any) {
  if (!shipments || shipments.length === 0 || !stats.averagePrice) {
    return {
      critical: [],
      high: [],
      medium: [],
      total: 0,
    };
  }

  const critical: any[] = [];
  const high: any[] = [];
  const medium: any[] = [];

  shipments.forEach(shipment => {
    const price = shipment.unit_price || 0;
    const deviation = ((price - stats.averagePrice) / stats.averagePrice) * 100;

    // Critical: Price >30% below average (dumping suspected)
    if (deviation <= -30) {
      critical.push({
        ...shipment,
        deviation: Math.round(deviation * 10) / 10,
        reason: `${Math.abs(Math.round(deviation))}% below market - Dumping suspected`,
      });
    }
    // High: Price 20-30% below average
    else if (deviation <= -20) {
      high.push({
        ...shipment,
        deviation: Math.round(deviation * 10) / 10,
        reason: `${Math.abs(Math.round(deviation))}% below average - High risk`,
      });
    }
    // Medium: Price 10-20% deviation
    else if (Math.abs(deviation) >= 10 && Math.abs(deviation) < 20) {
      medium.push({
        ...shipment,
        deviation: Math.round(deviation * 10) / 10,
        reason: `${Math.abs(Math.round(deviation))}% ${deviation > 0 ? 'above' : 'below'} average`,
      });
    }
  });

  return {
    critical,
    high,
    medium,
    total: critical.length + high.length + medium.length,
  };
}
