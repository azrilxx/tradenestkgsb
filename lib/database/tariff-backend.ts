/**
 * Tariff Backend Service
 * Service layer for interacting with tariff database
 */

import { createClient } from '@/lib/supabase/server';
import type { HSCode, HSCodeDetail, HSSearchResult } from './tariff';

export class TariffBackend {
  /**
   * Search HS codes with full-text search
   */
  async searchHSCodes(query: string, options: {
    by?: 'hs_code' | 'description' | 'both';
    tariffType?: string;
    year?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    results: HSSearchResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const supabase = await createClient();
    const {
      by = 'both',
      tariffType,
      year = new Date().getFullYear(),
      page = 1,
      limit = 20,
    } = options;

    const offset = (page - 1) * limit;

    // Build search query based on 'by' parameter
    let hsCodesQuery = supabase
      .from('hs_codes')
      .select('*', { count: 'exact' });

    if (by === 'hs_code' || by === 'both') {
      // Search by HS code
      hsCodesQuery = hsCodesQuery.or(`code8.ilike.%${query}%,code10.ilike.%${query}%`);
    }

    if (by === 'description') {
      // Full-text search on description
      hsCodesQuery = hsCodesQuery.ilike('description', `%${query}%`);
    }

    // Apply pagination
    const { data: hsCodes, error, count } = await hsCodesQuery
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    if (!hsCodes || hsCodes.length === 0) {
      return {
        results: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Enrich with tariff summaries
    const results = await Promise.all(
      hsCodes.map(async (hsCode) => {
        const summary = await this.getTariffSummary(hsCode.id, year);
        return {
          hs_code: hsCode,
          tariff_summary: summary,
        };
      })
    );

    return {
      results,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get HS code details by code
   */
  async getHSCodeDetails(code: string, options: {
    tariffType?: string;
    origin?: string;
    year?: number;
  } = {}): Promise<HSCodeDetail | null> {
    const supabase = await createClient();
    const { tariffType, origin, year = new Date().getFullYear() } = options;

    // Find HS code
    const { data: hsCode, error } = await supabase
      .from('hs_codes')
      .select('*')
      .or(`code8.eq.${code},code10.eq.${code}`)
      .single();

    if (error || !hsCode) {
      return null;
    }

    // Get MFN rates
    const mfnRates = await this.getMFNRates(hsCode.id);

    // Get FTA rates if tariffType and origin specified
    const ftaRates = (tariffType && origin)
      ? await this.getFTARates(hsCode.id, tariffType, year)
      : [];

    // Get Rules of Origin
    const rulesOfOrigin = await this.getRulesOfOrigin(hsCode.id);

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

    return {
      hs_code: hsCode,
      mfn_rates: mfnRates,
      fta_rates: ftaRates,
      rules_of_origin: rulesOfOrigin,
      indirect_tax: indirectTax || null,
      restrictions: restrictions || null,
    };
  }

  /**
   * Get tariff summary for an HS code
   */
  private async getTariffSummary(hsCodeId: string, year: number) {
    const supabase = await createClient();
    // Get MFN rate
    const { data: mfnRate } = await supabase
      .from('duty_rates')
      .select('ad_valorem')
      .eq('hs_code_id', hsCodeId)
      .in('tariff_type_id', [
        await this.getTariffTypeId('PDK2024'),
      ])
      .single();

    // Get FTA count
    const { count: ftaCount } = await supabase
      .from('fta_staging')
      .select('*', { count: 'exact', head: true })
      .eq('hs_code_id', hsCodeId)
      .eq('year', year);

    // Check restrictions
    const { data: restriction } = await supabase
      .from('restrictions')
      .select('import_prohibited, export_prohibited')
      .eq('hs_code_id', hsCodeId)
      .single();

    return {
      mfn_rate: mfnRate?.ad_valorem || null,
      fta_count: ftaCount || 0,
      has_restrictions: restriction
        ? (restriction.import_prohibited || restriction.export_prohibited)
        : false,
    };
  }

  /**
   * Get MFN rates
   */
  private async getMFNRates(hsCodeId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('duty_rates')
      .select(`
        *,
        tariff_types (
          id, code, name, version_date, legal_ref
        )
      `)
      .eq('hs_code_id', hsCodeId)
      .order('effective_from', { ascending: false });

    return (data || []).map((r: any) => ({
      tariff_type: r.tariff_types,
      ad_valorem: r.ad_valorem,
      specific: r.specific,
      unit: r.unit,
      note: r.note,
      effective_from: r.effective_from,
      effective_to: r.effective_to,
    }));
  }

  /**
   * Get FTA rates
   */
  private async getFTARates(hsCodeId: string, tariffType: string, year: number) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('fta_staging')
      .select(`
        *,
        tariff_types (
          id, code, name, version_date, legal_ref
        )
      `)
      .eq('hs_code_id', hsCodeId)
      .eq('year', year);

    return (data || []).map((r: any) => ({
      tariff_type: r.tariff_types,
      ad_valorem: r.pref_ad_valorem,
      specific: r.pref_specific,
      unit: r.unit,
      note: r.note,
      effective_from: r.year?.toString() || new Date().getFullYear().toString(),
      effective_to: null,
      year: r.year,
    }));
  }

  /**
   * Get Rules of Origin
   */
  private async getRulesOfOrigin(hsCodeId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('rules_of_origin')
      .select(`
        *,
        tariff_types (
          id, code, name, version_date, legal_ref
        )
      `)
      .eq('hs_code_id', hsCodeId);

    return (data || []).map((r: any) => ({
      id: r.id,
      tariff_type_id: r.tariff_type_id,
      hs_code_id: r.hs_code_id,
      rule_text: r.rule_text,
      cumulation_text: r.cumulation_text,
      created_at: r.created_at,
      updated_at: r.updated_at,
      tariff_type: r.tariff_types,
    }));
  }

  /**
   * Get tariff type ID by code
   */
  private async getTariffTypeId(code: string): Promise<string | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('tariff_types')
      .select('id')
      .eq('code', code)
      .single();

    return data?.id || null;
  }
}

// Export singleton instance
export const tariffBackend = new TariffBackend();

