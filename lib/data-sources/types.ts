/**
 * Common types and interfaces for all data source providers
 * Used by BNM FX, MATRADE, and future commercial providers
 */

export enum DataSource {
  BNM = 'BNM',
  MATRADE = 'MATRADE',
  MOCK = 'MOCK',
  PANJIVA = 'PANJIVA',
  UNKNOWN = 'UNKNOWN'
}

export enum DataQuality {
  REAL = 'real',
  ENHANCED = 'enhanced', // Real stats + mock details
  MOCK = 'mock',
  UNKNOWN = 'unknown'
}

export interface FXRate {
  currency_pair: string;
  rate: number;
  date: Date;
  source: DataSource;
  created_at?: Date;
}

export interface TradeStatistic {
  year: number;
  month: number;
  country?: string;
  sector?: string;
  export_value: number;
  import_value: number;
  source: DataSource;
  created_at?: Date;
}

export interface ShipmentData {
  id?: string;
  hs_code: string;
  company_name: string;
  origin_country: string;
  destination_country: string;
  shipment_date: string;
  value: number;
  weight_kg: number;
  unit_price: number;
  source: DataSource;
  data_quality: DataQuality;
}

export interface DataIngestionResult {
  success: boolean;
  source: DataSource;
  recordsInserted: number;
  recordsUpdated: number;
  timestamp: Date;
  error?: string;
}

export interface DataSourceHealth {
  source: DataSource;
  lastUpdated: Date | null;
  recordCount: number;
  isStale: boolean;
  status: 'healthy' | 'degraded' | 'failed';
}

export interface DataRefreshStatus {
  totalSources: number;
  successful: number;
  failed: number;
  results: DataIngestionResult[];
  timestamp: Date;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
  qualityScore: number; // 0-100
}

export interface MatradeCSVRow {
  year?: string;
  month?: string;
  country?: string;
  sector?: string;
  export_value?: string;
  import_value?: string;
  [key: string]: any; // Allow other dynamic fields
}

export interface BNMResponse {
  data: BNMDataItem[];
  meta: BNMMeta;
}

export interface BNMDataItem {
  date: string;
  currency_code: string;
  rate: string;
  [key: string]: any;
}

export interface BNMMeta {
  date: string;
  [key: string]: any;
}

