/**
 * Tariff Database Types and Utilities
 * Type definitions for the HS tariff backend
 */

export interface TariffType {
  id: string;
  code: string;
  name: string;
  version_date: string | null;
  legal_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface HSCode {
  id: string;
  chapter: string;
  heading: string;
  subheading: string | null;
  code8: string;
  code10: string | null;
  description: string;
  unit: string;
  keywords: string[] | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface DutyRate {
  id: string;
  hs_code_id: string;
  tariff_type_id: string;
  ad_valorem: number | null;
  specific: number | null;
  unit: string | null;
  note: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface FtaStaging {
  id: string;
  hs_code_id: string;
  tariff_type_id: string;
  year: number;
  pref_ad_valorem: number | null;
  pref_specific: number | null;
  unit: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface RulesOfOrigin {
  id: string;
  tariff_type_id: string;
  hs_code_id: string;
  rule_text: string;
  cumulation_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndirectTax {
  id: string;
  hs_code_id: string;
  sst_rate: number | null;
  excise_rate: number | null;
  sst_note: string | null;
  excise_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restriction {
  id: string;
  hs_code_id: string;
  import_prohibited: boolean;
  export_prohibited: boolean;
  ap_required: boolean;
  legal_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchTerm {
  id: string;
  hs_code_id: string;
  term: string;
  created_at: string;
}

// API Response Types
export interface TariffRateInfo {
  tariff_type: TariffType;
  ad_valorem: number | null;
  specific: number | null;
  unit: string | null;
  note: string | null;
  effective_from: string;
  effective_to: string | null;
}

export interface HSCodeDetail {
  hs_code: HSCode;
  mfn_rates: TariffRateInfo[];
  fta_rates: Array<TariffRateInfo & { year: number }>;
  rules_of_origin: Array<RulesOfOrigin & { tariff_type: TariffType }>;
  indirect_tax: IndirectTax | null;
  restrictions: Restriction | null;
}

export interface HSSearchResult {
  hs_code: HSCode;
  tariff_summary: {
    mfn_rate: number | null;
    fta_count: number;
    has_restrictions: boolean;
  };
}

/**
 * Normalize HS code (strip dots, pad to 8 or 10 digits)
 */
export function normalizeHSCode(code: string, targetLength: 8 | 10 = 8): string {
  // Remove all non-digits
  const digits = code.replace(/\D/g, '');

  if (digits.length === 0) {
    throw new Error('Invalid HS code: must contain at least one digit');
  }

  // Pad with zeros to target length
  return digits.padEnd(targetLength, '0');
}

/**
 * Parse HS code into components
 */
export function parseHSCode(code: string) {
  const normalized = normalizeHSCode(code);

  return {
    chapter: normalized.substring(0, 2),
    heading: normalized.substring(0, 4),
    subheading: normalized.substring(0, 6),
    code8: normalized.substring(0, 8),
    code10: normalized.length >= 10 ? normalized.substring(0, 10) : null,
  };
}

