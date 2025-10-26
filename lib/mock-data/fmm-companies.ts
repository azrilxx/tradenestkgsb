// FMM-Aligned Malaysian Company Data
// Task 6.1: Company & Transaction Drill-Down

import { Company } from '@/types/database';

export interface CompanyTemplate {
  name: string;
  sector: string;
  country: string;
  type: 'importer' | 'exporter';
}

// 60 realistic Malaysian manufacturing companies across 6 FMM sectors
export const FMM_COMPANIES: CompanyTemplate[] = [
  // =====================================================
  // STEEL & METALS (12 companies) - Primary demo sector
  // =====================================================
  { name: 'MegaSteel Industries Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'AsiaPac Metal Trading Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'exporter' },
  { name: 'Southern Steel Works Berhad', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Klang Metal Processors Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Peninsula Iron & Steel Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'exporter' },
  { name: 'Johor Metal Industries Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Malaysian Steel Corp Berhad', sector: 'Steel & Metals', country: 'Malaysia', type: 'exporter' },
  { name: 'Northern Metal Works Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Integrated Steel Solutions Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'exporter' },
  { name: 'East Coast Metal Trading Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Perak Steel Manufacturing Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'importer' },
  { name: 'Metro Metal Supplies Sdn Bhd', sector: 'Steel & Metals', country: 'Malaysia', type: 'exporter' },

  // =====================================================
  // ELECTRONICS & ELECTRICAL (15 companies) - High-value sector
  // =====================================================
  { name: 'TechCom Solutions Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'ElectroNusa Manufacturing Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Penang Semiconductor Industries Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Malaysian Electronics Assembly Berhad', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Advanced Circuit Technologies Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Klang Valley Electronics Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Integrated Components Malaysia Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Asia Telecom Solutions Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Power Systems Malaysia Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Digital Manufacturing Solutions Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Johor Tech Components Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Malaysian LED Industries Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Northern Electronics Assembly Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },
  { name: 'Smart Device Manufacturing Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'exporter' },
  { name: 'Peninsula Electrical Systems Sdn Bhd', sector: 'Electronics & Electrical', country: 'Malaysia', type: 'importer' },

  // =====================================================
  // CHEMICALS & PETROCHEMICALS (12 companies) - Complex pricing
  // =====================================================
  { name: 'PetroChemAsia Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },
  { name: 'PolymerTech Industries Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Malaysian Petrochemical Corp Berhad', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Specialty Chemicals Malaysia Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },
  { name: 'Bintulu Petrochemical Industries Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Industrial Chemicals Suppliers Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },
  { name: 'Asia Polymer Solutions Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Klang Chemical Trading Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },
  { name: 'Southern Petrochemical Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Malaysian Resins Manufacturing Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },
  { name: 'Integrated Chemical Solutions Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'exporter' },
  { name: 'Johor Petrochemical Suppliers Sdn Bhd', sector: 'Chemicals & Petrochemicals', country: 'Malaysia', type: 'importer' },

  // =====================================================
  // FOOD & BEVERAGE (10 companies) - Agricultural imports
  // =====================================================
  { name: 'Mega Food Processors Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'AgroTrade Malaysia Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'exporter' },
  { name: 'Malaysian Food Industries Berhad', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'Premium Beverages Malaysia Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'exporter' },
  { name: 'Tropical Food Imports Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'Klang Valley Food Distributors Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'Asia Pacific Food Trading Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'exporter' },
  { name: 'Southern Food Manufacturing Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'Malaysian Grain Importers Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'importer' },
  { name: 'Peninsula Food Solutions Sdn Bhd', sector: 'Food & Beverage', country: 'Malaysia', type: 'exporter' },

  // =====================================================
  // TEXTILES & APPAREL (6 companies) - Labor-intensive
  // =====================================================
  { name: 'FabricCraft Industries Sdn Bhd', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'exporter' },
  { name: 'GarmentPro Malaysia Sdn Bhd', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'importer' },
  { name: 'Malaysian Textile Mills Berhad', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'exporter' },
  { name: 'Asia Fabric Imports Sdn Bhd', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'importer' },
  { name: 'Apparel Manufacturing Solutions Sdn Bhd', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'exporter' },
  { name: 'Klang Textile Traders Sdn Bhd', sector: 'Textiles & Apparel', country: 'Malaysia', type: 'importer' },

  // =====================================================
  // AUTOMOTIVE & PARTS (5 companies) - Supply chain complexity
  // =====================================================
  { name: 'AutoComponents Malaysia Sdn Bhd', sector: 'Automotive & Parts', country: 'Malaysia', type: 'importer' },
  { name: 'MotorParts Asia Sdn Bhd', sector: 'Automotive & Parts', country: 'Malaysia', type: 'exporter' },
  { name: 'Malaysian Auto Assembly Berhad', sector: 'Automotive & Parts', country: 'Malaysia', type: 'importer' },
  { name: 'Precision Auto Parts Sdn Bhd', sector: 'Automotive & Parts', country: 'Malaysia', type: 'exporter' },
  { name: 'Southern Automotive Supplies Sdn Bhd', sector: 'Automotive & Parts', country: 'Malaysia', type: 'importer' },
];

// Verify count
const sectorCounts = FMM_COMPANIES.reduce((acc, company) => {
  acc[company.sector] = (acc[company.sector] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('FMM Company Distribution:', sectorCounts);
// Expected: Steel & Metals: 12, Electronics: 15, Chemicals: 12, F&B: 10, Textiles: 6, Automotive: 5
// Total: 60 companies