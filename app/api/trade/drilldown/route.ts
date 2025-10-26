import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
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
      query = query.eq('hs_code', hsCode);
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

    return NextResponse.json({
      success: true,
      data: {
        shipments: shipments || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        stats,
      },
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
