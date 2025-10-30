-- Migration 015: Gazette Industry Analytics & Enhanced Data Model
-- Add industry impact tracking and analytics views for premium dashboard

-- =====================================================
-- ENHANCE EXISTING TABLES
-- =====================================================

-- Add industry impact fields to gazettes table
ALTER TABLE gazettes ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE gazettes ADD COLUMN IF NOT EXISTS estimated_impact_value DECIMAL(15, 2);
ALTER TABLE gazettes ADD COLUMN IF NOT EXISTS duty_rate_min DECIMAL(5, 2);
ALTER TABLE gazettes ADD COLUMN IF NOT EXISTS duty_rate_max DECIMAL(5, 2);

-- Add performance tracking to gazette_affected_items
ALTER TABLE gazette_affected_items ADD COLUMN IF NOT EXISTS duty_rate DECIMAL(5, 2);
ALTER TABLE gazette_affected_items ADD COLUMN IF NOT EXISTS affected_companies_count INTEGER;

-- Create index for sector filtering
CREATE INDEX IF NOT EXISTS idx_gazettes_sector ON gazettes(sector);

-- =====================================================
-- NEW TABLE: gazette_sector_impact
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

CREATE INDEX idx_gazette_sector_impact_gazette_id ON gazette_sector_impact(gazette_id);
CREATE INDEX idx_gazette_sector_impact_sector ON gazette_sector_impact(sector);
CREATE INDEX idx_gazette_sector_impact_hs_codes ON gazette_sector_impact USING GIN (affected_hs_codes);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View: Sector Summary - Aggregated impacts by sector
CREATE OR REPLACE VIEW v_gazette_sector_summary AS
SELECT
  sector,
  COUNT(DISTINCT g.id) AS affected_gazettes,
  SUM(estimated_impact_value) AS total_value_at_risk,
  AVG(duty_rate_min) AS avg_min_duty_rate,
  AVG(duty_rate_max) AS avg_max_duty_rate,
  COUNT(DISTINCT gai.hs_codes) AS unique_hs_codes_affected,
  COUNT(DISTINCT UNNEST(gai.affected_countries)) AS unique_countries_affected
FROM gazettes g
LEFT JOIN gazette_affected_items gai ON g.id = gai.gazette_id
WHERE sector IS NOT NULL
GROUP BY sector
ORDER BY total_value_at_risk DESC NULLS LAST;

-- View: Geographic Risk - Country-level risk assessment
CREATE OR REPLACE VIEW v_gazette_geographic_risk AS
SELECT
  country,
  COUNT(DISTINCT g.id) AS active_measures,
  COUNT(DISTINCT UNNEST(gai.hs_codes)) AS affected_product_categories,
  AVG(gai.duty_rate) AS avg_duty_rate,
  STRING_AGG(DISTINCT g.category, ', ') AS measure_types
FROM gazette_affected_items gai
JOIN gazettes g ON gai.gazette_id = g.id
CROSS JOIN LATERAL UNNEST(gai.affected_countries) AS country
WHERE gai.affected_countries IS NOT NULL 
  AND ARRAY_LENGTH(gai.affected_countries, 1) > 0
  AND (gai.expiry_date IS NULL OR gai.expiry_date > CURRENT_DATE)
GROUP BY country
ORDER BY active_measures DESC;

-- View: Monthly Trends - Time series data for charts
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

-- View: Expiring Measures - Alerts for upcoming expirations
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

-- View: Top Affected HS Codes
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
-- RLS POLICIES
-- =====================================================

ALTER TABLE gazette_sector_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to gazette_sector_impact" ON gazette_sector_impact
  FOR ALL USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE gazette_sector_impact IS 'Industry sector-level impact tracking for gazette measures';
COMMENT ON VIEW v_gazette_sector_summary IS 'Aggregated sector impact statistics for dashboard analytics';
COMMENT ON VIEW v_gazette_geographic_risk IS 'Country-level risk assessment for geographic heat maps';
COMMENT ON VIEW v_gazette_monthly_trends IS 'Time series data for trend analysis and forecasting';
COMMENT ON VIEW v_expiring_measures IS 'Gazette measures expiring in the next 180 days for alert tracking';
COMMENT ON VIEW v_top_affected_hs_codes IS 'Most frequently affected product codes across all gazettes';

