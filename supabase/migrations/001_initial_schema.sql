-- Trade Nest Database Schema
-- Created: 2025-10-26
-- Purpose: Initial database schema for Trade Nest prototype

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: products
-- Stores product information with HS codes
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hs_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_hs_code ON products(hs_code);
CREATE INDEX idx_products_category ON products(category);

-- =====================================================
-- TABLE: tariff_data
-- Stores historical tariff rates
-- =====================================================
CREATE TABLE tariff_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rate DECIMAL(5,2) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'UN Comtrade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tariff_product ON tariff_data(product_id);
CREATE INDEX idx_tariff_date ON tariff_data(effective_date DESC);

-- =====================================================
-- TABLE: price_data
-- Stores historical price information
-- =====================================================
CREATE TABLE price_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'DOSM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_product ON price_data(product_id);
CREATE INDEX idx_price_date ON price_data(date DESC);
CREATE INDEX idx_price_product_date ON price_data(product_id, date DESC);

-- =====================================================
-- TABLE: fx_rates
-- Stores foreign exchange rates
-- =====================================================
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency_pair VARCHAR(7) NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(currency_pair, date)
);

CREATE INDEX idx_fx_pair ON fx_rates(currency_pair);
CREATE INDEX idx_fx_date ON fx_rates(date DESC);

-- =====================================================
-- TABLE: freight_index
-- Stores freight cost indexes for routes
-- =====================================================
CREATE TABLE freight_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route VARCHAR(100) NOT NULL,
  index_value DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route, date)
);

CREATE INDEX idx_freight_route ON freight_index(route);
CREATE INDEX idx_freight_date ON freight_index(date DESC);

-- =====================================================
-- TABLE: anomalies
-- Stores detected anomalies
-- =====================================================
CREATE TYPE anomaly_type AS ENUM ('price_spike', 'tariff_change', 'freight_surge', 'fx_volatility');
CREATE TYPE anomaly_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type anomaly_type NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  severity anomaly_severity NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anomaly_type ON anomalies(type);
CREATE INDEX idx_anomaly_severity ON anomalies(severity);
CREATE INDEX idx_anomaly_detected ON anomalies(detected_at DESC);
CREATE INDEX idx_anomaly_product ON anomalies(product_id);

-- =====================================================
-- TABLE: alerts
-- Stores alert status for anomalies
-- =====================================================
CREATE TYPE alert_status AS ENUM ('new', 'viewed', 'resolved');

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anomaly_id UUID NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
  status alert_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(anomaly_id)
);

CREATE INDEX idx_alert_status ON alerts(status);
CREATE INDEX idx_alert_created ON alerts(created_at DESC);

-- =====================================================
-- TABLE: users (extends Supabase auth.users)
-- Stores additional user profile information
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (for prototype)
-- In production, restrict based on user authentication
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tariff_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON price_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON fx_rates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON freight_index FOR SELECT USING (true);
CREATE POLICY "Public read access" ON anomalies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON alerts FOR SELECT USING (true);

-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate price statistics for anomaly detection
CREATE OR REPLACE FUNCTION calculate_price_stats(
  p_product_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  avg_price DECIMAL,
  std_dev DECIMAL,
  min_price DECIMAL,
  max_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(price)::DECIMAL,
    STDDEV(price)::DECIMAL,
    MIN(price)::DECIMAL,
    MAX(price)::DECIMAL
  FROM price_data
  WHERE product_id = p_product_id
    AND date >= CURRENT_DATE - p_days
    AND date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent anomalies count
CREATE OR REPLACE FUNCTION get_anomaly_count(
  p_days INTEGER DEFAULT 7,
  p_severity anomaly_severity DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  anomaly_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO anomaly_count
  FROM anomalies
  WHERE detected_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_severity IS NULL OR severity = p_severity);

  RETURN anomaly_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Recent alerts with anomaly details
CREATE OR REPLACE VIEW v_alerts_with_details AS
SELECT
  a.id AS alert_id,
  a.status,
  a.created_at AS alert_created_at,
  a.resolved_at,
  an.id AS anomaly_id,
  an.type,
  an.severity,
  an.detected_at,
  an.details,
  p.hs_code,
  p.description AS product_description,
  p.category
FROM alerts a
JOIN anomalies an ON a.anomaly_id = an.id
LEFT JOIN products p ON an.product_id = p.id
ORDER BY a.created_at DESC;

-- View: Product price trends with anomaly indicators
CREATE OR REPLACE VIEW v_product_price_trends AS
SELECT
  p.id AS product_id,
  p.hs_code,
  p.description,
  pd.date,
  pd.price,
  pd.currency,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM anomalies an
      WHERE an.product_id = p.id
        AND an.type = 'price_spike'
        AND DATE(an.detected_at) = pd.date
    ) THEN true
    ELSE false
  END AS has_anomaly
FROM products p
JOIN price_data pd ON p.id = pd.product_id
ORDER BY p.hs_code, pd.date DESC;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE products IS 'Master list of products with HS codes';
COMMENT ON TABLE tariff_data IS 'Historical tariff rates for products';
COMMENT ON TABLE price_data IS 'Historical price data from various sources';
COMMENT ON TABLE fx_rates IS 'Foreign exchange rates for currency conversion';
COMMENT ON TABLE freight_index IS 'Freight cost indexes for shipping routes';
COMMENT ON TABLE anomalies IS 'Detected anomalies in trade data';
COMMENT ON TABLE alerts IS 'Alert status tracking for anomalies';
COMMENT ON TABLE users IS 'Extended user profile information';