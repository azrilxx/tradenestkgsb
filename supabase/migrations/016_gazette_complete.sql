-- Migration 016: Complete Gazette Schema with Analytics
-- Combines migrations 004 and 015 for easy setup
-- Creates base tables and adds enhanced analytics fields

-- =====================================================
-- PART 1: Base Tables (from migration 004)
-- =====================================================

-- TABLE: gazettes
CREATE TABLE IF NOT EXISTS gazettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gazette_number VARCHAR(100) NOT NULL UNIQUE,
  publication_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  pdf_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  extracted_data JSONB,
  -- Enhanced fields from 015
  sector VARCHAR(100),
  estimated_impact_value DECIMAL(15, 2),
  duty_rate_min DECIMAL(5, 2),
  duty_rate_max DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: gazette_affected_items
CREATE TABLE IF NOT EXISTS gazette_affected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gazette_id UUID NOT NULL REFERENCES gazettes(id) ON DELETE CASCADE,
  hs_codes TEXT[],
  affected_countries TEXT[],
  summary TEXT,
  remedy_type VARCHAR(100),
  expiry_date DATE,
  -- Enhanced fields from 015
  duty_rate DECIMAL(5, 2),
  affected_companies_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: gazette_subscriptions
CREATE TABLE IF NOT EXISTS gazette_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT gen_random_uuid(),
  hs_code VARCHAR(50),
  country_code VARCHAR(10),
  category VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 2: NEW TABLE from 015
-- =====================================================

CREATE TABLE IF NOT EXISTS gazette_sector_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gazette_id UUID NOT NULL REFERENCES gazettes(id) ON DELETE CASCADE,
  sector VARCHAR(100) NOT NULL,
  affected_hs_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  estimated_import_value DECIMAL(15, 2),
  companies_affected INTEGER,
  duty_rate_range VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_gazettes_category ON gazettes(category);
CREATE INDEX IF NOT EXISTS idx_gazettes_publication_date ON gazettes(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_gazettes_gazette_number ON gazettes(gazette_number);
CREATE INDEX IF NOT EXISTS idx_gazettes_extracted_data ON gazettes USING GIN (extracted_data);
CREATE INDEX IF NOT EXISTS idx_gazettes_sector ON gazettes(sector);

CREATE INDEX IF NOT EXISTS idx_gazette_affected_items_gazette_id ON gazette_affected_items(gazette_id);
CREATE INDEX IF NOT EXISTS idx_gazette_affected_items_hs_codes ON gazette_affected_items USING GIN (hs_codes);
CREATE INDEX IF NOT EXISTS idx_gazette_affected_items_expiry_date ON gazette_affected_items(expiry_date);

CREATE INDEX IF NOT EXISTS idx_gazette_subscriptions_user_id ON gazette_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_gazette_subscriptions_active ON gazette_subscriptions(active);

CREATE INDEX IF NOT EXISTS idx_gazette_sector_impact_gazette_id ON gazette_sector_impact(gazette_id);
CREATE INDEX IF NOT EXISTS idx_gazette_sector_impact_sector ON gazette_sector_impact(sector);
CREATE INDEX IF NOT EXISTS idx_gazette_sector_impact_hs_codes ON gazette_sector_impact USING GIN (affected_hs_codes);

-- =====================================================
-- Functions
-- =====================================================

CREATE OR REPLACE FUNCTION update_gazettes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_gazettes_timestamp
  BEFORE UPDATE ON gazettes
  FOR EACH ROW
  EXECUTE FUNCTION update_gazettes_timestamp();

CREATE OR REPLACE FUNCTION get_gazettes_by_hs_code(hs_code_param VARCHAR)
RETURNS TABLE (
  gazette_id UUID,
  gazette_number VARCHAR,
  publication_date DATE,
  category VARCHAR,
  summary TEXT,
  remedy_type VARCHAR,
  expiry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.gazette_number,
    g.publication_date,
    g.category,
    gai.summary,
    gai.remedy_type,
    gai.expiry_date
  FROM gazettes g
  JOIN gazette_affected_items gai ON g.id = gai.gazette_id
  WHERE hs_code_param = ANY(gai.hs_codes)
  ORDER BY g.publication_date DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recent_gazettes(
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0,
  category_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  gazette_id UUID,
  gazette_number VARCHAR,
  publication_date DATE,
  category VARCHAR,
  title TEXT,
  summary TEXT,
  pdf_url TEXT,
  affected_items_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.gazette_number,
    g.publication_date,
    g.category,
    g.title,
    g.summary,
    g.pdf_url,
    COUNT(gai.id)::BIGINT AS affected_items_count
  FROM gazettes g
  LEFT JOIN gazette_affected_items gai ON g.id = gai.gazette_id
  WHERE (category_filter IS NULL OR g.category = category_filter)
  GROUP BY g.id
  ORDER BY g.publication_date DESC
  LIMIT limit_param OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views
-- =====================================================

CREATE OR REPLACE VIEW gazette_summary AS
SELECT
  g.id,
  g.gazette_number,
  g.publication_date,
  g.category,
  g.title,
  g.summary,
  g.pdf_url,
  COUNT(DISTINCT gai.hs_codes) AS unique_hs_codes,
  COUNT(DISTINCT gai.affected_countries) AS unique_countries,
  ARRAY_AGG(DISTINCT gai.remedy_type) FILTER (WHERE gai.remedy_type IS NOT NULL) AS remedy_types
FROM gazettes g
LEFT JOIN gazette_affected_items gai ON g.id = gai.gazette_id
GROUP BY g.id, g.gazette_number, g.publication_date, g.category, g.title, g.summary, g.pdf_url;

-- Analytics views from 015
CREATE OR REPLACE VIEW v_gazette_sector_summary AS
WITH unnested_countries AS (
  SELECT DISTINCT g.id, sector, UNNEST(gai.affected_countries) AS country
  FROM gazettes g
  LEFT JOIN gazette_affected_items gai ON g.id = gai.gazette_id
  WHERE gai.affected_countries IS NOT NULL
)
SELECT
  g.sector,
  COUNT(DISTINCT g.id) AS affected_gazettes,
  SUM(g.estimated_impact_value) AS total_value_at_risk,
  AVG(g.duty_rate_min) AS avg_min_duty_rate,
  AVG(g.duty_rate_max) AS avg_max_duty_rate,
  COUNT(DISTINCT gai.hs_codes) AS unique_hs_codes_affected,
  (SELECT COUNT(DISTINCT country) FROM unnested_countries uc WHERE uc.sector = g.sector) AS unique_countries_affected
FROM gazettes g
LEFT JOIN gazette_affected_items gai ON g.id = gai.gazette_id
WHERE g.sector IS NOT NULL
GROUP BY g.sector
ORDER BY total_value_at_risk DESC NULLS LAST;

CREATE OR REPLACE VIEW v_gazette_geographic_risk AS
SELECT
  country,
  COUNT(DISTINCT g.id) AS active_measures,
  COUNT(DISTINCT hs_code) AS affected_product_categories,
  AVG(gai.duty_rate) AS avg_duty_rate,
  STRING_AGG(DISTINCT g.category, ', ') AS measure_types
FROM gazette_affected_items gai
JOIN gazettes g ON gai.gazette_id = g.id
CROSS JOIN LATERAL UNNEST(gai.affected_countries) AS country
CROSS JOIN LATERAL UNNEST(gai.hs_codes) AS hs_code
WHERE gai.affected_countries IS NOT NULL 
  AND ARRAY_LENGTH(gai.affected_countries, 1) > 0
  AND (gai.expiry_date IS NULL OR gai.expiry_date > CURRENT_DATE)
GROUP BY country
ORDER BY active_measures DESC;

CREATE OR REPLACE VIEW v_gazette_monthly_trends AS
SELECT
  DATE_TRUNC('month', publication_date) AS month,
  category,
  COUNT(*) AS gazette_count,
  SUM(estimated_impact_value) AS total_impact_value,
  AVG(duty_rate_max) AS avg_duty_rate
FROM gazettes
GROUP BY DATE_TRUNC('month', publication_date), category
ORDER BY month DESC;

CREATE OR REPLACE VIEW v_expiring_measures AS
SELECT
  g.id AS gazette_id,
  g.gazette_number,
  g.title,
  g.category,
  g.publication_date,
  gai.expiry_date,
  gai.hs_codes,
  gai.affected_countries,
  gai.remedy_type,
  (gai.expiry_date - CURRENT_DATE) AS days_remaining
FROM gazettes g
JOIN gazette_affected_items gai ON g.id = gai.gazette_id
WHERE gai.expiry_date IS NOT NULL
  AND gai.expiry_date > CURRENT_DATE
  AND gai.expiry_date <= CURRENT_DATE + INTERVAL '180 days'
ORDER BY gai.expiry_date ASC;

CREATE OR REPLACE VIEW v_top_affected_hs_codes AS
SELECT
  hs_code,
  COUNT(DISTINCT gai.gazette_id) AS gazette_count,
  COUNT(DISTINCT g.sector) AS sectors_affected,
  AVG(gai.duty_rate) AS avg_duty_rate,
  SUM(g.estimated_impact_value) AS total_value_impact
FROM gazette_affected_items gai
JOIN gazettes g ON gai.gazette_id = g.id
CROSS JOIN LATERAL UNNEST(gai.hs_codes) AS hs_code
WHERE gai.hs_codes IS NOT NULL 
  AND ARRAY_LENGTH(gai.hs_codes, 1) > 0
GROUP BY hs_code
ORDER BY gazette_count DESC, total_value_impact DESC NULLS LAST
LIMIT 50;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE gazettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_affected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_sector_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to gazettes" ON gazettes FOR ALL USING (true);
CREATE POLICY "Allow public access to gazette_affected_items" ON gazette_affected_items FOR ALL USING (true);
CREATE POLICY "Allow public access to gazette_subscriptions" ON gazette_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow public access to gazette_sector_impact" ON gazette_sector_impact FOR ALL USING (true);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE gazettes IS 'Malaysian Federal Gazette entries for trade remedies with analytics';
COMMENT ON TABLE gazette_affected_items IS 'Products and countries affected by gazette announcements';
COMMENT ON TABLE gazette_subscriptions IS 'User subscriptions for gazette notifications';
COMMENT ON TABLE gazette_sector_impact IS 'Industry sector-level impact tracking for gazette measures';
COMMENT ON VIEW gazette_summary IS 'Aggregated view of gazettes with counts of affected items';
COMMENT ON VIEW v_gazette_sector_summary IS 'Aggregated sector impact statistics for dashboard analytics';
COMMENT ON VIEW v_gazette_geographic_risk IS 'Country-level risk assessment for geographic heat maps';
COMMENT ON VIEW v_gazette_monthly_trends IS 'Time series data for trend analysis and forecasting';
COMMENT ON VIEW v_expiring_measures IS 'Gazette measures expiring in the next 180 days for alert tracking';
COMMENT ON VIEW v_top_affected_hs_codes IS 'Most frequently affected product codes across all gazettes';

