import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

interface CompanyProfile {
  id: string;
  name: string;
  country: string;
  type: string;
  sector: string;
  stats: {
    total_shipments: number;
    total_value: number;
    unique_products: number;
    unique_routes: number;
    first_shipment_date: string | null;
    last_shipment_date: string | null;
  };
  top_products: Array<{
    hs_code: string;
    description: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_suppliers: Array<{
    company_id: string;
    company_name: string;
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_customers: Array<{
    company_id: string;
    company_name: string;
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_carriers: Array<{
    vessel_name: string;
    shipments: number;
    total_weight: number;
    percentage: number;
  }>;
  shipping_activity: Array<{
    month: string;
    shipments: number;
    total_value: number;
    avg_price: number;
  }>;
  activity_feed: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  country_distribution: Array<{
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;

    // Create Supabase client for server-side use
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Fetch company basic info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company statistics using the database function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_company_stats', { company_uuid: companyId });

    if (statsError) {
      console.error('RPC get_company_stats error:', statsError);
    }

    // Calculate stats from shipments if RPC fails or returns empty
    let stats = {
      total_shipments: statsData?.[0]?.total_shipments || 0,
      total_value: parseFloat(statsData?.[0]?.total_value || '0'),
      unique_products: statsData?.[0]?.unique_products || 0,
      unique_routes: statsData?.[0]?.unique_routes || 0,
      first_shipment_date: statsData?.[0]?.first_shipment_date || null,
      last_shipment_date: statsData?.[0]?.last_shipment_date || null,
    };

    // Get all shipment details for this company
    // Try to query the view first, fallback to direct table query if view fails
    let { data: shipments, error: shipmentsError } = await supabase
      .from('shipment_details')
      .select('*')
      .eq('company_id', companyId)
      .order('shipment_date', { ascending: false });

    // If view query fails, try querying the underlying tables directly
    if (shipmentsError) {
      console.error('Shipment view query error:', shipmentsError);
      console.log('Falling back to direct shipments table query...');

      // Fallback: Query shipments table directly with joins
      const { data: directShipments, error: directError } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_date,
          arrival_date,
          vessel_name,
          container_count,
          weight_kg,
          volume_m3,
          unit_price,
          total_value,
          currency,
          freight_cost,
          invoice_number,
          bl_number,
          hs_code,
          products!inner(hs_code, description, category),
          companies!inner(id, name, country, type, sector)
        `)
        .eq('company_id', companyId)
        .order('shipment_date', { ascending: false });

      if (directError) {
        console.error('Direct shipments query error:', directError);
        return NextResponse.json(
          {
            error: 'Failed to fetch shipments',
            details: directError.message,
            hint: 'Check if shipments table has data and RLS policies are configured'
          },
          { status: 500 }
        );
      }

      // Transform direct query results to match shipment_details format
      shipments = directShipments?.map((s: any) => ({
        ...s,
        company_id: s.companies?.id,
        company_name: s.companies?.name,
        company_country: s.companies?.country,
        company_type: s.companies?.type,
        company_sector: s.companies?.sector,
        product_id: s.products?.id || s.product_id,
        hs_code: s.products?.hs_code || s.hs_code,
        product_description: s.products?.description,
        product_category: s.products?.category,
        origin_country: s.origin_country || 'Unknown',
        destination_country: s.destination_country || 'Unknown',
      })) || [];

      shipmentsError = null;
    }

    // If no shipments, return empty profile but don't error
    if (!shipments || shipments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          id: company.id,
          name: company.name,
          country: company.country,
          type: company.type,
          sector: company.sector,
          stats: {
            total_shipments: 0,
            total_value: 0,
            unique_products: 0,
            unique_routes: 0,
            first_shipment_date: null,
            last_shipment_date: null,
          },
          top_products: [],
          top_suppliers: [],
          top_customers: [],
          top_carriers: [],
          shipping_activity: [],
          activity_feed: [],
          country_distribution: [],
        },
      });
    }

    // If stats from RPC are all zeros but we have shipments, recalculate stats
    if (stats.total_shipments === 0 && shipments.length > 0) {
      console.log('RPC returned zero stats, recalculating from shipments...');

      const uniqueProducts = new Set(shipments.map((s: any) => s.product_id));
      const uniqueRoutes = new Set(
        shipments.map((s: any) => `${s.origin_port_id || 'null'}-${s.destination_port_id || 'null'}`)
      );

      const shipmentDates = shipments
        .map((s: any) => s.shipment_date)
        .filter((d: any) => d)
        .sort();

      stats = {
        total_shipments: shipments.length,
        total_value: shipments.reduce((sum: number, s: any) => sum + (parseFloat(s.total_value) || 0), 0),
        unique_products: uniqueProducts.size,
        unique_routes: uniqueRoutes.size,
        first_shipment_date: shipmentDates[0] || null,
        last_shipment_date: shipmentDates[shipmentDates.length - 1] || null,
      };

      console.log('Recalculated stats:', stats);
    }

    // Calculate top products
    const productStats = shipments.reduce((acc, shipment) => {
      const product = {
        hs_code: shipment.hs_code,
        description: shipment.product_description,
        shipments: 0,
        total_value: 0,
      };

      if (!acc[shipment.product_id]) {
        acc[shipment.product_id] = { ...product };
      }
      acc[shipment.product_id].shipments += 1;
      acc[shipment.product_id].total_value += shipment.total_value || 0;
      return acc;
    }, {} as Record<string, { hs_code: string; description: string; shipments: number; total_value: number }>);

    const topProducts = (Object.values(productStats) as Array<{ hs_code: string; description: string; shipments: number; total_value: number }>)
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        percentage: stats.total_shipments > 0 ? (p.shipments / stats.total_shipments) * 100 : 0,
      }));

    // Calculate top carriers (vessel names)
    const carrierStats = shipments.reduce((acc, shipment) => {
      const vessel = shipment.vessel_name || 'Unknown';
      if (!acc[vessel]) {
        acc[vessel] = { vessel_name: vessel, shipments: 0, total_weight: 0 };
      }
      acc[vessel].shipments += 1;
      acc[vessel].total_weight += shipment.weight_kg || 0;
      return acc;
    }, {} as Record<string, { vessel_name: string; shipments: number; total_weight: number }>);

    const topCarriers = (Object.values(carrierStats) as Array<{ vessel_name: string; shipments: number; total_weight: number }>)
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        percentage: stats.total_shipments > 0 ? (c.shipments / stats.total_shipments) * 100 : 0,
      }));

    // Calculate shipping activity over time (by month)
    const monthlyActivity = shipments.reduce((acc, shipment) => {
      const month = shipment.shipment_date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, shipments: 0, total_value: 0, total_price: 0, count: 0 };
      }
      acc[month].shipments += 1;
      acc[month].total_value += shipment.total_value || 0;
      acc[month].total_price += shipment.unit_price || 0;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; shipments: number; total_value: number; total_price: number; count: number }>);

    const shippingActivity = (Object.values(monthlyActivity) as Array<{ month: string; shipments: number; total_value: number; total_price: number; count: number }>)
      .map((m) => ({
        month: m.month,
        shipments: m.shipments,
        total_value: m.total_value,
        avg_price: m.count > 0 ? m.total_price / m.count : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Calculate country distribution
    const countryStats = shipments.reduce((acc, shipment) => {
      const country = shipment.origin_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = { country, shipments: 0, total_value: 0 };
      }
      acc[country].shipments += 1;
      acc[country].total_value += shipment.total_value || 0;
      return acc;
    }, {} as Record<string, { country: string; shipments: number; total_value: number }>);

    const countryDistribution = (Object.values(countryStats) as Array<{ country: string; shipments: number; total_value: number }>)
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        percentage: stats.total_shipments > 0 ? (c.shipments / stats.total_shipments) * 100 : 0,
      }));

    // Generate activity feed from recent shipments
    const recentShipments = shipments.slice(0, 10);
    const activityFeed = recentShipments.map((shipment) => ({
      date: shipment.shipment_date,
      type: 'shipment',
      description: `Received shipment of ${shipment.product_description} (${shipment.weight_kg}kg) from ${shipment.origin_country}`,
    }));

    // For top suppliers and customers, we need to look at shipment relationships
    // These would require tracking supplier/customer relationships in the shipments
    // For now, we'll use a simplified approach based on company names in shipments
    const topSuppliers: Array<{
      company_id: string;
      company_name: string;
      country: string;
      shipments: number;
      total_value: number;
      percentage: number;
    }> = [];

    const topCustomers: Array<{
      company_id: string;
      company_name: string;
      country: string;
      shipments: number;
      total_value: number;
      percentage: number;
    }> = [];

    // Build response
    const response: CompanyProfile = {
      id: company.id,
      name: company.name,
      country: company.country,
      type: company.type,
      sector: company.sector,
      stats,
      top_products: topProducts,
      top_suppliers: topSuppliers,
      top_customers: topCustomers,
      top_carriers: topCarriers,
      shipping_activity: shippingActivity,
      activity_feed: activityFeed,
      country_distribution: countryDistribution,
    };

    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Company profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

