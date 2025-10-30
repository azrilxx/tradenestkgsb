/**
 * GET /api/hs/[code]
 * Get detailed info for a specific HS code
 * Query params: tariffType, origin, year
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeHSCode } from '@/lib/database/tariff';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tariffType = searchParams.get('tariffType');
    const origin = searchParams.get('origin');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const code = params.code;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'HS code is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Normalize and find the HS code
    const normalizedCode = normalizeHSCode(code);

    const { data: hsCode, error: hsError } = await supabase
      .from('hs_codes')
      .select('*')
      .or(`code8.eq.${normalizedCode},code10.eq.${normalizedCode}`)
      .single();

    if (hsError || !hsCode) {
      return NextResponse.json(
        { success: false, error: 'HS code not found' },
        { status: 404 }
      );
    }

    // Get MFN rates
    const { data: mfnRates } = await supabase
      .from('duty_rates')
      .select(`
        *,
        tariff_types (
          id, code, name, version_date, legal_ref
        )
      `)
      .eq('hs_code_id', hsCode.id)
      .ilike('tariff_types.code', 'PDK%')
      .order('effective_from', { ascending: false });

    // Get FTA rates (if tariffType and origin specified)
    let ftaRates: any[] = [];
    if (tariffType && origin) {
      const { data } = await supabase
        .from('fta_staging')
        .select(`
          *,
          tariff_types (
            id, code, name, version_date, legal_ref
          )
        `)
        .eq('hs_code_id', hsCode.id)
        .eq('year', parseInt(year))
        .ilike('tariff_types.code', `%${tariffType}%`);

      ftaRates = data || [];
    }

    // Get Rules of Origin
    const { data: roo } = await supabase
      .from('rules_of_origin')
      .select(`
        *,
        tariff_types (
          id, code, name, version_date, legal_ref
        )
      `)
      .eq('hs_code_id', hsCode.id)
      .order('tariff_types.code', { ascending: true });

    // Get Indirect Tax
    const { data: indirectTax } = await supabase
      .from('indirect_tax')
      .select('*')
      .eq('hs_code_id', hsCode.id)
      .single();

    // Get Restrictions
    const { data: restrictions } = await supabase
      .from('restrictions')
      .select('*')
      .eq('hs_code_id', hsCode.id)
      .single();

    // Format response
    const result = {
      hs_code: hsCode,
      mfn_rates: mfnRates?.map((r: any) => ({
        tariff_type: r.tariff_types,
        ad_valorem: r.ad_valorem,
        specific: r.specific,
        unit: r.unit,
        note: r.note,
        effective_from: r.effective_from,
        effective_to: r.effective_to,
      })) || [],
      fta_rates: ftaRates.map((r: any) => ({
        tariff_type: r.tariff_types,
        year: r.year,
        pref_ad_valorem: r.pref_ad_valorem,
        pref_specific: r.pref_specific,
        unit: r.unit,
        note: r.note,
      })),
      rules_of_origin: roo?.map((r: any) => ({
        tariff_type: r.tariff_types,
        rule_text: r.rule_text,
        cumulation_text: r.cumulation_text,
      })) || [],
      indirect_tax: indirectTax || null,
      restrictions: restrictions || null,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('HS code detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch HS code details' },
      { status: 500 }
    );
  }
}

