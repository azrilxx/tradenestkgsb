// Steel-Specific Trade Remedy Templates
// Task 1.3: Create 10 steel-specific templates for Malaysian steel industry

import { TradeRemedyTemplate } from './templates';

export const STEEL_TRADE_REMEDY_TEMPLATES: TradeRemedyTemplate[] = [
  // 1. Flat-rolled steel (HS 7208) - Chinese dumping
  {
    id: 'steel-flat-rolled-china-dumping',
    name: 'Flat-Rolled Steel - Chinese Dumping',
    category: 'steel',
    description: 'Anti-dumping investigation template for Chinese flat-rolled steel products. Addresses critical MITI priority for flat-rolled steel.',
    formData: {
      caseName: 'Anti-Dumping Investigation - Flat-Rolled Steel from China',
      petitionerName: 'MegaSteel Industries Sdn Bhd',
      subjectProduct: 'Flat-rolled steel products (cold-rolled, hot-rolled)',
      hsCode: '7208',
      countryOfOrigin: 'China',
      exportPrice: '520',
      normalValue: '875',
      importVolumeCurrent: '1250000',
      importVolumePrevious: '750000',
      domesticMarketShare: '32',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 40.46,
      description: 'Chinese flat-rolled steel showing 40%+ dumping margin due to overcapacity and state subsidies. Critical MITI priority requiring immediate anti-dumping investigation.',
    },
  },

  // 2. Rebar (HS 7214) - Price depression
  {
    id: 'steel-rebar-price-depression',
    name: 'Rebar - Price Depression Investigation',
    category: 'steel',
    description: 'Anti-dumping case for Chinese rebar causing material injury through price depression.',
    formData: {
      caseName: 'Anti-Dumping Investigation - Reinforcing Bars from China',
      petitionerName: 'Malaysian Steel Mills Berhad',
      subjectProduct: 'Reinforcing bars (rebar) for construction',
      hsCode: '7214',
      countryOfOrigin: 'China',
      exportPrice: '480',
      normalValue: '720',
      importVolumeCurrent: '980000',
      importVolumePrevious: '650000',
      domesticMarketShare: '28',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 33.33,
      description: 'Chinese rebar dumped at 33% below normal value, causing severe price depression in Malaysian construction market. High priority MITI issue.',
    },
  },

  // 3. Wire rod (HS 7213) - Volume surge
  {
    id: 'steel-wire-rod-volume-surge',
    name: 'Wire Rod - Volume Surge Investigation',
    category: 'steel',
    description: 'Safeguard measure investigation for sudden surge in wire rod imports.',
    formData: {
      caseName: 'Safeguard Investigation - Wire Rod Imports',
      petitionerName: 'WireSteel Manufacturing Sdn Bhd',
      subjectProduct: 'Wire rods and wire products',
      hsCode: '7213',
      countryOfOrigin: 'China, Turkey',
      exportPrice: '485',
      normalValue: '0',
      importVolumeCurrent: '1450000',
      importVolumePrevious: '850000',
      domesticMarketShare: '35',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 0,
      description: '70% volume surge in wire rod imports over one year, causing threatened injury to domestic producers. MITI requires safeguard measures.',
    },
  },

  // 4. Stainless steel (HS 7219) - Safeguard measures
  {
    id: 'steel-stainless-safeguard',
    name: 'Stainless Steel - Safeguard Measures',
    category: 'steel',
    description: 'Safeguard investigation for stainless steel flat products under MITI monitoring.',
    formData: {
      caseName: 'Safeguard Investigation - Stainless Steel Flat Products',
      petitionerName: 'StainlessSteel Asia Sdn Bhd',
      subjectProduct: 'Stainless steel flat products (sheets, plates)',
      hsCode: '7219',
      countryOfOrigin: 'China, South Korea',
      exportPrice: '1250',
      normalValue: '0',
      importVolumeCurrent: '3200000',
      importVolumePrevious: '2100000',
      domesticMarketShare: '42',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 0,
      description: 'Significant increase in stainless steel imports threatening domestic industry. MITI has this under active monitoring for potential safeguard measures.',
    },
  },

  // 5. Coated steel (HS 7210) - Origin manipulation
  {
    id: 'steel-coated-origin-manipulation',
    name: 'Coated Steel - Origin Manipulation',
    category: 'steel',
    description: 'Anti-circumvention investigation for coated steel with suspected origin manipulation.',
    formData: {
      caseName: 'Anti-Circumvention Investigation - Coated Direct Steel',
      petitionerName: 'CoatedSteel Solutions Sdn Bhd',
      subjectProduct: 'Galvanized and coated steel products',
      hsCode: '7210',
      countryOfOrigin: 'China',
      exportPrice: '680',
      normalValue: '950',
      importVolumeCurrent: '2100000',
      importVolumePrevious: '1650000',
      domesticMarketShare: '38',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 28.42,
      description: 'Suspected origin manipulation with Chinese coated steel routed through third countries. 28% dumping margin detected.',
    },
  },

  // 6. Steel pipes (HS 7304) - Anti-circumvention
  {
    id: 'steel-pipes-anti-circumvention',
    name: 'Steel Pipes - Anti-Circumvention',
    category: 'steel',
    description: 'Anti-circumvention case for steel pipes attempting to evade duties.',
    formData: {
      caseName: 'Anti-Circumvention Investigation - Steel Pipes',
      petitionerName: 'PipeTech Industries Sdn Bhd',
      subjectProduct: 'Steel pipes, tubes and hollow sections',
      hsCode: '7304',
      countryOfOrigin: 'China, Vietnam',
      exportPrice: '850',
      normalValue: '1150',
      importVolumeCurrent: '1800000',
      importVolumePrevious: '1200000',
      domesticMarketShare: '40',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 26.09,
      description: 'Anti-circumvention investigation needed as Chinese pipes routed through Vietnam to avoid duties. 26% dumping margin.',
    },
  },

  // 7. Steel plates (HS 7208) - Material injury
  {
    id: 'steel-plates느 material-injury',
    name: 'Steel Plates - Material Injury',
    category: 'steel',
    description: 'Anti-dumping investigation showing material injury from Chinese steel plates.',
    formData: {
      caseName: 'Anti-Dumping Investigation - Steel Plates from China',
      petitionerName: 'PlateSteel Malaysia Sdn Bhd',
      subjectProduct: 'Steel plates (thick carbon steel plates)',
      hsCode: '7208',
      countryOfOrigin: 'China',
      exportPrice: '650',
      normalValue: '980',
      importVolumeCurrent: '1400000',
      importVolumePrevious: '920000',
      domesticMarketShare: '30',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 33.67,
      description: 'Material injury demonstrated through price undercutting, lost sales, and declining profitability. 34% dumping margin from China.',
    },
  },

  // 8. Steel bars (HS 7214) - Threatened injury
  {
    id: 'steel-bars-threatened-injury',
    name: 'Steel Bars - Threatened Injury',
    category: 'steel',
    description: 'Prevention of threatened material injury from dumped steel bars.',
    formData: {
      caseName: 'Anti-Dumping Investigation - Steel Bars',
      petitionerName: 'BarSteel Manufacturing Sdn Bhd',
      subjectProduct: 'Steel bars and rods (round, square, flat)',
      hsCode: '7214',
      countryOfOrigin: 'China, Indonesia',
      exportPrice: '520',
      normalValue: '780',
      importVolumeCurrent: '1100000',
      importVolumePrevious: '720000',
      domesticMarketShare: '33',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 33.33,
      description: 'Threatened injury from 53% volume increase and 33% price dumping. Preventive action needed before material injury occurs.',
    },
  },

  // 9. Steel shapes (HS 7215) - Causation analysis
  {
    id: 'steel-shapes-causation',
    name: 'Steel Shapes - Causation Analysis',
    category: 'steel',
    description: 'Comprehensive causation analysis for steel shapes dumping case.',
    formData: {
      caseName: 'Anti-Dumping Investigation - Steel Shapes and Profiles',
      petitionerName: 'ShapeSteel Industries Sdn Bhd',
      subjectProduct: 'Steel shapes (angles, channels, beams)',
      hsCode: '7215',
      countryOfOrigin: 'China',
      exportPrice: '620',
      normalValue: '910',
      importVolumeCurrent: '1650000',
      importVolumePrevious: '1100000',
      domesticMarketShare: '36',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 31.87,
      description: 'Causation analysis shows dumped imports directly causing price suppression, lost market share, and injury to domestic producers.',
    },
  },

  // 10. Steel tubes (HS 7305) - Sunset review
  {
    id: 'steel-tubes-sunset-review',
    name: 'Steel不僅 Tubes - Sunset Review',
    category: 'steel',
    description: 'Sunset review to determine if anti-dumping duties should continue.',
    formData: {
      caseName: 'Sunset Review - Steel Tubes Anti-Dumping Duties',
      petitionerName: 'TubeSteel Malaysia Berhad',
      subjectProduct: 'Steel tubes (welded and seamless)',
      hsCode: '7305',
      countryOfOrigin: 'China',
      exportPrice: '880',
      normalValue: '1120',
      importVolumeCurrent: '0',
      importVolumePrevious: '0',
      domesticMarketShare: '0',
      currency: 'USD',
    },
    exampleCalculation: {
      dumpingMargin: 21.43,
      description: 'Sunset review to assess if revocation of duties would likely lead to continuation or recurrence of dumping. Current duties effective in preventing injury.',
    },
  },
];

export function getSteelTemplateById(id: string): TradeRemedyTemplate | undefined {
  return STEEL_TRADE_REMEDY_TEMPLATES.find(t => t.id === id);
}

export function getAllSteelTemplates(): TradeRemedyTemplate[] {
  return STEEL_TRADE_REMEDY_TEMPLATES;
}
