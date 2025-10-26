// Malaysia-Focused Shipment Data Generator
// Task 6.1: Company & Transaction Drill-Down

import { FMM_COMPANIES } from './fmm-companies';
import { MALAYSIA_PORTS } from './malaysia-ports';
import { MOCK_PRODUCTS } from './products';
import { subDays, addDays, format } from 'date-fns';

export interface ShipmentTemplate {
  product_id: string;
  company_id: string;
  origin_port_id: string;
  destination_port_id: string;
  vessel_name: string;
  container_count: number;
  weight_kg: number;
  volume_m3: number;
  unit_price: number;
  total_value: number;
  currency: string;
  freight_cost: number;
  shipment_date: string;
  arrival_date: string;
  invoice_number: string;
  bl_number: string;
  hs_code: string;
}

// Vessel name generators by type
const VESSEL_NAMES = {
  container: [
    'MSC LORETO', 'CMA CGM MARCO POLO', 'EVER GIVEN', 'COSCO SHIPPING UNIVERSE',
    'HAPAG-LLOYD BERLIN', 'ONE HARMONY', 'MOL CREATION', 'YANG MING UNANIMITY',
    'HMM ALGECIRAS', 'ZIM CONSTANZA', 'OOCL HONG KONG', 'PIL SINGAPORE'
  ],
  bulk: [
    'CAPE BRETON', 'PACIFIC OCEAN', 'ATLANTIC STAR', 'INDIAN MONARCH',
    'SOUTHERN CROSS', 'NORTHERN LIGHT', 'EASTERN WIND', 'WESTERN WAVE'
  ],
  oil: [
    'CRUDE CARRIER I', 'TANKER VENTURE', 'PETROLEUM PRIDE', 'OIL EXPLORER',
    'FUEL TRANSPORTER', 'ENERGY CARRIER', 'LIQUID CARGO', 'CHEMICAL VESSEL'
  ]
};

// Trade lane patterns (origin -> destination with frequency)
const TRADE_LANES = [
  // Primary trade lanes (60% of shipments)
  { origin: 'China', destination: 'Malaysia', frequency: 0.25, sectors: ['Steel & Metals', 'Electronics & Electrical', 'Chemicals & Petrochemicals'] },
  { origin: 'Singapore', destination: 'Malaysia', frequency: 0.20, sectors: ['Electronics & Electrical', 'Chemicals & Petrochemicals'] },
  { origin: 'Malaysia', destination: 'Singapore', frequency: 0.15, sectors: ['Electronics & Electrical', 'Chemicals & Petrochemicals'] },

  // Secondary trade lanes (30% of shipments)
  { origin: 'Japan', destination: 'Malaysia', frequency: 0.08, sectors: ['Automotive & Parts', 'Electronics & Electrical'] },
  { origin: 'South Korea', destination: 'Malaysia', frequency: 0.07, sectors: ['Automotive & Parts', 'Electronics & Electrical'] },
  { origin: 'Germany', destination: 'Malaysia', frequency: 0.06, sectors: ['Chemicals & Petrochemicals', 'Automotive & Parts'] },
  { origin: 'Malaysia', destination: 'China', frequency: 0.05, sectors: ['Steel & Metals', 'Food & Beverage'] },
  { origin: 'Malaysia', destination: 'Thailand', frequency: 0.04, sectors: ['Textiles & Apparel', 'Food & Beverage'] },

  // Long-haul trade (10% of shipments)
  { origin: 'United States', destination: 'Malaysia', frequency: 0.03, sectors: ['Food & Beverage', 'Textiles & Apparel'] },
  { origin: 'Brazil', destination: 'Malaysia', frequency: 0.02, sectors: ['Food & Beverage'] },
  { origin: 'Netherlands', destination: 'Malaysia', frequency: 0.02, sectors: ['Chemicals & Petrochemicals'] },
  { origin: 'Malaysia', destination: 'Indonesia', frequency: 0.02, sectors: ['Food & Beverage', 'Textiles & Apparel'] },
  { origin: 'Malaysia', destination: 'Vietnam', frequency: 0.01, sectors: ['Textiles & Apparel'] },
];

// HS Code mapping by sector
const HS_CODES_BY_SECTOR = {
  'Steel & Metals': ['7208', '7214', '7306', '7308'],
  'Electronics & Electrical': ['8542', '8471', '8517', '8528'],
  'Chemicals & Petrochemicals': ['2902', '3901', '2710', '2804'],
  'Food & Beverage': ['1001', '1507', '1701', '2009'],
  'Textiles & Apparel': ['5205', '6204', '6109', '5407'],
  'Automotive & Parts': ['8708', '8703', '4011', '8704'],
};

/**
 * Generate realistic shipment data for Malaysian trade patterns
 */
export function generateMalaysiaShipments(
  companies: any[],
  ports: any[],
  products: any[],
  startDate: Date,
  endDate: Date,
  count: number = 800
): ShipmentTemplate[] {
  const shipments: ShipmentTemplate[] = [];
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < count; i++) {
    // Select trade lane based on frequency
    const tradeLane = selectTradeLane();

    // Get companies from appropriate sectors
    const sectorCompanies = companies.filter(c => tradeLane.sectors.includes(c.sector));
    const company = sectorCompanies[Math.floor(Math.random() * sectorCompanies.length)];

    // Get ports for origin and destination countries
    const originPorts = ports.filter(p => p.country === tradeLane.origin);
    const destPorts = ports.filter(p => p.country === tradeLane.destination);

    const originPort = originPorts[Math.floor(Math.random() * originPorts.length)];
    const destPort = destPorts[Math.floor(Math.random() * destPorts.length)];

    // Get product from appropriate sector
    const sectorProducts = products.filter(p => {
      const sectorHsCodes = HS_CODES_BY_SECTOR[company.sector as keyof typeof HS_CODES_BY_SECTOR];
      return sectorHsCodes?.includes(p.hs_code);
    });

    const product = sectorProducts[Math.floor(Math.random() * sectorProducts.length)];

    // Generate shipment details
    const shipmentDate = addDays(startDate, Math.floor(Math.random() * daysDiff));
    const arrivalDate = addDays(shipmentDate, Math.floor(Math.random() * 30) + 7); // 7-37 days transit

    const containerCount = Math.floor(Math.random() * 20) + 1;
    const weightPerContainer = Math.floor(Math.random() * 20000) + 10000; // 10-30 tons per container
    const weightKg = containerCount * weightPerContainer;
    const volumeM3 = weightKg * 0.4; // Rough conversion

    // Generate realistic pricing based on sector
    const basePrice = getSectorBasePrice(company.sector);
    const priceVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    const unitPrice = Math.round(basePrice * priceVariation * 100) / 100;
    const totalValue = Math.round(unitPrice * weightKg * 100) / 100;

    // Generate freight cost (5-15% of cargo value)
    const freightRate = 0.05 + Math.random() * 0.10;
    const freightCost = Math.round(totalValue * freightRate * 100) / 100;

    // Generate vessel name based on port type
    const vesselType = originPort.type || 'container';
    const vesselNames = VESSEL_NAMES[vesselType as keyof typeof VESSEL_NAMES] || VESSEL_NAMES.container;
    const vesselName = vesselNames[Math.floor(Math.random() * vesselNames.length)];

    // Generate document numbers
    const invoiceNumber = `INV-${format(shipmentDate, 'yyyyMMdd')}-${String(i + 1).padStart(4, '0')}`;
    const blNumber = `BL-${originPort.code}-${destPort.code}-${format(shipmentDate, 'yyyyMMdd')}`;

    // Inject anomalies for demo (10% of shipments)
    const hasAnomaly = Math.random() < 0.1;
    let finalUnitPrice = unitPrice;
    let finalFreightCost = freightCost;

    if (hasAnomaly) {
      // Steel dumping scenario
      if (company.sector === 'Steel & Metals' && tradeLane.origin === 'China') {
        finalUnitPrice = unitPrice * 0.58; // 42% below market (dumping)
      }
      // Electronics re-routing scenario
      else if (company.sector === 'Electronics & Electrical' && tradeLane.origin === 'Singapore') {
        finalUnitPrice = unitPrice * 1.15; // 15% markup for re-routing
      }
      // Chemicals TBML scenario
      else if (company.sector === 'Chemicals & Petrochemicals') {
        finalUnitPrice = unitPrice * 0.70; // 30% price drop
        finalFreightCost = freightCost * 1.25; // 25% freight spike
      }
    }

    const shipment: ShipmentTemplate = {
      product_id: product.id,
      company_id: company.id,
      origin_port_id: originPort.id,
      destination_port_id: destPort.id,
      vessel_name: vesselName,
      container_count: containerCount,
      weight_kg: weightKg,
      volume_m3: volumeM3,
      unit_price: finalUnitPrice,
      total_value: Math.round(finalUnitPrice * weightKg * 100) / 100,
      currency: 'MYR',
      freight_cost: finalFreightCost,
      shipment_date: format(shipmentDate, 'yyyy-MM-dd'),
      arrival_date: format(arrivalDate, 'yyyy-MM-dd'),
      invoice_number: invoiceNumber,
      bl_number: blNumber,
      hs_code: product.hs_code,
    };

    shipments.push(shipment);
  }

  return shipments;
}

/**
 * Select trade lane based on frequency distribution
 */
function selectTradeLane() {
  const random = Math.random();
  let cumulative = 0;

  for (const lane of TRADE_LANES) {
    cumulative += lane.frequency;
    if (random <= cumulative) {
      return lane;
    }
  }

  // Fallback to first lane
  return TRADE_LANES[0];
}

/**
 * Get base price per kg by sector (in MYR)
 */
function getSectorBasePrice(sector: string): number {
  const prices = {
    'Steel & Metals': 2.5, // RM 2.50/kg
    'Electronics & Electrical': 15.0, // RM 15/kg
    'Chemicals & Petrochemicals': 8.0, // RM 8/kg
    'Food & Beverage': 3.5, // RM 3.50/kg
    'Textiles & Apparel': 12.0, // RM 12/kg
    'Automotive & Parts': 25.0, // RM 25/kg
  };

  return prices[sector as keyof typeof prices] || 5.0;
}

// Export for use in seed script
export { TRADE_LANES, HS_CODES_BY_SECTOR };
