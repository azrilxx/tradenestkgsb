// Enhanced Gazette Data with Industry Impact Fields
// Migration 015: Premium Gazette Dashboard

export const enhancedGazettes = [
  // Steel & Metals Sector
  {
    gazette_number: 'P.U.(A) 123/2024',
    publication_date: '2024-01-15',
    category: 'anti_dumping',
    title: 'Notice of Anti-Dumping Investigation on Steel Imports from China',
    summary: 'Malaysian authorities announce preliminary affirmative determination in anti-dumping investigation concerning imports of certain flat-rolled steel products from China, India, and Vietnam. Dumping margins range from 15.3% to 42.7%.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Steel & Metals',
    estimated_impact_value: 125000000,
    duty_rate_min: 15.3,
    duty_rate_max: 42.7,
    affected_items: [
      {
        hs_codes: ['7208', '7214'],
        affected_countries: ['CN', 'IN', 'VN'],
        summary: 'Flat-rolled steel products subject to preliminary anti-dumping measures',
        remedy_type: 'anti_dumping',
        expiry_date: '2025-01-15',
        duty_rate: 28.5,
        affected_companies_count: 47,
      },
    ],
    sector_impacts: [
      {
        sector: 'Steel & Metals',
        affected_hs_codes: ['7208', '7214'],
        estimated_import_value: 125000000,
        companies_affected: 47,
        duty_rate_range: '15.3% - 42.7%',
      },
    ],
  },

  // Electronics Sector
  {
    gazette_number: 'P.U.(A) 156/2024',
    publication_date: '2024-02-20',
    category: 'tariff_change',
    title: 'Customs Duties Amendment (Import Duties) Order 2024',
    summary: 'Amendment to import duties on electronic components and integrated circuits. Rate changes effective March 1, 2024. Adjustments apply to HS Codes under Chapter 85 (Electrical machinery and equipment).',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Electronics',
    estimated_impact_value: 89000000,
    duty_rate_min: 6.0,
    duty_rate_max: 10.0,
    affected_items: [
      {
        hs_codes: ['8542', '8471', '8517'],
        affected_countries: ['All'],
        summary: 'Tariff rate reduction on electronic components',
        remedy_type: null,
        expiry_date: null,
        duty_rate: 8.0,
        affected_companies_count: 123,
      },
    ],
    sector_impacts: [
      {
        sector: 'Electronics',
        affected_hs_codes: ['8542', '8471', '8517'],
        estimated_import_value: 89000000,
        companies_affected: 123,
        duty_rate_range: '6% - 10%',
      },
    ],
  },

  // Food & Beverages Sector
  {
    gazette_number: 'P.U.(A) 189/2024',
    publication_date: '2024-03-10',
    category: 'trade_remedy',
    title: 'Safeguard Measure on Palm Oil Imports',
    summary: 'Malaysia imposes safeguard measures on certain palm oil products to protect domestic industry. Temporary safeguard duty of 10% applied for 3 years. Affects imports from Indonesia and Thailand.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Food & Beverages',
    estimated_impact_value: 45000000,
    duty_rate_min: 8.0,
    duty_rate_max: 12.0,
    affected_items: [
      {
        hs_codes: ['1511', '1513'],
        affected_countries: ['ID', 'TH'],
        summary: 'Safeguard measures on palm oil products',
        remedy_type: 'safeguard',
        expiry_date: '2027-03-10',
        duty_rate: 10.0,
        affected_companies_count: 28,
      },
    ],
    sector_impacts: [
      {
        sector: 'Food & Beverages',
        affected_hs_codes: ['1511', '1513'],
        estimated_import_value: 45000000,
        companies_affected: 28,
        duty_rate_range: '8% - 12%',
      },
    ],
  },

  // Chemicals Sector
  {
    gazette_number: 'P.U.(A) 212/2024',
    publication_date: '2024-04-05',
    category: 'anti_dumping',
    title: 'Final Determination - Anti-Dumping on Chemicals from China',
    summary: 'Final affirmative determination in anti-dumping investigation concerning certain chemical products from China. Final dumping margins established at 28.5%. Measures to be imposed for 5 years.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Chemicals & Petrochemicals',
    estimated_impact_value: 67000000,
    duty_rate_min: 25.0,
    duty_rate_max: 32.0,
    affected_items: [
      {
        hs_codes: ['2902', '3901'],
        affected_countries: ['CN'],
        summary: 'Final anti-dumping measures on chemical products',
        remedy_type: 'anti_dumping',
        expiry_date: '2029-05-12',
        duty_rate: 28.5,
        affected_companies_count: 31,
      },
    ],
    sector_impacts: [
      {
        sector: 'Chemicals & Petrochemicals',
        affected_hs_codes: ['2902', '3901'],
        estimated_import_value: 67000000,
        companies_affected: 31,
        duty_rate_range: '25% - 32%',
      },
    ],
  },

  // Automotive Sector
  {
    gazette_number: 'P.U.(A) 245/2024',
    publication_date: '2024-05-12',
    category: 'tariff_change',
    title: 'ASEAN-China Free Trade Area (ACFTA) Tariff Reduction',
    summary: 'Further tariff reduction under ACFTA framework. Rates reduced on automotive parts, textiles, and consumer goods. Applied to ASEAN-origin goods from China and vice versa.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Automotive',
    estimated_impact_value: 210000000,
    duty_rate_min: 0.0,
    duty_rate_max: 5.0,
    affected_items: [
      {
        hs_codes: ['8708', '8701', '8703'],
        affected_countries: ['CN', 'ASEAN'],
        summary: 'ACFTA tariff reduction on automotive parts',
        remedy_type: null,
        expiry_date: null,
        duty_rate: 2.5,
        affected_companies_count: 89,
      },
    ],
    sector_impacts: [
      {
        sector: 'Automotive',
        affected_hs_codes: ['8708', '8701', '8703'],
        estimated_import_value: 210000000,
        companies_affected: 89,
        duty_rate_range: '0% - 5%',
      },
    ],
  },

  // Textiles Sector
  {
    gazette_number: 'P.U.(A) 278/2024',
    publication_date: '2024-06-18',
    category: 'anti_dumping',
    title: 'Anti-Dumping Investigation on Textile Imports',
    summary: 'Initiation of anti-dumping investigation on certain textile products from Bangladesh and Vietnam. Alleged dumping margins of 10-25%. Investigation period covers 2022-2024.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Textiles & Apparel',
    estimated_impact_value: 56000000,
    duty_rate_min: 10.0,
    duty_rate_max: 25.0,
    affected_items: [
      {
        hs_codes: ['5205', '5309', '5407'],
        affected_countries: ['BD', 'VN'],
        summary: 'Anti-dumping investigation on textile products',
        remedy_type: 'anti_dumping',
        expiry_date: null,
        duty_rate: 17.5,
        affected_companies_count: 45,
      },
    ],
    sector_impacts: [
      {
        sector: 'Textiles & Apparel',
        affected_hs_codes: ['5205', '5309', '5407'],
        estimated_import_value: 56000000,
        companies_affected: 45,
        duty_rate_range: '10% - 25%',
      },
    ],
  },

  // Furniture & Wood Sector
  {
    gazette_number: 'P.U.(A) 301/2024',
    publication_date: '2024-07-25',
    category: 'import_restriction',
    title: 'Import Ban on Single-Use Plastics',
    summary: 'Import restriction on certain single-use plastic products to support Malaysia\'s plastic waste reduction initiative. Affects plastic bags, straws, and disposable food containers.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Furniture & Wood',
    estimated_impact_value: 34000000,
    duty_rate_min: 0.0,
    duty_rate_max: 0.0,
    affected_items: [
      {
        hs_codes: ['3923', '3915'],
        affected_countries: ['All'],
        summary: 'Import ban on single-use plastic products',
        remedy_type: 'import_ban',
        expiry_date: null,
        duty_rate: 0.0,
        affected_companies_count: 67,
      },
    ],
    sector_impacts: [
      {
        sector: 'Furniture & Wood',
        affected_hs_codes: ['3923', '3915'],
        estimated_import_value: 34000000,
        companies_affected: 67,
        duty_rate_range: 'Import Ban',
      },
    ],
  },

  // Medical Products Sector
  {
    gazette_number: 'P.U.(A) 334/2024',
    publication_date: '2024-08-14',
    category: 'tariff_change',
    title: 'Medical Devices Tariff Exemption',
    summary: 'Tariff exemption for imported medical devices and equipment under healthcare modernization initiative. Applies to diagnostic equipment, surgical instruments, and hospital supplies.',
    pdf_url: 'https://lom.agc.gov.my',
    sector: 'Medical Products',
    estimated_impact_value: 112000000,
    duty_rate_min: 0.0,
    duty_rate_max: 3.0,
    affected_items: [
      {
        hs_codes: ['9018', '9021', '3004'],
        affected_countries: ['All'],
        summary: 'Tariff exemption on medical devices',
        remedy_type: null,
        expiry_date: null,
        duty_rate: 0.0,
        affected_companies_count: 102,
      },
    ],
    sector_impacts: [
      {
        sector: 'Medical Products',
        affected_hs_codes: ['9018', '9021', '3004'],
        estimated_import_value: 112000000,
        companies_affected: 102,
        duty_rate_range: '0% - 3%',
      },
    ],
  },
];

