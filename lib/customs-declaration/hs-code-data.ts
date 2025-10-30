/**
 * HS Code Database with Tariff Rates
 * Based on Malaysian Customs HS Explorer (EZHS) functionality
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
}

export interface HSCodeTariff {
  hs_code: HSCodeInfo;
  tariffs: TariffRate[];
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
        agreement: 'PDK 2022',
        agreement_full_name: 'Perintah Duti Kastam 2022 (MFN)',
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
    ],
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
        agreement: 'PDK 2022',
        agreement_full_name: 'Perintah Duti Kastam 2022 (MFN)',
        rate: 10.0,
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
        agreement: 'PDK 2022',
        agreement_full_name: 'Perintah Duti Kastam 2022 (MFN)',
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
        agreement: 'PDK 2022',
        agreement_full_name: 'Perintah Duti Kastam 2022 (MFN)',
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
        agreement: 'PDK 2022',
        agreement_full_name: 'Perintah Duti Kastam 2022 (MFN)',
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

