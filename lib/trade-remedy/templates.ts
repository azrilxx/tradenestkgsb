// Trade Remedy Templates
// Task 7.2: Pre-filled forms for common products

export interface TradeRemedyTemplate {
  id: string;
  name: string;
  category: 'steel' | 'chemicals' | 'electronics' | 'textiles' | 'food';
  description: string;
  formData: {
    caseName: string;
    petitionerName: string;
    subjectProduct: string;
    hsCode: string;
    countryOfOrigin: string;
    exportPrice: string;
    normalValue: string;
    importVolumeCurrent: string;
    importVolumePrevious: string;
    domesticMarketShare: string;
    currency: string;
  };
  exampleCalculation: {
    dumpingMargin: number;
    description: string;
  };
}

export const TRADE_REMEDY_TEMPLATES: TradeRemedyTemplate[] = [
  {
    id: 'steel-flat-rolled',
    name: 'Steel - Flat-Rolled Products (Anti-Dumping)',
    category: 'steel',
    description:
      'Template for anti-dumping investigation on flat-rolled steel products from China',
    formData: {
      caseName: 'Anti-Dumping Investigation - Flat-Rolled Steel from China',
      petitionerName: 'MegaSteel Industries Sdn Bhd',
      subjectProduct: 'Flat-rolled steel products (HS Codes: 7208, 7214)',
      hsCode: '7208',
      countryOfOrigin: 'China',
      exportPrice: '500',
      normalValue: '850',
      importVolumeCurrent: '1000000',
      importVolumePrevious: '600000',
      domesticMarketShare: '30',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 41.18,
      description:
        'Typical dumping margins for Chinese steel range from 30-50% due to overcapacity and subsidies.',
    },
  },
  {
    id: 'chemicals-polymers',
    name: 'Chemicals - Polymers (Anti-Dumping)',
    category: 'chemicals',
    description:
      'Template for anti-dumping investigation on polymer products and specialty chemicals',
    formData: {
      caseName: 'Anti-Dumping Investigation - Polymers from China',
      petitionerName: 'PetroChemAsia Sdn Bhd',
      subjectProduct: 'Polymers and specialty chemicals (HS Codes: 3901, 2902)',
      hsCode: '3901',
      countryOfOrigin: 'China',
      exportPrice: '650',
      normalValue: '950',
      importVolumeCurrent: '800000',
      importVolumePrevious: '500000',
      domesticMarketShare: '25',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 31.58,
      description:
        'Chemicals sector often shows 25-40% dumping margins due to China\'s industrial policy subsidies.',
    },
  },
  {
    id: 'electronics-components',
    name: 'Electronics - Integrated Circuits',
    category: 'electronics',
    description:
      'Template for countervailing duty investigation on electronic components',
    formData: {
      caseName: 'Countervailing Duty Investigation - IC Components',
      petitionerName: 'TechCom Solutions Sdn Bhd',
      subjectProduct: 'Integrated circuits and semiconductor components (HS: 8542)',
      hsCode: '8542',
      countryOfOrigin: 'China',
      exportPrice: '15',
      normalValue: '22',
      importVolumeCurrent: '50000000',
      importVolumePrevious: '35000000',
      domesticMarketShare: '20',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 31.82,
      description:
        'Semiconductor components may show 30-40% dumping margins with alleged subsidies from China.',
    },
  },
  {
    id: 'textiles-apparel',
    name: 'Textiles - Cotton Yarn',
    category: 'textiles',
    description:
      'Template for anti-dumping investigation on cotton yarn and textile products',
    formData: {
      caseName: 'Anti-Dumping Investigation - Cotton Yarn',
      petitionerName: 'Malaysian Textile Mills Berhad',
      subjectProduct: 'Cotton yarn and textile products (HS: 5205)',
      hsCode: '5205',
      countryOfOrigin: 'India',
      exportPrice: '8',
      normalValue: '12',
      importVolumeCurrent: '5000000',
      importVolumePrevious: '3000000',
      domesticMarketShare: '35',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 33.33,
      description:
        'Textile dumping margins typically 25-40% due to lower labor costs in source countries.',
    },
  },
  {
    id: 'food-palm-oil',
    name: 'Food - Refined Palm Oil',
    category: 'food',
    description:
      'Template for safeguard measure investigation on palm oil products',
    formData: {
      caseName: 'Safeguard Measure - Refined Palm Oil',
      petitionerName: 'AgroTrade Malaysia Sdn Bhd',
      subjectProduct: 'Refined palm oil products (HS: 1511, 1513)',
      hsCode: '1511',
      countryOfOrigin: 'Indonesia',
      exportPrice: '700',
      normalValue: '750',
      importVolumeCurrent: '2000000',
      importVolumePrevious: '1200000',
      domesticMarketShare: '40',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 6.67,
      description:
        'Lower dumping margins in food sector (5-15%) but volume impact may be significant.',
    },
  },
];

export function getTemplateById(id: string): TradeRemedyTemplate | undefined {
  return TRADE_REMEDY_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: TradeRemedyTemplate['category']
): TradeRemedyTemplate[] {
  return TRADE_REMEDY_TEMPLATES.filter((t) => t.category === category);
}

