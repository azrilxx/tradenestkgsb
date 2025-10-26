-- Migration 004: Gazette Tracker Schema
-- Task 7.1: Malaysian Gazette Tracker
-- Monitor Malaysian government gazettes for trade remedy announcements

-- =====================================================
-- TABLE: gazettes
-- Purpose: Store gazette entries from Malaysian Federal Gazette
-- =====================================================
CREATE TABLE IF NOT EXISTS gazettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gazette_number VARCHAR(100) NOT NULL UNIQUE,
  publication_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'trade_remedy', 'tariff_change', 'import_restriction', 'anti_dumping'
  pdf_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  extracted_data JSONB, -- Full extracted text or structured data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_gazettes_category ON gazettes(category);
CREATE INDEX idx_gazettes_publication_date ON gazettes(publication_date DESC);
CREATE INDEX idx_gazettes_gazette_number ON gazettes(gazette_number);
CREATE INDEX idx_gazettes_extracted_data ON gazettes USING GIN (extracted_data);

-- =====================================================
-- TABLE: gazette_affected_items
-- Purpose: Link gazettes to affected products and countries
-- =====================================================
CREATE TABLE IF NOT EXISTS gazette_affected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gazette_id UUID NOT NULL REFERENCES gazettes(id) ON DELETE CASCADE,
  hs_codes TEXT[], -- Array of affected HS codes
  affected_countries TEXT[], -- Array of affected country codes
  summary TEXT,
  remedy_type VARCHAR(100), -- 'anti_dumping', 'countervailing', 'safeguard'
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gazette_affected_items_gazette_id ON gazette_affected_items(gazette_id);
CREATE INDEX idx_gazette_affected_items_hs_codes ON gazette_affected_items USING GIN (hs_codes);
CREATE INDEX idx_gazette_affected_items_expiry_date ON gazette_affected_items(expiry_date);

-- =====================================================
-- TABLE: gazette_subscriptions
-- Purpose: Track user watchlist for gazette notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS gazette_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT gen_random_uuid(), -- Mock user for demo
  hs_code VARCHAR(50),
  country_code VARCHAR(10),
  category VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gazette_subscriptions_user_id ON gazette_subscriptions(user_id);
CREATE INDEX idx_gazette_subscriptions_active ON gazette_subscriptions(active);

-- =====================================================
-- FUNCTION: update_gazettes_timestamp
-- Purpose: Auto-update updated_at field
-- =====================================================
CREATE OR REPLACE FUNCTION update_gazettes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gazettes_timestamp
  BEFORE UPDATE ON gazettes
  FOR EACH ROW
  EXECUTE FUNCTION update_gazettes_timestamp();

-- =====================================================
-- FUNCTION: get_gazettes_by_hs_code
-- Purpose: Find gazettes affecting specific HS codes
-- =====================================================
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

-- =====================================================
-- FUNCTION: get_recent_gazettes
-- Purpose: Get recent gazettes with pagination
-- =====================================================
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
-- VIEW: gazette_summary
-- Purpose: Aggregated view of gazettes with counts
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

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================
ALTER TABLE gazettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_affected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (allow all access)
CREATE POLICY "Allow public access to gazettes" ON gazettes
  FOR ALL USING (true);

CREATE POLICY "Allow public access to gazette_affected_items" ON gazette_affected_items
  FOR ALL USING (true);

CREATE POLICY "Allow public access to gazette_subscriptions" ON gazette_subscriptions
  FOR ALL USING (true);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON TABLE gazettes IS 'Malaysian Federal Gazette entries for trade remedies';
COMMENT ON TABLE gazette_affected_items IS 'Products and countries affected by gazette announcements';
COMMENT ON TABLE gazette_subscriptions IS 'User subscriptions for gazette notifications';
COMMENT ON VIEW gazette_summary IS 'Aggregated view of gazettes with counts of affected items';
