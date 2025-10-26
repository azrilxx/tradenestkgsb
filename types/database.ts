export interface Product {
  id: string;
  hs_code: string;
  description: string;
  category: string;
  created_at: string;
}

export interface TariffData {
  id: string;
  product_id: string;
  rate: number;
  effective_date: string;
  source: string;
  created_at: string;
}

export interface PriceData {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  date: string;
  source: string;
  created_at: string;
}

export interface FxRate {
  id: string;
  currency_pair: string;
  rate: number;
  date: string;
  created_at: string;
}

export interface FreightIndex {
  id: string;
  route: string;
  index_value: number;
  date: string;
  created_at: string;
}

export type AnomalyType = 'price_spike' | 'tariff_change' | 'freight_surge' | 'fx_volatility';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  product_id: string;
  severity: AnomalySeverity;
  detected_at: string;
  details: Record<string, any>;
  created_at: string;
}

export type AlertStatus = 'new' | 'viewed' | 'resolved';

export interface Alert {
  id: string;
  anomaly_id: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

// =====================================================
// Task 6.1: Company & Transaction Drill-Down Types
// =====================================================

export type CompanyType = 'importer' | 'exporter' | 'both';

export interface Company {
  id: string;
  name: string;
  country: string;
  type: CompanyType;
  sector: string; // Steel & Metals, Electronics, Chemicals, F&B, Textiles, Automotive
  created_at: string;
  updated_at: string;
}

export interface Port {
  id: string;
  name: string;
  code: string; // UNLOCODE (e.g., MYPKG for Port Klang)
  country: string;
  type?: string; // container, bulk, oil, general
  created_at: string;
}

export interface Shipment {
  id: string;
  product_id: string;
  company_id: string;
  origin_port_id?: string;
  destination_port_id?: string;

  // Shipment Details
  vessel_name?: string;
  container_count?: number;
  weight_kg?: number;
  volume_m3?: number;

  // Pricing & Cost
  unit_price?: number;
  total_value?: number;
  currency: string;
  freight_cost?: number;

  // Dates
  shipment_date: string;
  arrival_date?: string;

  // Metadata
  invoice_number?: string;
  bl_number?: string; // Bill of Lading
  hs_code?: string; // Denormalized for quick filtering

  created_at: string;
  updated_at: string;
}

// Denormalized view for drill-down queries
export interface ShipmentDetail extends Shipment {
  // Company Info
  company_name: string;
  company_country: string;
  company_type: CompanyType;
  company_sector: string;

  // Product Info
  product_description: string;
  product_category: string;

  // Origin Port
  origin_port_name?: string;
  origin_port_code?: string;
  origin_country?: string;

  // Destination Port
  destination_port_name?: string;
  destination_port_code?: string;
  destination_country?: string;
}

export interface CompanyStats {
  total_shipments: number;
  total_value: number;
  unique_products: number;
  unique_routes: number;
  first_shipment_date: string;
  last_shipment_date: string;
}

export interface TradePartner {
  company_id: string;
  company_name: string;
  company_country: string;
  total_shipments: number;
  total_value: number;
  avg_unit_price: number;
}