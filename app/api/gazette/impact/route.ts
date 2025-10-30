import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * POST /api/gazette/impact
 * Analyze impact of gazettes on specific HS codes or companies
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hs_codes, company_id } = body;

    if (!hs_codes && !company_id) {
      return NextResponse.json(
        { error: 'Must provide either hs_codes or company_id' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (hs_codes) {
      // Analyze impact on specific HS codes
      const hsCodesArray = Array.isArray(hs_codes) ? hs_codes : [hs_codes];

      const { data: affectedItems, error } = await supabase
        .from('gazette_affected_items')
        .select(`
          *,
          gazettes (
            id,
            gazette_number,
            title,
            summary,
            category,
            sector,
            publication_date,
            estimated_impact_value,
            duty_rate_min,
            duty_rate_max
          )
        `)
        .or(hsCodesArray.map(code => `hs_codes.cs.{${code}}`).join(','));

      if (error) {
        console.error('Error fetching affected items:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Group by HS code
      const impactByHsCode = hsCodesArray.reduce((acc: any, code: string) => {
        acc[code] = affectedItems?.filter((item: any) =>
          item.hs_codes?.includes(code)
        ).map((item: any) => ({
          gazette_id: item.gazette_id,
          gazette_number: item.gazettes?.gazette_number,
          title: item.gazettes?.title,
          category: item.gazettes?.category,
          sector: item.gazettes?.sector,
          duty_rate: item.duty_rate || item.gazettes?.duty_rate_max || 0,
          expiry_date: item.expiry_date,
          affected_countries: item.affected_countries,
          remedy_type: item.remedy_type,
        })) || [];
        return acc;
      }, {});

      // Calculate summary statistics
      const totalImpact = affectedItems?.length || 0;
      const totalValue = affectedItems?.reduce((sum: number, item: any) =>
        sum + (parseFloat(item.gazettes?.estimated_impact_value) || 0), 0
      ) || 0;

      return NextResponse.json({
        success: true,
        data: {
          hs_codes: impactByHsCode,
          summary: {
            total_affected_gazettes: totalImpact,
            total_value_at_risk: totalValue,
            sectors_affected: [...new Set(affectedItems?.map((item: any) => item.gazettes?.sector))],
            avg_duty_rate: affectedItems?.reduce((sum: number, item: any) =>
              sum + (item.duty_rate || 0), 0
            ) / (affectedItems?.length || 1) || 0,
          },
        },
      });
    }

    // TODO: Company ID impact analysis (require shipments/companies data)
    return NextResponse.json({
      success: true,
      message: 'Company impact analysis coming soon...,',
    });

  } catch (error: any) {
    console.error('Impact analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze impact',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

