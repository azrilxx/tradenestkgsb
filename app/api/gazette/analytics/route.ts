import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * GET /api/gazette/analytics
 * Returns comprehensive analytics data for premium gazette dashboard
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch all required analytics data in parallel
    const [
      sectorImpact,
      geographicDist,
      monthlyTrends,
      expiringMeasures,
      topHsCodes,
    ] = await Promise.all([
      // Sector Impact Summary
      supabase.from('v_gazette_sector_summary').select('*'),

      // Geographic Distribution
      supabase.from('v_gazette_geographic_risk').select('*'),

      // Monthly Trends
      supabase.from('v_gazette_monthly_trends').select('*'),

      // Expiring Measures
      supabase.from('v_expiring_measures').select('*'),

      // Top Affected HS Codes
      supabase.from('v_top_affected_hs_codes').select('*'),
    ]);

    // Transform sector impact data
    const sectorData = (sectorImpact.data || []).map((s: any) => ({
      sector: s.sector,
      affected_count: s.affected_gazettes || 0,
      avg_duty_rate: s.avg_max_duty_rate || 0,
      total_value_at_risk: parseFloat(s.total_value_at_risk || '0'),
      unique_hs_codes: s.unique_hs_codes_affected || 0,
      unique_countries: s.unique_countries_affected || 0,
    }));

    // Transform geographic distribution
    const geoData = (geographicDist.data || []).map((g: any) => ({
      country: g.country,
      active_measures: g.active_measures || 0,
      total_duty_pct: parseFloat(g.avg_duty_rate || '0'),
      affected_categories: g.affected_product_categories || 0,
      measure_types: g.measure_types || '',
    }));

    // Transform monthly trends
    const trendData = (monthlyTrends.data || []).map((m: any) => ({
      month: m.month,
      category_counts: {
        trade_remedy: m.category === 'trade_remedy' ? m.gazette_count : 0,
        tariff_change: m.category === 'tariff_change' ? m.gazette_count : 0,
        anti_dumping: m.category === 'anti_dumping' ? m.gazette_count : 0,
        import_restriction: m.category === 'import_restriction' ? m.gazette_count : 0,
      },
      total_value: parseFloat(m.total_impact_value || '0'),
      avg_duty: parseFloat(m.avg_duty_rate || '0'),
    }));

    // Transform expiring measures
    const expiring = (expiringMeasures.data || []).map((e: any) => ({
      gazette_id: e.gazette_id,
      gazette_number: e.gazette_number,
      title: e.title,
      category: e.category,
      expiry_date: e.expiry_date,
      days_remaining: e.days_remaining,
      affected_hs_codes: e.hs_codes || [],
      affected_countries: e.affected_countries || [],
    }));

    // Transform top HS codes
    const topCodes = (topHsCodes.data || []).map((t: any) => ({
      hs_code: t.hs_code,
      gazette_count: t.gazette_count || 0,
      avg_duty: parseFloat(t.avg_duty_rate || '0'),
      sectors_affected: t.sectors_affected || 0,
      total_value_impact: parseFloat(t.total_value_impact || '0'),
    }));

    return NextResponse.json({
      success: true,
      data: {
        sector_impact: sectorData,
        geographic_distribution: geoData,
        monthly_trends: trendData,
        expiring_measures: expiring,
        top_hs_codes: topCodes,
      },
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

