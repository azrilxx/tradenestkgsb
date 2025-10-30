-- Migration 018: FX Alerts Schema
-- Create tables for FX rate alert tracking and history

-- =====================================================
-- TABLE: fx_alerts
-- Purpose: Store FX rate alerts when rates change significantly
-- =====================================================
CREATE TABLE IF NOT EXISTS fx_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair VARCHAR(7) NOT NULL,
  previous_rate DECIMAL(10,6) NOT NULL,
  current_rate DECIMAL(10,6) NOT NULL,
  change_percent DECIMAL(6,3) NOT NULL,
  threshold DECIMAL(6,3) NOT NULL DEFAULT 2.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fx_alerts_currency_pair ON fx_alerts(currency_pair);
CREATE INDEX idx_fx_alerts_created_at ON fx_alerts(created_at DESC);
CREATE INDEX idx_fx_alerts_change_percent ON fx_alerts(change_percent DESC);

COMMENT ON TABLE fx_alerts IS 'FX rate alerts for significant changes';

