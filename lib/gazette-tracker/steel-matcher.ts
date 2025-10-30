// Steel Product Matcher for Gazette Tracker
// Task 1.4: Match gazettes to steel products from MITI Roadmap

export interface SteelProduct {
  name: string;
  hsCodes: string[];
  description: string;
}

// Steel products from MITI Roadmap priorities
export const STEEL_PRODUCTS: SteelProduct[] = [
  {
    name: 'Flat-rolled steel products',
    hsCodes: ['7208', '7209'],
    description: 'Cold-rolled and hot-rolled flat steel products',
  },
  {
    name: 'Reinforcing bars (rebar)',
    hsCodes: ['7214'],
    description: 'Reinforcing steel bars for construction',
  },
  {
    name: 'Wire rods and wire products',
    hsCodes: ['7213', '7217'],
    description: 'Wire rods and steel wire',
  },
  {
    name: 'Stainless steel flat products',
    hsCodes: ['7219', '7220'],
    description: 'Stainless steel sheets, plates, and strips',
  },
  {
    name: 'Coated steel products',
    hsCodes: ['7210', '7212'],
    description: 'Galvanized and color-coated steel',
  },
  {
    name: 'Steel pipes and tubes',
    hsCodes: ['7304', '7305', '7306'],
    description: 'Welded and seamless steel pipes',
  },
  {
    name: 'Steel plates',
    hsCodes: ['7208'],
    description: 'Thick carbon steel plates',
  },
  {
    name: 'Steel bars and rods',
    hsCodes: ['7214'],
    description: 'Round, square, and flat steel bars',
  },
  {
    name: 'Steel shapes',
    hsCodes: ['7215'],
    description: 'Angles, channels, and beams',
  },
];

export function isSteelProduct(hsCode: string): boolean {
  const steelHsCodes = STEEL_PRODUCTS.flatMap(product => product.hsCodes);
  return steelHsCodes.includes(hsCode);
}

export function getSteelProductByHsCode(hsCode: string): SteelProduct | undefined {
  return STEEL_PRODUCTS.find(product => product.hsCodes.includes(hsCode));
}

export function matchSteelProducts(hsCodes: string[]): SteelProduct[] {
  const matches: SteelProduct[] = [];
  for (const hsCode of hsCodes) {
    const product = getSteelProductByHsCode(hsCode);
    if (product && !matches.includes(product)) {
      matches.push(product);
    }
  }
  return matches;
}

export function extractHsCodes(text: string): string[] {
  // Extract HS codes from text (e.g., "HS 7208", "HS Code 7214")
  const hsCodePattern = /HS\s*(?:Code)?\s*(\d{4})/gi;
  const matches = text.matchAll(hsCodePattern);
  return Array.from(matches, m => m[1]);
}

export function isSteelRelatedGazette(title: string, summary: string): boolean {
  const steelKeywords = [
    'steel', 'rebar', 'rebars', 'wire rod', 'wire rods',
    'flat-rolled', 'stainless steel', 'galvanized steel',
    'steel pipes', 'steel tubes', 'steel plates', 'steel bars',
    'steel shapes', 'anti-dumping', 'dumping', 'safeguard'
  ];

  const searchText = `${title} ${summary}`.toLowerCase();
  return steelKeywords.some(keyword => searchText.includes(keyword));
}

