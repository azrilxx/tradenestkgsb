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
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBreakdown {
  price_deviation: number;
  volume_surge: number;
  fx_exposure: number;
  supply_chain_risk: number;
  historical_volatility: number;
}

export interface Alert {
  id: string;
  anomaly_id: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
  // Risk scoring fields (Task 8.6)
  risk_score?: number;
  risk_level?: RiskLevel;
  risk_breakdown?: RiskBreakdown;
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

// =====================================================
// Task 6.3: Custom Rules Types
// =====================================================

export interface RuleCondition {
  field: string;
  operator: string;
  value: number | string | [number, number];
  period?: string;
}

export interface RuleLogic {
  conditions: RuleCondition[];
  logic: 'AND' | 'OR';
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  logic_json: RuleLogic;
  user_id: string;
  active: boolean;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface RuleExecution {
  id: string;
  rule_id: string;
  executed_at: string;
  matches_found: number;
  anomalies_created: number;
  execution_time_ms: number;
  metadata: Record<string, any>;
}

// =====================================================
// Phase 7: Gazette Tracker Types
// =====================================================

export type GazetteCategory = 'trade_remedy' | 'tariff_change' | 'import_restriction' | 'anti_dumping';

export interface Gazette {
  id: string;
  gazette_number: string;
  publication_date: string;
  category: GazetteCategory;
  pdf_url?: string;
  title: string;
  summary?: string;
  extracted_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GazetteAffectedItem {
  id: string;
  gazette_id: string;
  hs_codes: string[];
  affected_countries: string[];
  summary?: string;
  remedy_type?: string;
  expiry_date?: string;
  created_at: string;
}

export interface GazetteSubscription {
  id: string;
  user_id: string;
  hs_code?: string;
  country_code?: string;
  category?: string;
  active: boolean;
  created_at: string;
}

export interface GazetteSummary {
  id: string;
  gazette_number: string;
  publication_date: string;
  category: GazetteCategory;
  title: string;
  summary?: string;
  pdf_url?: string;
  unique_hs_codes: number;
  unique_countries: number;
  remedy_types?: string[];
}

// =====================================================
// Phase 7: Trade Remedy Workbench Types
// =====================================================

export type TradeRemedyCaseStatus = 'draft' | 'submitted' | 'under_investigation' | 'finalized';

export interface TradeRemedyCase {
  id: string;
  case_number: string;
  case_name: string;
  petitioner_name?: string;
  subject_product?: string;
  hs_code?: string;
  country_of_origin?: string;
  petition_date?: string;
  investigation_start_date?: string;
  preliminary_determination_date?: string;
  final_determination_date?: string;
  dumping_margin_percent?: number;
  price_depression_percent?: number;
  volume_impact_percent?: number;
  status: TradeRemedyCaseStatus;
  user_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportDataAnalysis {
  id: string;
  case_id: string;
  period_start?: string;
  period_end?: string;
  total_import_volume?: number;
  total_import_value?: number;
  average_unit_price?: number;
  currency?: string;
  benchmark_price?: number;
  market_price?: number;
  domestic_price?: number;
  dumping_amount?: number;
  dumping_margin?: number;
  created_at: string;
}

export interface InjuryAnalysis {
  id: string;
  case_id: string;
  domestic_market_share_loss?: number;
  price_depression?: number;
  revenue_loss?: number;
  employment_impact?: number;
  estimated_revenue_loss?: number;
  profit_margin_impact?: number;
  causation_established?: boolean;
  causation_summary?: string;
  created_at: string;
}

export interface TradeRemedyEvidence {
  id: string;
  case_id: string;
  document_type?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  generated_at: string;
  sections?: Record<string, any>;
  charts_data?: Record<string, any>;
  created_at: string;
}