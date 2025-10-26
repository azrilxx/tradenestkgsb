// Mock Malaysian Federal Gazette Data
// Task 7.1: Gazette Tracker Demo Data

export const mockGazettes = [
  {
    gazette_number: 'P.U.(A) 123/2024',
    publication_date: '2024-01-15',
    category: 'anti_dumping',
    title: 'Notice of Anti-Dumping Investigation on Steel Imports from China',
    summary:
      'Malaysian authorities announce preliminary affirmative determination in anti-dumping investigation concerning imports of certain flat-rolled steel products from China, India, and Vietnam. Dumping margins range from 15.3% to 42.7%.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      investigation_number: 'AD/01/2024',
      subject_product: 'Flat-rolled steel products (HS Codes: 7208, 7214)',
      countries: ['China', 'India', 'Vietnam'],
      preliminary_margin: '15.3% - 42.7%',
      injury_findings: true,
    },
    affected_items: [
      {
        hs_codes: ['7208', '7214'],
        affected_countries: ['CN', 'IN', 'VN'],
        summary: 'Flat-rolled steel products subject to preliminary anti-dumping measures',
        remedy_type: 'anti_dumping',
        expiry_date: '2025-01-15',
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 156/2024',
    publication_date: '2024-02-20',
    category: 'tariff_change',
    title: 'Customs Duties Amendment (Import Duties) Order 2024',
    summary:
      'Amendment to import duties on electronic components and integrated circuits. Rate changes effective March 1, 2024. Adjustments apply to HS Codes under Chapter 85 (Electrical machinery and equipment).',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      effective_date: '2024-03-01',
      affected_chapters: ['85'],
      hs_codes: ['8542', '8471', '8517'],
      tariff_changes: 'Rate adjustment from 10% to 8%',
    },
    affected_items: [
      {
        hs_codes: ['8542', '8471', '8517'],
        affected_countries: ['All'],
        summary: 'Tariff rate reduction on electronic components',
        remedy_type: null,
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 189/2024',
    publication_date: '2024-03-10',
    category: 'trade_remedy',
    title: 'Safeguard Measure on Palm Oil Imports',
    summary:
      'Malaysia imposes safeguard measures on certain palm oil products to protect domestic industry. Temporary safeguard duty of 10% applied for 3 years. Affects imports from Indonesia and Thailand.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      measure_type: 'safeguard',
      product: 'Palm oil and palm oil products',
      countries: ['Indonesia', 'Thailand'],
      safeguard_duty: '10%',
      duration: '3 years',
      expiry_date: '2027-03-10',
    },
    affected_items: [
      {
        hs_codes: ['1511', '1513'],
        affected_countries: ['ID', 'TH'],
        summary: 'Safeguard measures on palm oil products',
        remedy_type: 'safeguard',
        expiry_date: '2027-03-10',
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 212/2024',
    publication_date: '2024-04-05',
    category: 'import_restriction',
    title: 'Restriction on Import of Electronic Waste',
    summary:
      'New import restriction on electronic waste (e-waste) to strengthen environmental protection. Imports of certain electronic waste categories now require prior approval from Department of Environment.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      restriction_type: 'prior_approval',
      product_category: 'Electronic waste',
      hs_codes: ['8548', '8519'],
      authority: 'Department of Environment',
      effective_date: '2024-05-01',
    },
    affected_items: [
      {
        hs_codes: ['8548', '8519'],
        affected_countries: ['All'],
        summary: 'Import restriction on electronic waste products',
        remedy_type: null,
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 245/2024',
    publication_date: '2024-05-12',
    category: 'anti_dumping',
    title: 'Final Determination - Anti-Dumping on Chemicals from China',
    summary:
      'Final affirmative determination in anti-dumping investigation concerning certain chemical products from China. Final dumping margins established at 28.5%. Measures to be imposed for 5 years.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      investigation_status: 'final_determination',
      subject_product: 'Certain chemical products (HS: 2902, 3901)',
      country: 'China',
      final_margin: '28.5%',
      duration: '5 years',
      expiry_date: '2029-05-12',
    },
    affected_items: [
      {
        hs_codes: ['2902', '3901'],
        affected_countries: ['CN'],
        summary: 'Final anti-dumping measures on chemical products',
        remedy_type: 'anti_dumping',
        expiry_date: '2029-05-12',
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 278/2024',
    publication_date: '2024-06-18',
    category: 'tariff_change',
    title: 'ASEAN-China Free Trade Area (ACFTA) Tariff Reduction',
    summary:
      'Further tariff reduction under ACFTA framework. Rates reduced on automotive parts, textiles, and consumer goods. Applied to ASEAN-origin goods from China and vice versa.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      trade_agreement: 'ACFTA',
      effective_date: '2024-07-01',
      affected_products: ['Automotive parts', 'Textiles', 'Consumer goods'],
      tariff_change: 'Additional 0-2% reduction',
    },
    affected_items: [
      {
        hs_codes: ['8708', '5205', '6109'],
        affected_countries: ['CN', 'ASEAN'],
        summary: 'ACFTA tariff reduction on various products',
        remedy_type: null,
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 301/2024',
    publication_date: '2024-07-25',
    category: 'trade_remedy',
    title: 'Countervailing Duty Investigation on Steel Products',
    summary:
      'Initiation of countervailing duty investigation on certain steel products from India and Vietnam. Alleged subsidy margins of 8-15%. Investigation period: 2023-2024.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      investigation_type: 'countervailing_duty',
      product: 'Certain steel products',
      countries: ['India', 'Vietnam'],
      alleged_subsidies: '8-15%',
      injury_period: '2023-2024',
    },
    affected_items: [
      {
        hs_codes: ['7208', '7214', '7304'],
        affected_countries: ['IN', 'VN'],
        summary: 'Countervailing duty investigation on steel products',
        remedy_type: 'countervailing_duty',
        expiry_date: null,
      },
    ],
  },
  {
    gazette_number: 'P.U.(A) 334/2024',
    publication_date: '2024-08-14',
    category: 'import_restriction',
    title: 'Import Ban on Single-Use Plastics',
    summary:
      'Import restriction on certain single-use plastic products to support Malaysia\'s plastic waste reduction initiative. Affects plastic bags, straws, and disposable food containers.',
    pdf_url: 'https://lom.agc.gov.my',
    extracted_data: {
      restriction_type: 'import_ban',
      effective_date: '2025-01-01',
      product_category: 'Single-use plastics',
      hs_codes: ['3923', '3915'],
      purpose: 'Environmental protection',
    },
    affected_items: [
      {
        hs_codes: ['3923', '3915'],
        affected_countries: ['All'],
        summary: 'Import ban on single-use plastic products',
        remedy_type: null,
      },
    ],
  },
];

// Seed function
export async function seedGazetteData() {
  const response = await fetch('/api/gazette', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mockGazettes[0]),
  });
  return await response.json();
}

