/**
 * GET /api/hs/search
 * Search HS codes by code or description
 * Query params: q, by (hs_code|description), tariffType, origin, year, page, limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeHSCode, parseHSCode } from '@/lib/database/tariff';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const searchBy = searchParams.get('by') || 'both'; // 'hs_code', 'description', 'both'
    const tariffType = searchParams.get('tariffType'); // Optional filter
    const origin = searchParams.get('origin'); // Optional for FTA rates
    const year = searchParams.get('year') || new Date().getFullYear().toString(); // Year for FTA rates
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build search query
    let hsCodesQuery: any = supabase
      .from('hs_codes')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (searchBy === 'hs_code' || searchBy === 'both') {
      try {
        const normalizedCode = normalizeHSCode(query);
        hsCodesQuery = hsCodesQuery.or(`code8.ilike.%${normalizedCode}%,code10.ilike.%${normalizedCode}%`);
      } catch {
        // If not a valid code, try text search
        hsCodesQuery = hsCodesQuery.ilike('description', `%${query}%`);
      }
    }

    let isRpcQuery = false;
    if (searchBy === 'description' || (searchBy === 'both' && !query.match(/^\d+$/))) {
      // Use full-text search for descriptions
      const textSearch = searchBy === 'description';
      if (textSearch) {
        // Try exact description match first
        hsCodesQuery = supabase.rpc('search_hs_descriptions', {
          search_query: query,
          search_limit: limit * 2 // Get more for filtering
        }) as any;
        isRpcQuery = true;
      } else {
        // Default to ILIKE for simple description search
        hsCodesQuery = hsCodesQuery.ilike('description', `%${query}%`);
      }
    }

    // Apply pagination (only if not RPC query)
    if (!isRpcQuery) {
      hsCodesQuery = hsCodesQuery.range(offset, offset + limit - 1);
    }

    const { data: hsCodes, error: hsError, count } = await hsCodesQuery;

    if (hsError) {
      console.error('Error searching HS codes:', hsError);
      return NextResponse.json(
        { success: false, error: hsError.message },
        { status: 500 }
      );
    }

    if (!hsCodes || hsCodes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // For each HS code, get tariff summary
    const enrichedResults = await Promise.all(
      hsCodes.map(async (hsCode: any) => {
        // Get MFN rate
        const { data: mfnRate } = await supabase
          .from('duty_rates')
          .select('ad_valorem, tariff_types(code, name)')
          .eq('hs_code_id', hsCode.id)
          .eq('tariff_types.code', 'PDK2024')
          .single();

        // Get FTA count
        const { count: ftaCount } = await supabase
          .from('fta_staging')
          .select('*', { count: 'exact', head: true })
          .eq('hs_code_id', hsCode.id)
          .eq('year', parseInt(year));

        // Check restrictions
        const { data: restriction } = await supabase
          .from('restrictions')
          .select('import_prohibited, export_prohibited')
          .eq('hs_code_id', hsCode.id)
          .single();

        return {
          hs_code: hsCode,
          tariff_summary: {
            mfn_rate: mfnRate?.ad_valorem || null,
            fta_count: ftaCount || 0,
            has_restrictions: restriction
              ? (restriction.import_prohibited || restriction.export_prohibited)
              : false,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedResults,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('HS search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search HS codes' },
      { status: 500 }
    );
  }
}

