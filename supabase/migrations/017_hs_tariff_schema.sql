-- Migration 017: HS Tariff Backend Schema
-- Purpose: Create comprehensive tariff and HS code database for ezHS-style functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For accent-insensitive search

-- =====================================================
-- TABLE: tariff_types
-- Stores different tariff types (PDK2022, ATIGA, RCEP, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS tariff_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,  -- e.g., 'PDK2022', 'ATIGA'
  name VARCHAR(255) NOT NULL,  -- Full name
  version_date DATE,  -- Version date
  legal_ref VARCHAR(500),  -- Legal reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tariff_types_code ON tariff_types(code);

-- =====================================================
-- TABLE: hs_codes
-- Core HS code table with descriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter VARCHAR(2) NOT NULL,  -- 2-digit chapter
  heading VARCHAR(4) NOT NULL,  -- 4-digit heading
  subheading VARCHAR(6),  -- 6-digit subheading
  code8 VARCHAR(8) NOT NULL,  -- 8-digit code
  code10 VARCHAR(10),  -- 10-digit code
  description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL,  -- kg, pcs, tonnes, etc.
  keywords TEXT[],  -- Array of search keywords
  category VARCHAR(100),  -- Industry category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_code8 UNIQUE(code8),
  CONSTRAINT unique_code10 UNIQUE(code10)
);

CREATE INDEX idx_hs_codes_code8 ON hs_codes(code8);
CREATE INDEX idx_hs_codes_code10 ON hs_codes(code10);
CREATE INDEX idx_hs_codes_chapter ON hs_codes(chapter);
CREATE INDEX idx_hs_codes_description ON hs_codes USING gin(to_tsvector('english', description));
CREATE INDEX idx_hs_codes_keywords ON hs_codes USING gin(keywords);
CREATE INDEX idx_hs_codes_category ON hs_codes(category);

-- Trigram index for fuzzy search
CREATE INDEX idx_hs_codes_description_trgm ON hs_codes USING gin(description gin_trgm_ops);

-- =====================================================
-- TABLE: duty_rates
-- MFN duty rates (PDK 2022, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  tariff_type_id UUID NOT NULL REFERENCES tariff_types(id) ON DELETE CASCADE,
  ad_valorem DECIMAL(5,2),  -- Ad valorem rate (%)
  specific DECIMAL(12,2),  -- Specific duty amount
  unit VARCHAR(20),  -- Unit for specific duty
  note TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_hs_tariff_effective UNIQUE(hs_code_id, tariff_type_id, effective_from)
);

CREATE INDEX idx_duty_rates_hs_code ON duty_rates(hs_code_id);
CREATE INDEX idx_duty_rates_tariff_type ON duty_rates(tariff_type_id);
CREATE INDEX idx_duty_rates_effective ON duty_rates(effective_from, effective_to);

-- =====================================================
-- TABLE: fta_staging
-- FTA preferential rates by origin and year
-- =====================================================
CREATE TABLE IF NOT EXISTS fta_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  tariff_type_id UUID NOT NULL REFERENCES tariff_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  pref_ad_valorem DECIMAL(5,2),  -- Preferential ad valorem rate
  pref_specific DECIMAL(12,2),  -- Preferential specific duty
  unit VARCHAR(20),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_fta_rate UNIQUE(hs_code_id, tariff_type_id, year)
);

CREATE INDEX idx_fta_staging_hs_code ON fta_staging(hs_code_id);
CREATE INDEX idx_fta_staging_tariff_type ON fta_staging(tariff_type_id);
CREATE INDEX idx_fta_staging_year ON fta_staging(year);

-- =====================================================
-- TABLE: rules_of_origin
-- Rules of Origin for FTA requirements
-- =====================================================
CREATE TABLE IF NOT EXISTS rules_of_origin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tariff_type_id UUID NOT NULL REFERENCES tariff_types(id) ON DELETE CASCADE,
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  cumulation_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roo_tariff_type ON rules_of_origin(tariff_type_id);
CREATE INDEX idx_roo_hs_code ON rules_of_origin(hs_code_id);

-- =====================================================
-- TABLE: indirect_tax
-- SST and Excise tax data
-- =====================================================
CREATE TABLE IF NOT EXISTS indirect_tax (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  sst_rate DECIMAL(5,2),  -- SST rate (%)
  excise_rate DECIMAL(5,2),  -- Excise rate (%)
  sst_note TEXT,
  excise_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_indirect_tax UNIQUE(hs_code_id)
);

CREATE INDEX idx_indirect_tax_hs_code ON indirect_tax(hs_code_id);

-- =====================================================
-- TABLE: restrictions
-- Import/export restrictions and licensing
-- =====================================================
CREATE TABLE IF NOT EXISTS restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  import_prohibited BOOLEAN DEFAULT false,
  export_prohibited BOOLEAN DEFAULT false,
  ap_required BOOLEAN DEFAULT false,  -- AP = Approved Permit
  legal_ref VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_restrictions UNIQUE(hs_code_id)
);

CREATE INDEX idx_restrictions_hs_code ON restrictions(hs_code_id);
CREATE INDEX idx_restrictions_import_prohibited ON restrictions(import_prohibited);
CREATE INDEX idx_restrictions_export_prohibited ON restrictions(export_prohibited);

-- =====================================================
-- TABLE: source_files
-- Track imported files
-- =====================================================
CREATE TABLE IF NOT EXISTS source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  checksum VARCHAR(64),
  published_on DATE,
  parsed_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parser_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_source_files_name ON source_files(file_name);

-- =====================================================
-- TABLE: search_terms
-- Search term synonyms for better search
-- =====================================================
CREATE TABLE IF NOT EXISTS search_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID NOT NULL REFERENCES hs_codes(id) ON DELETE CASCADE,
  term VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_terms_hs_code ON search_terms(hs_code_id);
CREATE INDEX idx_search_terms_term ON search_terms(term);
CREATE INDEX idx_search_terms_term_trgm ON search_terms USING gin(term gin_trgm_ops);

-- =====================================================
-- VIEW: hs_code_summary
-- View for fast HS code lookups with tariff summary
-- =====================================================
CREATE OR REPLACE VIEW hs_code_summary AS
SELECT 
  hc.id,
  hc.code8,
  hc.code10,
  hc.description,
  hc.unit,
  hc.category,
  hc.keywords,
  -- Get MFN rate
  (
    SELECT dr.ad_valorem 
    FROM duty_rates dr
    JOIN tariff_types tt ON dr.tariff_type_id = tt.id
    WHERE dr.hs_code_id = hc.id 
      AND tt.code = 'PDK2022'
      AND dr.effective_from <= CURRENT_DATE
      AND (dr.effective_to IS NULL OR dr.effective_to >= CURRENT_DATE)
    ORDER BY dr.effective_from DESC
    LIMIT 1
  ) as mfn_rate,
  -- Get current year FTA rates count
  (
    SELECT COUNT(*) 
    FROM fta_staging fs
    WHERE fs.hs_code_id = hc.id 
      AND fs.year = EXTRACT(YEAR FROM CURRENT_DATE)
  ) as fta_agreements_count,
  -- Check if restricted
  COALESCE(r.import_prohibited OR r.export_prohibited, false) as has_restrictions
FROM hs_codes hc
LEFT JOIN restrictions r ON r.hs_code_id = hc.id;

-- Enable RLS on all tables
ALTER TABLE tariff_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fta_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_of_origin ENABLE ROW LEVEL SECURITY;
ALTER TABLE indirect_tax ENABLE ROW LEVEL SECURITY;
ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all reads for authenticated and anon users)
CREATE POLICY "tariff_types_select" ON tariff_types FOR SELECT USING (true);
CREATE POLICY "hs_codes_select" ON hs_codes FOR SELECT USING (true);
CREATE POLICY "duty_rates_select" ON duty_rates FOR SELECT USING (true);
CREATE POLICY "fta_staging_select" ON fta_staging FOR SELECT USING (true);
CREATE POLICY "rules_of_origin_select" ON rules_of_origin FOR SELECT USING (true);
CREATE POLICY "indirect_tax_select" ON indirect_tax FOR SELECT USING (true);
CREATE POLICY "restrictions_select" ON restrictions FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE tariff_types IS 'Tariff types like PDK2022, ATIGA, RCEP, CPTPP, etc.';
COMMENT ON TABLE hs_codes IS 'Core HS code table with 8 and 10-digit codes';
COMMENT ON TABLE duty_rates IS 'MFN duty rates by tariff type with effective dates';
COMMENT ON TABLE fta_staging IS 'FTA preferential rates by origin/year';
COMMENT ON TABLE rules_of_origin IS 'Rules of Origin requirements for FTAs';
COMMENT ON TABLE indirect_tax IS 'SST and Excise tax rates';
COMMENT ON TABLE restrictions IS 'Import/export restrictions and licensing requirements';

