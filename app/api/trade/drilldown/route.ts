import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { DataSource, DataQuality } from '@/lib/data-sources/types';

export async function GET(request: Request) {
  try {
    // Track data source metadata
    const metadata = {
      dataSources: [] as string[],
      warnings: [] as string[],
      timestamp: new Date().toISOString()
    };
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const hsCode = searchParams.get('hs_code');
    const company = searchParams.get('company');
    const country = searchParams.get('country');
    const port = searchParams.get('port');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build the base query
    let query = supabase
      .from('shipment_details')
      .select('*', { count: 'exact' });

    // Apply filters
    if (hsCode) {
      // Support partial HS code matches (e.g., "7208" matches "7208.10")
      query = query.ilike('hs_code', `${hsCode}%`);
    }

    if (company) {
      query = query.ilike('company_name', `%${company}%`);
    }

    if (country) {
      query = query.or(`origin_country.eq.${country},destination_country.eq.${country}`);
    }

    if (port) {
      query = query.or(`origin_port_name.ilike.%${port}%,destination_port_name.ilike.%${port}%`);
    }

    if (startDate) {
      query = query.gte('shipment_date', startDate);
    }

    if (endDate) {
      query = query.lte('shipment_date', endDate);
    }

    // Apply pagination
    query = query
      .order('shipment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: shipments, error, count } = await query;

    if (error) {
      console.error('Drill-down query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shipment data', details: error.message },
        { status: 500 }
      );
    }

    // Calculate aggregated stats
    const stats = await calculateDrillDownStats({
      hsCode,
      company,
      country,
      port,
      startDate,
      endDate,
    });

    // Calculate trend data for charts
    const trends = await calculateTrendData({
      hsCode,
      company,
      country,
      port,
      startDate,
      endDate,
    });

    // Add anomaly flags to shipments with data quality scores
    const shipmentsWithAnomalies = await addAnomalyFlags(shipments || [], stats.averagePrice);

    // Add data source metadata
    metadata.dataSources.push('shipment_details');
    if (shipments && shipments.length > 0) {
      const sources = new Set(shipments.map((s: any) => s.source || 'MOCK'));
      metadata.dataSources = Array.from(sources);

      // Warn if using mock data
      if (sources.has('MOCK')) {
        metadata.warnings.push('Displaying mock shipment data. Real shipment tracking requires commercial API integration.');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        shipments: shipmentsWithAnomalies,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        stats,
        trends,
      },
      metadata // Include data source information
    });

  } catch (error) {
    console.error('Drill-down API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * Calculate aggregated statistics for drill-down results
 */
async function calculateDrillDownStats(filters: {
  hsCode?: string | null;
  company?: string | null;
  country?: string | null;
  port?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  try {
    // Build stats query
    let statsQuery = supabase
      .from('shipment_details')
      .select('total_value, unit_price, company_name, origin_country, destination_country');

    // Apply same filters as main query
    if (filters.hsCode) {
      statsQuery = statsQuery.eq('hs_code', filters.hsCode);
    }

    if (filters.company) {
      statsQuery = statsQuery.ilike('company_name', `%${filters.company}%`);
    }

    if (filters.country) {
      statsQuery = statsQuery.or(`origin_country.eq.${filters.country},destination_country.eq.${filters.country}`);
    }

    if (filters.port) {
      statsQuery = statsQuery.or(`origin_port_name.ilike.%${filters.port}%,destination_port_name.ilike.%${filters.port}%`);
    }

    if (filters.startDate) {
      statsQuery = statsQuery.gte('shipment_date', filters.startDate);
    }

    if (filters.endDate) {
      statsQuery = statsQuery.lte('shipment_date', filters.endDate);
    }

    const { data: statsData, error } = await statsQuery;

    if (error || !statsData) {
      return {
        totalShipments: 0,
        totalValue: 0,
        averagePrice: 0,
        topCompanies: [],
        topCountries: [],
      };
    }

    // Calculate aggregated stats
    const totalShipments = statsData.length;
    const totalValue = statsData.reduce((sum, s) => sum + (s.total_value || 0), 0);
    const averagePrice = statsData.length > 0
      ? statsData.reduce((sum, s) => sum + (s.unit_price || 0), 0) / statsData.length
      : 0;

    // Top companies by value
    const companyStats = statsData.reduce((acc, s) => {
      const name = s.company_name;
      if (!acc[name]) {
        acc[name] = { name, totalValue: 0, shipments: 0 };
      }
      acc[name].totalValue += s.total_value || 0;
      acc[name].shipments += 1;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number; shipments: number }>);

    const topCompanies = Object.values(companyStats)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Top countries by shipment count
    const countryStats = statsData.reduce((acc, s) => {
      const origin = s.origin_country;
      const dest = s.destination_country;

      if (!acc[origin]) acc[origin] = 0;
      if (!acc[dest]) acc[dest] = 0;

      acc[origin] += 1;
      acc[dest] += 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country, shipments: count }))
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 5);

    return {
      totalShipments,
      totalValue: Math.round(totalValue),
      averagePrice: Math.round(averagePrice * 100) / 100,
      topCompanies,
      topCountries,
    };

  } catch (error) {
    console.error('Stats calculation error:', error);
    return {
      totalShipments: 0,
      totalValue: 0,
      averagePrice: 0,
      topCompanies: [],
      topCountries: [],
    };
  }
}

/**
 * Calculate trend data for time-series charts
 */
async function calculateTrendData(filters: {
  hsCode?: string | null;
  company?: string | null;
  country?: string | null;
  port?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  try {
    // Build trend query
    let trendQuery = supabase
      .from('shipment_details')
      .select('shipment_date, total_value, unit_price, weight_kg, origin_country');

    // Apply same filters as main query
    if (filters.hsCode) {
      trendQuery = trendQuery.eq('hs_code', filters.hsCode);
    }

    if (filters.company) {
      trendQuery = trendQuery.ilike('company_name', `%${filters.company}%`);
    }

    if (filters.country) {
      trendQuery = trendQuery.or(`origin_country.eq.${filters.country},destination_country.eq.${filters.country}`);
    }

    if (filters.port) {
      trendQuery = trendQuery.or(`origin_port_name.ilike.%${filters.port}%,destination_port_name.ilike.%${filters.port}%`);
    }

    if (filters.startDate) {
      trendQuery = trendQuery.gte('shipment_date', filters.startDate);
    }

    if (filters.endDate) {
      trendQuery = trendQuery.lte('shipment_date', filters.endDate);
    }

    trendQuery = trendQuery.order('shipment_date', { ascending: true });

    const { data: trendData, error } = await trendQuery;

    if (error || !trendData || trendData.length === 0) {
      return {
        volumeOverTime: [],
        priceOverTime: [],
        valueByCountry: [],
      };
    }

    // Group by month for volume trend
    const monthlyVolume = trendData.reduce((acc, shipment) => {
      const month = shipment.shipment_date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, shipments: 0, totalWeight: 0 };
      }
      acc[month].shipments += 1;
      acc[month].totalWeight += shipment.weight_kg || 0;
      return acc;
    }, {} as Record<string, { month: string; shipments: number; totalWeight: number }>);

    const volumeOverTime = Object.values(monthlyVolume).sort((a, b) => a.month.localeCompare(b.month));

    // Group by month for price trend
    const monthlyPrice = trendData.reduce((acc, shipment) => {
      const month = shipment.shipment_date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, totalPrice: 0, count: 0 };
      }
      acc[month].totalPrice += shipment.unit_price || 0;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; totalPrice: number; count: number }>);

    const priceOverTime = Object.entries(monthlyPrice)
      .map(([month, data]) => ({
        month,
        avgPrice: Math.round((data.totalPrice / data.count) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by country for market share
    const countryValue = trendData.reduce((acc, shipment) => {
      const country = shipment.origin_country;
      if (!acc[country]) {
        acc[country] = { country, totalValue: 0, shipments: 0 };
      }
      acc[country].totalValue += shipment.total_value || 0;
      acc[country].shipments += 1;
      return acc;
    }, {} as Record<string, { country: string; totalValue: number; shipments: number }>);

    const valueByCountry = Object.values(countryValue)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      volumeOverTime,
      priceOverTime,
      valueByCountry,
    };

  } catch (error) {
    console.error('Trend calculation error:', error);
    return {
      volumeOverTime: [],
      priceOverTime: [],
      valueByCountry: [],
    };
  }
}

/**
 * Add anomaly flags to shipments based on price deviation
 */
async function addAnomalyFlags(shipments: any[], averagePrice: number) {
  if (!shipments || shipments.length === 0 || !averagePrice) {
    return shipments;
  }

  // Calculate standard deviation for price
  const prices = shipments.map(s => s.unit_price || 0);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return shipments.map(shipment => {
    const price = shipment.unit_price || 0;
    const deviation = ((price - averagePrice) / averagePrice) * 100;
    const zScore = stdDev > 0 ? (price - mean) / stdDev : 0;

    let anomalyFlag = null;
    let riskLevel = 'normal';

    // Critical: Price >30% below average (dumping suspected)
    if (deviation <= -30) {
      anomalyFlag = `${Math.abs(Math.round(deviation))}% below market - Dumping suspected`;
      riskLevel = 'critical';
    }
    // High: Price 20-30% below average
    else if (deviation <= -20) {
      anomalyFlag = `${Math.abs(Math.round(deviation))}% below average - High risk`;
      riskLevel = 'high';
    }
    // Medium: Price 10-20% deviation (either direction)
    else if (Math.abs(deviation) >= 10 && Math.abs(deviation) < 20) {
      anomalyFlag = `${Math.abs(Math.round(deviation))}% ${deviation > 0 ? 'above' : 'below'} average`;
      riskLevel = 'medium';
    }
    // Unusual volume (using Z-score)
    else if (Math.abs(zScore) > 2.5) {
      anomalyFlag = 'Unusual pricing pattern detected';
      riskLevel = 'medium';
    }

    return {
      ...shipment,
      anomaly_flag: anomalyFlag,
      risk_level: riskLevel,
      price_deviation: Math.round(deviation * 10) / 10,
      z_score: Math.round(zScore * 100) / 100,
      // Add data quality indicator
      data_quality: shipment.source === 'MOCK' ? DataQuality.MOCK :
        (shipment.source && shipment.source !== 'MOCK') ? DataQuality.ENHANCED :
          DataQuality.UNKNOWN
    };
  });
}
