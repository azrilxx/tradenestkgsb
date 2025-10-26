/**
 * MATRADE Dataset Configuration
 * Top priority datasets for TradeNest integration
 */

export const PRIORITY_DATASETS = [
  // TOP 5 COMPANY DATASETS - HIGHEST PRIORITY
  {
    id: 'ee-parts',
    name: 'E&E Parts & Components',
    sector: 'Electronics & Electrical',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-e-e-parts-and-components',
    priority: 1,
    type: 'company'
  },
  {
    id: 'palm-oil',
    name: 'Palm Oil Products',
    sector: 'Palm Oil & Oleochemicals',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-palm-oil-products',
    priority: 1,
    type: 'company'
  },
  {
    id: 'automotive',
    name: 'Automotive Parts & Components',
    sector: 'Automotive & Parts',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-in-of-automotive-parts-components',
    priority: 1,
    type: 'company'
  },
  {
    id: 'chemicals',
    name: 'Chemicals, Minerals & Alloys',
    sector: 'Chemicals & Petrochemicals',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-chemicals-minerals-alloys',
    priority: 1,
    type: 'company'
  },
  {
    id: 'pharma',
    name: 'Pharmaceutical, Toiletries & Cosmetics',
    sector: 'Pharmaceuticals & Healthcare',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-pharmaceutical-toiletries-cosmetics',
    priority: 1,
    type: 'company'
  },

  // ADDITIONAL HIGH-VALUE SECTORS
  {
    id: 'medical',
    name: 'Medical Products',
    sector: 'Medical Devices & Healthcare',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-medical-products',
    priority: 2,
    type: 'company'
  },
  {
    id: 'food',
    name: 'Prepared Food',
    sector: 'Food & Beverage',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-prepared-food',
    priority: 2,
    type: 'company'
  },
  {
    id: 'rubber',
    name: 'Rubber Products',
    sector: 'Rubber & Latex',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-rubber-products',
    priority: 2,
    type: 'company'
  },
  {
    id: 'plastic',
    name: 'Plastic Products',
    sector: 'Plastics & Polymers',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-plastic-products',
    priority: 2,
    type: 'company'
  },
  {
    id: 'oil-gas',
    name: 'Oil & Gas Products',
    sector: 'Oil & Gas',
    url: 'http://archive.data.gov.my/data/en_US/dataset/statistics-on-malaysian-companies-registered-with-matrade-of-oil-and-gas-products',
    priority: 2,
    type: 'company'
  },

  // TRADE STATISTICS - CRITICAL FOR SHIPMENT GENERATION
  {
    id: 'export-geo',
    name: 'Exports By Geographical Region',
    sector: 'Trade Statistics',
    url: 'https://archive.data.gov.my/data/en_US/dataset/malaysias-export-by-geographical-region',
    priority: 1,
    type: 'trade-stats'
  },
  {
    id: 'import-geo',
    name: 'Imports By Geographical Region',
    sector: 'Trade Statistics',
    url: 'http://archive.data.gov.my/data/en_US/dataset/malaysia-s-import-by-geographical-region',
    priority: 1,
    type: 'trade-stats'
  },
  {
    id: 'export-sitc',
    name: 'Exports By SITC 1 Digit',
    sector: 'Trade Statistics',
    url: 'http://archive.data.gov.my/data/en_US/dataset/malaysia-s-export-by-sitc-1-digit',
    priority: 2,
    type: 'trade-stats'
  },
  {
    id: 'import-sitc',
    name: 'Imports By SITC 1 Digit',
    sector: 'Trade Statistics',
    url: 'http://archive.data.gov.my/data/en_US/dataset/malaysia-s-import-by-by-sitc-1-digit',
    priority: 2,
    type: 'trade-stats'
  },
  {
    id: 'trade-summary',
    name: 'Summary of Malaysia Trade',
    sector: 'Trade Statistics',
    url: 'http://archive.data.gov.my/data/en_US/dataset/summary-of-malaysia-s-trade',
    priority: 1,
    type: 'trade-stats'
  }
];

// Field mapping for company datasets
export const COMPANY_FIELD_MAPPING = {
  // Common field variations in MATRADE datasets
  'company_name': ['Company Name', 'Name', 'Company', 'Organization'],
  'address': ['Address', 'Office Address', 'Location', 'Registered Address'],
  'state': ['State', 'Negeri', 'Location'],
  'postcode': ['Postcode', 'Postal Code', 'Poskod'],
  'telephone': ['Telephone', 'Tel', 'Phone', 'Contact No', 'Tel No'],
  'fax': ['Fax', 'Fax No'],
  'email': ['Email', 'E-mail', 'Email Address'],
  'website': ['Website', 'Web', 'URL', 'Homepage'],
  'contact_person': ['Contact Person', 'Person In Charge', 'PIC'],
  'products': ['Products', 'Product/Service', 'Main Products', 'Products/Services'],
  'year_established': ['Year Established', 'Year Est', 'Established'],
  'registration_no': ['Registration No', 'Reg No', 'Company No', 'SSM No']
};

// Malaysian states mapping
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya'
];
