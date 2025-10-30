/**
 * Enhanced HS Code Database with Tariff Rates and Import/Export Requirements
 * Based on Malaysian Customs HS Explorer (EZHS) functionality
 * Updated with 2024-2025 data and comprehensive licensing requirements
 * 
 * Key Licensing Authorities:
 * - NPRA: National Pharmaceutical Regulatory Agency (pharmaceuticals)
 * - SIRIM: Standards and Industrial Research Institute (electrical products)
 * - Bomba: Fire Department (hazardous materials)
 * - MITI: Ministry of International Trade and Industry (automotive, certain goods)
 * - MAFI: Ministry of Agriculture and Food Industries (food products)
 * - JKJAV: Joint Committee on Alcoholic Beverages (alcohol)
 * - MRB: Malaysian Rubber Board (rubber products)
 * - DOA: Department of Agriculture (agricultural products)
 * - MCMC: Malaysian Communications and Multimedia Commission (telecom equipment)
 */

export interface HSCodeInfo {
  code: string;
  description: string;
  category: string;
  unit: string;
}

export interface TariffRate {
  agreement: string;
  agreement_full_name: string;
  rate: number;
  rate_type: 'percentage' | 'specific' | 'mixed';
  note?: string;
  effective_date?: string;
}

export interface ImportExportRequirements {
  import_license_required: boolean;
  license_issuing_authority?: string; // NPRA, JKJAV, Bomba, MITI, SIRIM, MAFI, DOA, MRB, MCMC
  license_type?: string; // e.g., "Import Permit", "Product Registration", "AP License"
  permit_required: boolean;
  controlled_item: boolean;
  restricted_countries?: string[];
  prohibited: boolean;
  special_requirements?: string[];
  regulation_reference?: string;
  contact_url?: string;
  notes?: string;
}

export interface HSCodeTariff {
  hs_code: HSCodeInfo;
  tariffs: TariffRate[];
  import_requirements?: ImportExportRequirements;
  export_requirements?: ImportExportRequirements;
  last_updated?: string;
}

// Sample HS Code database (in production, this would come from a real customs database)
export const HS_CODE_DATABASE: HSCodeTariff[] = [
  {
    hs_code: {
      code: '7208',
      description: 'Hot-rolled flat products of iron or non-alloy steel',
      category: 'Steel & Metals',
      unit: 'tonnes',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 10.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
        note: 'Requires Certificate of Origin (Form D)',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN-China Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
        note: 'Requires Certificate of Origin (Form E)',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
        note: 'Requires Certificate of Origin (RCEP Form)',
      },
      {
        agreement: 'CPTPP',
        agreement_full_name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AHKFTA',
        agreement_full_name: 'ASEAN Hong Kong Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MPCEPA',
        agreement_full_name: 'Malaysia Pakistan Closer Economic Partnership Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AJCEP',
        agreement_full_name: 'ASEAN Japan Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MICECA',
        agreement_full_name: 'Malaysia India Comprehensive Economic Cooperation Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MNZFTA',
        agreement_full_name: 'Malaysia New Zealand Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'D8PTA',
        agreement_full_name: 'Developing Eight (D-8) Preferential Tariff Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MCFTA',
        agreement_full_name: 'Malaysia Chile Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MAFTA',
        agreement_full_name: 'Malaysia Australia Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MTFTA',
        agreement_full_name: 'Malaysia Turkey Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'TPS-OIC',
        agreement_full_name: 'Trade Preferential System among the Member States of the Organisation of the Islamic Conference',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MY-UAE-CEPA',
        agreement_full_name: 'Malaysia United Arab Emirates Comprehensive Economic Partnership Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
    ],
    import_requirements: {
      import_license_required: false,
      permit_required: false,
      controlled_item: false,
      prohibited: false,
      notes: 'Subject to anti-dumping duties under certain conditions. Check current trade remedy status.',
    },
    last_updated: '2024-12-01',
  },
  {
    hs_code: {
      code: '8517',
      description: 'Telephone sets, including telephones for cellular networks or for other wireless networks',
      category: 'Electronics',
      unit: 'units',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 10.0,
        rate_type: 'percentage',
        effective_date: '2024-01-01',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN-China Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AHKFTA',
        agreement_full_name: 'ASEAN-Hong Kong Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
    ],
    import_requirements: {
      import_license_required: true,
      license_issuing_authority: 'SIRIM',
      license_type: 'SIRIM Type Approval',
      permit_required: true,
      controlled_item: true,
      prohibited: false,
      special_requirements: ['SIRIM type approval required', 'Products must meet Malaysian standards'],
      contact_url: 'https://www.sirim.my',
      notes: 'Telecommunications equipment requires SIRIM approval for import and sale in Malaysia.',
    },
    last_updated: '2024-12-01',
  },
  {
    hs_code: {
      code: '3903',
      description: 'Polymers of propylene or of other olefins, in primary forms',
      category: 'Chemicals',
      unit: 'kg',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 5.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN-China Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AKFTA',
        agreement_full_name: 'ASEAN-Korea Free Trade Agreement',
        rate: 5.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AANZFTA',
        agreement_full_name: 'ASEAN-Australia-New Zealand Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
    ],
  },
  {
    hs_code: {
      code: '6109',
      description: 'T-shirts, singlets and other vests, knitted or crocheted',
      category: 'Textiles & Apparel',
      unit: 'pieces',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 30.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN-China Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MICECA',
        agreement_full_name: 'Malaysia-India Comprehensive Economic Cooperation Agreement',
        rate: 15.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 15.0,
        rate_type: 'percentage',
      },
    ],
  },
  {
    hs_code: {
      code: '8704',
      description: 'Motor vehicles for the transport of goods',
      category: 'Automotive',
      unit: 'units',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 30.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN-China Free Trade Agreement',
        rate: 20.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AHKFTA',
        agreement_full_name: 'ASEAN-Hong Kong Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'CPTPP',
        agreement_full_name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
        rate: 15.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 15.0,
        rate_type: 'percentage',
      },
    ],
  },
  // HS Code 7201 - Pig iron and spiegeleisen in pigs, blocks or other primary forms
  {
    hs_code: {
      code: '7201',
      description: 'Pig iron and spiegeleisen in pigs, blocks or other primary forms (Non-alloy pig iron)',
      category: 'Steel & Metals',
      unit: 'kg',
    },
    tariffs: [
      {
        agreement: 'PDK 2024',
        agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)',
        rate: 0.0,
        rate_type: 'percentage',
        effective_date: '2024-01-01',
      },
      {
        agreement: 'ATIGA',
        agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'ACFTA',
        agreement_full_name: 'ASEAN China Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'RCEP',
        agreement_full_name: 'Regional Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AHKFTA',
        agreement_full_name: 'ASEAN Hong Kong Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MPCEPA',
        agreement_full_name: 'Malaysia Pakistan Closer Economic Partnership Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AKFTA',
        agreement_full_name: 'ASEAN Korea Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AJCEP',
        agreement_full_name: 'ASEAN Japan Comprehensive Economic Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AANZFTA',
        agreement_full_name: 'ASEAN Australia New Zealand Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'AINDFTA',
        agreement_full_name: 'ASEAN India Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MNZFTA',
        agreement_full_name: 'Malaysia New Zealand Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MICECA',
        agreement_full_name: 'Malaysia India Comprehensive Economic Cooperation Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'D8PTA',
        agreement_full_name: 'Developing Eight (D-8) Preferential Tariff Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MCFTA',
        agreement_full_name: 'Malaysia Chile Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MAFTA',
        agreement_full_name: 'Malaysia Australia Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MTFTA',
        agreement_full_name: 'Malaysia Turkey Free Trade Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'CPTPP',
        agreement_full_name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'TPS-OIC',
        agreement_full_name: 'Trade Preferential System among the Member States of the Organisation of the Islamic Conference',
        rate: 0.0,
        rate_type: 'percentage',
      },
      {
        agreement: 'MY-UAE-CEPA',
        agreement_full_name: 'Malaysia United Arab Emirates Comprehensive Economic Partnership Agreement',
        rate: 0.0,
        rate_type: 'percentage',
      },
    ],
    import_requirements: {
      import_license_required: false,
      permit_required: false,
      controlled_item: false,
      prohibited: false,
      notes: 'Steel ingots - basic steel products. Check for trade remedy measures.',
    },
    last_updated: '2024-12-01',
  },
];

/**
 * Search for HS codes by code or description
 */
export function searchHSCodes(query: string): HSCodeTariff[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();

  return HS_CODE_DATABASE.filter(item =>
    item.hs_code.code.toLowerCase().includes(lowerQuery) ||
    item.hs_code.description.toLowerCase().includes(lowerQuery) ||
    item.hs_code.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Find HS code by exact code match
 */
export function findHSCode(code: string): HSCodeTariff | null {
  return HS_CODE_DATABASE.find(item => item.hs_code.code === code) || null;
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(HS_CODE_DATABASE.map(item => item.hs_code.category));
  return Array.from(categories);
}

/**
 * Get HS codes by category
 */
export function getHSCodesByCategory(category: string): HSCodeTariff[] {
  return HS_CODE_DATABASE.filter(item => item.hs_code.category === category);
}

/**
 * Get HS codes that require import licenses
 */
export function getLicenseRequiredHSCodes(): HSCodeTariff[] {
  return HS_CODE_DATABASE.filter(item => item.import_requirements?.import_license_required);
}

/**
 * Get HS codes by licensing authority
 */
export function getHSCodesByAuthority(authority: string): HSCodeTariff[] {
  return HS_CODE_DATABASE.filter(item => item.import_requirements?.license_issuing_authority === authority);
}

/**
 * Get all unique licensing authorities
 */
export function getLicensingAuthorities(): string[] {
  const authorities = new Set<string>();
  HS_CODE_DATABASE.forEach(item => {
    if (item.import_requirements?.license_issuing_authority) {
      authorities.add(item.import_requirements.license_issuing_authority);
    }
  });
  return Array.from(authorities).sort();
}

