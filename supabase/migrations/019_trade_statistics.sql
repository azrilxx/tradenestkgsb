-- Migration 019: Trade Statistics Table
-- Purpose: Store MATRADE trade statistics for benchmarking and analysis
-- Date: 2025-10-28

-- =====================================================
-- TABLE: trade_statistics
-- Stores aggregated trade data from MATRADE
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  country VARCHAR(100),
  sector VARCHAR(200),
  export_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  import_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL DEFAULT 'MATRADE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trade_stats_year ON trade_statistics(year DESC);
CREATE INDEX IF NOT EXISTS idx_trade_stats_year_month ON trade_statistics(year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_trade_stats_country ON trade_statistics(country);
CREATE INDEX IF NOT EXISTS idx_trade_stats_sector ON trade_statistics(sector);
CREATE INDEX IF NOT EXISTS idx_trade_stats_source ON trade_statistics(source);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_trade_stats_date_range ON trade_statistics(year, month);

-- Comments for documentation
COMMENT ON TABLE trade_statistics IS 'Aggregated trade statistics from MATRADE government data';
COMMENT ON COLUMN trade_statistics.year IS 'Year of trade statistic';
COMMENT ON COLUMN trade_statistics.month IS 'Month of trade statistic (1-12)';
COMMENT ON COLUMN trade_statistics.country IS 'Country or region (for geographical data)';
COMMENT ON COLUMN trade_statistics.sector IS 'Industry sector or product category (SITC code)';
COMMENT ON COLUMN trade_statistics.export_value IS 'Total export value in USD';
COMMENT ON COLUMN trade_statistics.import_value IS 'Total import value in USD';
COMMENT ON COLUMN trade_statistics.source IS 'Data source: MATRADE or other';

-- Enable RLS
ALTER TABLE trade_statistics ENABLE ROW LEVEL SECURITY;

-- Public read access for demo purposes
CREATE POLICY "Public read access" ON trade_statistics FOR SELECT USING (true);

