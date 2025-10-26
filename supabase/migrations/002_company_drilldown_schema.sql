-- Migration 002: Company & Transaction Drill-Down Schema
-- Task 6.1: Add companies, ports, and shipments tables for trade intelligence

-- =====================================================
-- TABLE: companies
-- Purpose: Store importer/exporter company information
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('importer', 'exporter', 'both')),
  sector VARCHAR(100), -- Steel & Metals, Electronics, Chemicals, F&B, Textiles, Automotive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_type ON companies(type);

-- =====================================================
-- TABLE: ports
-- Purpose: Store global port information for shipment tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL, -- UNLOCODE (e.g., MYPKG for Port Klang)
  country VARCHAR(100) NOT NULL,
  type VARCHAR(50), -- container, bulk, oil, general
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ports_code ON ports(code);
CREATE INDEX idx_ports_country ON ports(country);

-- =====================================================
-- TABLE: shipments
-- Purpose: Store detailed shipment transaction history
-- =====================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  origin_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
  destination_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,

  -- Shipment Details
  vessel_name VARCHAR(255),
  container_count INTEGER DEFAULT 0,
  weight_kg DECIMAL(15, 2),
  volume_m3 DECIMAL(15, 2),

  -- Pricing & Cost
  unit_price DECIMAL(15, 2),
  total_value DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'MYR',
  freight_cost DECIMAL(15, 2),

  -- Dates
  shipment_date DATE NOT NULL,
  arrival_date DATE,

  -- Metadata
  invoice_number VARCHAR(100),
  bl_number VARCHAR(100), -- Bill of Lading
  hs_code VARCHAR(20), -- Denormalized for quick filtering

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (critical for drill-down queries)
CREATE INDEX idx_shipments_product_id ON shipments(product_id);
CREATE INDEX idx_shipments_company_id ON shipments(company_id);
CREATE INDEX idx_shipments_origin_port ON shipments(origin_port_id);
CREATE INDEX idx_shipments_destination_port ON shipments(destination_port_id);
CREATE INDEX idx_shipments_date ON shipments(shipment_date);
CREATE INDEX idx_shipments_hs_code ON shipments(hs_code);
CREATE INDEX idx_shipments_company_date ON shipments(company_id, shipment_date); -- Composite for company history queries

-- =====================================================
-- VIEW: shipment_details
-- Purpose: Denormalized view for fast drill-down queries
-- =====================================================
CREATE OR REPLACE VIEW shipment_details AS
SELECT
  s.id,
  s.shipment_date,
  s.arrival_date,
  s.vessel_name,
  s.container_count,
  s.weight_kg,
  s.volume_m3,
  s.unit_price,
  s.total_value,
  s.currency,
  s.freight_cost,
  s.invoice_number,
  s.bl_number,

  -- Company Info
  c.id AS company_id,
  c.name AS company_name,
  c.country AS company_country,
  c.type AS company_type,
  c.sector AS company_sector,

  -- Product Info
  p.id AS product_id,
  p.hs_code,
  p.description AS product_description,
  p.category AS product_category,

  -- Origin Port
  op.id AS origin_port_id,
  op.name AS origin_port_name,
  op.code AS origin_port_code,
  op.country AS origin_country,

  -- Destination Port
  dp.id AS destination_port_id,
  dp.name AS destination_port_name,
  dp.code AS destination_port_code,
  dp.country AS destination_country

FROM shipments s
INNER JOIN companies c ON s.company_id = c.id
INNER JOIN products p ON s.product_id = p.id
LEFT JOIN ports op ON s.origin_port_id = op.id
LEFT JOIN ports dp ON s.destination_port_id = dp.id;

-- =====================================================
-- FUNCTION: get_company_stats
-- Purpose: Get aggregated statistics for a company
-- =====================================================
CREATE OR REPLACE FUNCTION get_company_stats(company_uuid UUID)
RETURNS TABLE (
  total_shipments BIGINT,
  total_value NUMERIC,
  unique_products BIGINT,
  unique_routes BIGINT,
  first_shipment_date DATE,
  last_shipment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_shipments,
    SUM(s.total_value)::NUMERIC AS total_value,
    COUNT(DISTINCT s.product_id)::BIGINT AS unique_products,
    COUNT(DISTINCT (s.origin_port_id::TEXT || '-' || s.destination_port_id::TEXT))::BIGINT AS unique_routes,
    MIN(s.shipment_date)::DATE AS first_shipment_date,
    MAX(s.shipment_date)::DATE AS last_shipment_date
  FROM shipments s
  WHERE s.company_id = company_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: get_top_trade_partners
-- Purpose: Get top importing/exporting partners by volume
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_trade_partners(
  product_uuid UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  company_id UUID,
  company_name VARCHAR,
  company_country VARCHAR,
  total_shipments BIGINT,
  total_value NUMERIC,
  avg_unit_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS company_id,
    c.name AS company_name,
    c.country AS company_country,
    COUNT(*)::BIGINT AS total_shipments,
    SUM(s.total_value)::NUMERIC AS total_value,
    AVG(s.unit_price)::NUMERIC AS avg_unit_price
  FROM shipments s
  INNER JOIN companies c ON s.company_id = c.id
  WHERE product_uuid IS NULL OR s.product_id = product_uuid
  GROUP BY c.id, c.name, c.country
  ORDER BY total_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security) Policies
-- Note: Currently disabled for MVP demo
-- Enable after authentication implementation in Phase 7
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (allow all reads)
CREATE POLICY "Allow public read access to companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to ports" ON ports
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to shipments" ON shipments
  FOR SELECT USING (true);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON TABLE companies IS 'Stores importer/exporter company information for trade intelligence';
COMMENT ON TABLE ports IS 'Global port directory using UN/LOCODE standards';
COMMENT ON TABLE shipments IS 'Detailed shipment transaction history linking companies, products, and ports';
COMMENT ON VIEW shipment_details IS 'Denormalized view combining shipment, company, product, and port data for drill-down queries';
COMMENT ON FUNCTION get_company_stats IS 'Returns aggregated statistics (shipments, value, products) for a given company';
COMMENT ON FUNCTION get_top_trade_partners IS 'Returns top trade partners ranked by total transaction value, optionally filtered by product';