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