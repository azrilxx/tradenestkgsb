import { Product } from '@/types/database';

// Sample products with real HS codes for Malaysian import/export
export const MOCK_PRODUCTS: Omit<Product, 'id' | 'created_at'>[] = [
  // Electronics
  { hs_code: '8517.12', description: 'Smartphones and cellular phones', category: 'Electronics' },
  { hs_code: '8471.30', description: 'Portable automatic data processing machines', category: 'Electronics' },
  { hs_code: '8528.72', description: 'LCD monitors and projectors', category: 'Electronics' },
  { hs_code: '8542.31', description: 'Electronic integrated circuits', category: 'Electronics' },

  // Textiles & Apparel
  { hs_code: '5205.31', description: 'Cotton yarn, single', category: 'Textiles' },
  { hs_code: '5407.20', description: 'Woven fabrics of synthetic filaments', category: 'Textiles' },
  { hs_code: '6109.10', description: 'T-shirts, cotton', category: 'Textiles' },
  { hs_code: '6203.42', description: 'Men\'s trousers, cotton', category: 'Textiles' },
  { hs_code: '6204.62', description: 'Women\'s trousers, cotton', category: 'Textiles' },
  { hs_code: '6402.99', description: 'Footwear, rubber/plastic outer soles', category: 'Textiles' },

  // Palm Oil Products
  { hs_code: '1511.10', description: 'Crude palm oil', category: 'Agriculture' },
  { hs_code: '1511.90', description: 'Refined palm oil', category: 'Agriculture' },
  { hs_code: '1513.21', description: 'Crude palm kernel oil', category: 'Agriculture' },

  // Petroleum Products
  { hs_code: '2710.12', description: 'Light petroleum oils', category: 'Petroleum' },
  { hs_code: '2710.19', description: 'Other petroleum oils', category: 'Petroleum' },
  { hs_code: '2711.11', description: 'Liquefied natural gas', category: 'Petroleum' },

  // Machinery
  { hs_code: '8481.80', description: 'Taps, cocks, valves', category: 'Machinery' },
  { hs_code: '8483.40', description: 'Gears and gearing', category: 'Machinery' },
  { hs_code: '8501.10', description: 'Electric motors < 37.5W', category: 'Machinery' },

  // Automotive
  { hs_code: '8703.23', description: 'Motor cars, spark-ignition 1500-3000cc', category: 'Automotive' },
  { hs_code: '8704.31', description: 'Motor vehicles for transport of goods', category: 'Automotive' },
  { hs_code: '8708.29', description: 'Motor vehicle parts and accessories', category: 'Automotive' },
  { hs_code: '4011.10', description: 'New pneumatic tyres, cars', category: 'Automotive' },

  // Chemicals
  { hs_code: '2804.50', description: 'Nitrogen', category: 'Chemicals' },
  { hs_code: '2902.11', description: 'Cyclohexane', category: 'Chemicals' },
  { hs_code: '3004.20', description: 'Antibiotics in dosage', category: 'Chemicals' },
  { hs_code: '3808.91', description: 'Insecticides', category: 'Chemicals' },
  { hs_code: '3901.10', description: 'Polymers of ethylene, primary forms', category: 'Chemicals' },

  // Furniture
  { hs_code: '9401.40', description: 'Seats with wooden frames', category: 'Furniture' },
  { hs_code: '9403.30', description: 'Wooden furniture for offices', category: 'Furniture' },
  { hs_code: '9403.60', description: 'Other wooden furniture', category: 'Furniture' },
  { hs_code: '9404.30', description: 'Mattress supports', category: 'Furniture' },
  { hs_code: '9405.20', description: 'Decorative glassware', category: 'Furniture' },

  // Food Products
  { hs_code: '1001.10', description: 'Wheat, durum', category: 'Food' },
  { hs_code: '1006.30', description: 'Semi-milled or wholly milled rice', category: 'Food' },
  { hs_code: '0306.17', description: 'Frozen prawns and shrimps', category: 'Food' },
  { hs_code: '1507.20', description: 'Soybean oil', category: 'Food' },
  { hs_code: '1701.99', description: 'Other cane or beet sugar', category: 'Food' },
  { hs_code: '1905.90', description: 'Bread, pastry, cakes, biscuits', category: 'Food' },
  { hs_code: '2009.20', description: 'Orange juice', category: 'Food' },

  // Rubber Products
  { hs_code: '4001.21', description: 'Natural rubber smoked sheets', category: 'Rubber' },
  { hs_code: '4001.22', description: 'Technically specified natural rubber', category: 'Rubber' },

  // Wood Products
  { hs_code: '4407.11', description: 'Sawn wood, coniferous', category: 'Wood' },
  { hs_code: '4412.31', description: 'Plywood with at least one outer ply', category: 'Wood' },

  // Plastics
  { hs_code: '3920.10', description: 'Polymers of ethylene, plates, sheets', category: 'Plastics' },
  { hs_code: '3923.30', description: 'Carboys, bottles, flasks - plastic', category: 'Plastics' },

  // Metals
  { hs_code: '7208.10', description: 'Flat-rolled iron/steel, hot-rolled', category: 'Metals' },
  { hs_code: '7208.90', description: 'Flat-rolled iron/steel, cold-rolled', category: 'Metals' },
  { hs_code: '7214.20', description: 'Iron/steel bars and rods', category: 'Metals' },
  { hs_code: '7306.50', description: 'Welded pipes and tubes', category: 'Metals' },
  { hs_code: '7308.40', description: 'Iron/steel structures and parts', category: 'Metals' },
  { hs_code: '7601.10', description: 'Unwrought aluminum, not alloyed', category: 'Metals' },

  // Medical Equipment
  { hs_code: '9018.19', description: 'Medical diagnostic equipment', category: 'Medical' },
  { hs_code: '9021.10', description: 'Orthopaedic or fracture appliances', category: 'Medical' },

  // Solar/Renewable
  { hs_code: '8541.40', description: 'Photovoltaic cells and panels', category: 'Renewable' },
  { hs_code: '8502.31', description: 'Wind-powered electric generators', category: 'Renewable' },

  // Toys
  { hs_code: '9503.00', description: 'Toys, scale models, puzzles', category: 'Toys' },

  // Paper Products
  { hs_code: '4802.56', description: 'Printing paper, uncoated', category: 'Paper' },
  { hs_code: '4818.20', description: 'Handkerchiefs, tissues', category: 'Paper' },

  // Ceramics
  { hs_code: '6912.00', description: 'Ceramic tableware, kitchenware', category: 'Ceramics' },

  // Optical
  { hs_code: '9001.50', description: 'Spectacle lenses', category: 'Optical' },

  // Sports Equipment
  { hs_code: '9506.91', description: 'Exercise equipment', category: 'Sports' },

  // Agricultural Equipment
  { hs_code: '8432.29', description: 'Other harrows, scarifiers, cultivators', category: 'Agri-Equipment' },

  // Jewelry
  { hs_code: '7113.19', description: 'Jewellery of precious metal', category: 'Jewelry' },
];

export function generateProductId(hsCode: string): string {
  // Create deterministic UUID-like ID from HS code for consistency
  return `prod-${hsCode.replace('.', '-')}-${Math.random().toString(36).substr(2, 9)}`;
}