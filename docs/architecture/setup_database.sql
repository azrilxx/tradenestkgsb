-- Complete TradeNest Database Setup
-- This script creates all necessary tables and views for the modernized dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: products
-- Stores product information with HS codes
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hs_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_hs_code ON products(hs_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =====================================================
-- TABLE: companies (Task 6.1)
-- Stores FMM company information
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('importer', 'exporter')),
  sector VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);

-- =====================================================
-- TABLE: ports (Task 6.1)
-- Stores port information
-- =====================================================
CREATE TABLE IF NOT EXISTS ports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  country VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ports_country ON ports(country);
CREATE INDEX IF NOT EXISTS idx_ports_code ON ports(code);

-- =====================================================
-- TABLE: shipments (Task 6.1)
-- Stores shipment transaction data
-- =====================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  origin_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  destination_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  vessel_name VARCHAR(255),
  container_count INTEGER DEFAULT 1,
  weight_kg DECIMAL(12,2),
  unit_price DECIMAL(12,2),
  total_value DECIMAL(15,2),
  shipment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_product ON shipments(product_id);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(shipment_date DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_origin ON shipments(origin_port_id);
CREATE INDEX IF NOT EXISTS idx_shipments_destination ON shipments(destination_port_id);

-- =====================================================
-- TABLE: tariff_data
-- Stores historical tariff rates
-- =====================================================
CREATE TABLE IF NOT EXISTS tariff_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rate DECIMAL(5,2) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'UN Comtrade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tariff_product ON tariff_data(product_id);
CREATE INDEX IF NOT EXISTS idx_tariff_date ON tariff_data(effective_date DESC);

-- =====================================================
-- TABLE: price_data
-- Stores historical price information
-- =====================================================
CREATE TABLE IF NOT EXISTS price_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'DOSM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_product ON price_data(product_id);
CREATE INDEX IF NOT EXISTS idx_price_date ON price_data(date DESC);

-- =====================================================
-- TABLE: fx_rates
-- Stores foreign exchange rates
-- =====================================================
CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10,4) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'BNM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fx_date ON fx_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_fx_currencies ON fx_rates(base_currency, target_currency);

-- =====================================================
-- TABLE: freight_index
-- Stores freight cost indexes
-- =====================================================
CREATE TABLE IF NOT EXISTS freight_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route VARCHAR(100) NOT NULL,
  index_value DECIMAL(8,2) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'Drewry',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freight_route ON freight_index(route);
CREATE INDEX IF NOT EXISTS idx_freight_date ON freight_index(date DESC);

-- =====================================================
-- TABLE: anomalies
-- Stores detected anomalies
-- =====================================================
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('price_spike', 'tariff_change', 'freight_surge', 'fx_volatility')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_product ON anomalies(product_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(type);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected ON anomalies(detected_at DESC);

-- =====================================================
-- TABLE: alerts
-- Stores user alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anomaly_id UUID NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_anomaly ON alerts(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- =====================================================
-- VIEW: shipment_details (Task 6.1)
-- Comprehensive shipment view for drill-down API
-- =====================================================
CREATE OR REPLACE VIEW shipment_details AS
SELECT 
  s.id,
  s.shipment_date,
  s.vessel_name,
  s.container_count,
  s.weight_kg,
  s.unit_price,
  s.total_value,
  s.created_at,
  
  -- Product information
  p.hs_code,
  p.description as product_description,
  p.category as product_category,
  
  -- Company information
  c.name as company_name,
  c.country as company_country,
  c.type as company_type,
  c.sector as company_sector,
  
  -- Origin port information
  op.name as origin_port_name,
  op.code as origin_port_code,
  op.country as origin_country,
  
  -- Destination port information
  dp.name as destination_port_name,
  dp.code as destination_port_code,
  dp.country as destination_country
  
FROM shipments s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
JOIN ports op ON s.origin_port_id = op.id
JOIN ports dp ON s.destination_port_id = dp.id;

-- =====================================================
-- FUNCTION: Update alert timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alerts_timestamp
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create policies for public access (for demo purposes)
-- =====================================================
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ports FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON shipments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON tariff_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON price_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON fx_rates FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON freight_index FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON anomalies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON alerts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON ports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON tariff_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON price_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON fx_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON freight_index FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON anomalies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON alerts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON products FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON companies FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON ports FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON shipments FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON tariff_data FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON price_data FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON fx_rates FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON freight_index FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON anomalies FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON alerts FOR DELETE USING (true);

-- =====================================================
-- Success message
-- =====================================================
SELECT 'TradeNest database schema created successfully!' as message;
