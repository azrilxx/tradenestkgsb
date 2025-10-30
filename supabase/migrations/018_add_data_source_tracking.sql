-- Migration 018: Add Data Source Tracking
-- Purpose: Track data origin for real vs mock data differentiation
-- Date: 2025-10-28

-- =====================================================
-- Add source column to fx_rates
-- =====================================================
ALTER TABLE fx_rates 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MOCK';

-- Update existing data
UPDATE fx_rates SET source = 'MOCK' WHERE source IS NULL;

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_fx_source ON fx_rates(source);

-- =====================================================
-- Add source column to price_data
-- =====================================================
ALTER TABLE price_data 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MOCK';

-- Update existing data
UPDATE price_data SET source = 'MOCK' WHERE source IS NULL;

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_price_source ON price_data(source);

-- =====================================================
-- Add data quality fields to shipments
-- =====================================================
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MOCK',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 50;

-- Update existing data
UPDATE shipments SET source = 'MOCK', data_quality_score = 50 
WHERE source IS NULL OR data_quality_score IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipment_source ON shipments(source);
CREATE INDEX IF NOT EXISTS idx_shipment_quality ON shipments(data_quality_score);

-- Add comments for documentation
COMMENT ON COLUMN fx_rates.source IS 'Data source: BNM (Bank Negara Malaysia), MOCK, or other';
COMMENT ON COLUMN price_data.source IS 'Data source: MATRADE, DOSM, MOCK, or other';
COMMENT ON COLUMN shipments.source IS 'Data source: MOCK, MATRADE, or commercial provider';
COMMENT ON COLUMN shipments.data_quality_score IS 'Data quality score 0-100 (100=real, 50=mock, 75=enhanced)';

-- Create view for data quality metrics
CREATE OR REPLACE VIEW data_source_health AS
SELECT 
  'fx_rates' as table_name,
  source,
  COUNT(*) as record_count,
  MAX(date) as last_updated,
  MIN(date) as first_record,
  CASE 
    WHEN MAX(date) < CURRENT_DATE - INTERVAL '7 days' THEN true
    ELSE false
  END as is_stale
FROM fx_rates
GROUP BY source
UNION ALL
SELECT 
  'price_data' as table_name,
  source,
  COUNT(*) as record_count,
  MAX(date) as last_updated,
  MIN(date) as first_record,
  CASE 
    WHEN MAX(date) < CURRENT_DATE - INTERVAL '90 days' THEN true
    ELSE false
  END as is_stale
FROM price_data
GROUP BY source;

-- Grant permissions
GRANT SELECT ON data_source_health TO anon, authenticated;

