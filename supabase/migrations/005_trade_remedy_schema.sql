-- Migration 005: Trade Remedy Workbench Schema
-- Task 7.2: Trade Remedy Workbench
-- Automate anti-dumping evidence generation for legal petitions

-- =====================================================
-- TABLE: trade_remedy_cases
-- Purpose: Store trade remedy investigation cases
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_remedy_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL UNIQUE,
  case_name TEXT NOT NULL,
  petitioner_name TEXT,
  subject_product TEXT,
  hs_code VARCHAR(50),
  country_of_origin VARCHAR(100),
  
  -- Case dates
  petition_date DATE,
  investigation_start_date DATE,
  preliminary_determination_date DATE,
  final_determination_date DATE,
  
  -- Dumping calculations
  dumping_margin_percent NUMERIC,
  price_depression_percent NUMERIC,
  volume_impact_percent NUMERIC,
  
  -- Case status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'under_investigation', 'finalized'
  
  -- Metadata
  user_id UUID DEFAULT gen_random_uuid(), -- Mock user for demo
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trade_remedy_cases_case_number ON trade_remedy_cases(case_number);
CREATE INDEX idx_trade_remedy_cases_status ON trade_remedy_cases(status);
CREATE INDEX idx_trade_remedy_cases_user_id ON trade_remedy_cases(user_id);

-- =====================================================
-- TABLE: import_data_analysis
-- Purpose: Store import data analysis for dumping calculation
-- =====================================================
CREATE TABLE IF NOT EXISTS import_data_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES trade_remedy_cases(id) ON DELETE CASCADE,
  
  -- Import data points
  period_start DATE,
  period_end DATE,
  total_import_volume NUMERIC,
  total_import_value NUMERIC,
  average_unit_price NUMERIC,
  currency VARCHAR(10),
  
  -- Comparison data
  benchmark_price NUMERIC,
  market_price NUMERIC,
  domestic_price NUMERIC,
  
  -- Calculations
  dumping_amount NUMERIC, -- export_price - normal_value
  dumping_margin NUMERIC, -- ((export_price - normal_value) / normal_value) * 100
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_import_data_analysis_case_id ON import_data_analysis(case_id);

-- =====================================================
-- TABLE: injury_analysis
-- Purpose: Store injury analysis data for causation
-- =====================================================
CREATE TABLE IF NOT EXISTS injury_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES trade_remedy_cases(id) ON DELETE CASCADE,
  
  -- Market indicators
  domestic_market_share_loss NUMERIC, -- percentage
  price_depression NUMERIC, -- percentage
  revenue_loss NUMERIC, -- currency amount
  employment_impact INTEGER, -- number of jobs
  
  -- Financial impact
  estimated_revenue_loss NUMERIC,
  profit_margin_impact NUMERIC,
  
  -- Causation evidence
  causation_established BOOLEAN,
  causation_summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_injury_analysis_case_id ON injury_analysis(case_id);

-- =====================================================
-- TABLE: trade_remedy_evidence
-- Purpose: Store generated evidence documents and reports
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_remedy_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES trade_remedy_cases(id) ON DELETE CASCADE,
  
  document_type VARCHAR(50), -- 'petition', 'preliminary_evidence', 'final_evidence', 'injury_analysis'
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  
  -- Report metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sections JSONB, -- Sections included in report
  charts_data JSONB, -- Chart data and visualizations
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trade_remedy_evidence_case_id ON trade_remedy_evidence(case_id);

-- =====================================================
-- FUNCTION: update_trade_remedy_timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_trade_remedy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trade_remedy_timestamp
  BEFORE UPDATE ON trade_remedy_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_remedy_timestamp();

-- =====================================================
-- FUNCTION: calculate_dumping_margin
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_dumping_margin(
  export_price NUMERIC,
  normal_value NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  IF normal_value = 0 OR normal_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN ((export_price - normal_value) / normal_value) * 100;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: trade_remedy_case_summary
-- Purpose: Aggregated view of trade remedy cases
-- =====================================================
CREATE OR REPLACE VIEW trade_remedy_case_summary AS
SELECT
  c.id,
  c.case_number,
  c.case_name,
  c.subject_product,
  c.hs_code,
  c.country_of_origin,
  c.status,
  c.dumping_margin_percent,
  c.price_depression_percent,
  c.volume_impact_percent,
  COUNT(DISTINCT ida.id) AS data_points_count,
  COUNT(DISTINCT ia.id) AS injury_analyses_count,
  COUNT(DISTINCT e.id) AS evidence_documents_count,
  c.created_at
FROM trade_remedy_cases c
LEFT JOIN import_data_analysis ida ON c.id = ida.case_id
LEFT JOIN injury_analysis ia ON c.id = ia.case_id
LEFT JOIN trade_remedy_evidence e ON c.id = e.case_id
GROUP BY c.id;

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================
ALTER TABLE trade_remedy_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_data_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_remedy_evidence ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (allow all access)
CREATE POLICY "Allow public access to trade_remedy_cases" ON trade_remedy_cases
  FOR ALL USING (true);

CREATE POLICY "Allow public access to import_data_analysis" ON import_data_analysis
  FOR ALL USING (true);

CREATE POLICY "Allow public access to injury_analysis" ON injury_analysis
  FOR ALL USING (true);

CREATE POLICY "Allow public access to trade_remedy_evidence" ON trade_remedy_evidence
  FOR ALL USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE trade_remedy_cases IS 'Trade remedy investigation cases for anti-dumping petitions';
COMMENT ON TABLE import_data_analysis IS 'Import data analysis for dumping margin calculations';
COMMENT ON TABLE injury_analysis IS 'Injury analysis data for causation evidence';
COMMENT ON TABLE trade_remedy_evidence IS 'Generated evidence documents and reports';
COMMENT ON FUNCTION calculate_dumping_margin IS 'Calculates dumping margin percentage';

