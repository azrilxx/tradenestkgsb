-- Migration 003: Custom Rules Schema
-- Task 6.3: Add custom rule builder functionality

-- =====================================================
-- TABLE: custom_rules
-- Purpose: Store user-defined anomaly detection rules
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logic_json JSONB NOT NULL, -- Rule conditions and logic
  user_id UUID DEFAULT gen_random_uuid(), -- Mock user for demo
  active BOOLEAN DEFAULT true,
  alert_type VARCHAR(50) DEFAULT 'CUSTOM_PATTERN',
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_custom_rules_user_id ON custom_rules(user_id);
CREATE INDEX idx_custom_rules_active ON custom_rules(active);
CREATE INDEX idx_custom_rules_alert_type ON custom_rules(alert_type);
CREATE INDEX idx_custom_rules_severity ON custom_rules(severity);

-- =====================================================
-- TABLE: rule_executions
-- Purpose: Track when custom rules are executed and their results
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES custom_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matches_found INTEGER DEFAULT 0,
  anomalies_created INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  metadata JSONB -- Store execution details
);

-- Indexes for performance
CREATE INDEX idx_rule_executions_rule_id ON rule_executions(rule_id);
CREATE INDEX idx_rule_executions_executed_at ON rule_executions(executed_at DESC);

-- =====================================================
-- FUNCTION: update_custom_rules_timestamp
-- Purpose: Auto-update updated_at field
-- =====================================================
CREATE OR REPLACE FUNCTION update_custom_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_rules_timestamp
  BEFORE UPDATE ON custom_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_rules_timestamp();

-- =====================================================
-- FUNCTION: validate_rule_logic
-- Purpose: Validate rule JSON structure
-- =====================================================
CREATE OR REPLACE FUNCTION validate_rule_logic(rule_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if required fields exist
  IF NOT (rule_json ? 'conditions' AND rule_json ? 'logic') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if conditions is an array
  IF jsonb_typeof(rule_json->'conditions') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if logic is valid
  IF NOT (rule_json->>'logic' IN ('AND', 'OR')) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: get_rule_performance_stats
-- Purpose: Get performance statistics for a rule
-- =====================================================
CREATE OR REPLACE FUNCTION get_rule_performance_stats(rule_uuid UUID)
RETURNS TABLE (
  total_executions BIGINT,
  avg_matches_found NUMERIC,
  avg_execution_time_ms NUMERIC,
  total_anomalies_created BIGINT,
  last_execution TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_executions,
    AVG(re.matches_found)::NUMERIC AS avg_matches_found,
    AVG(re.execution_time_ms)::NUMERIC AS avg_execution_time_ms,
    SUM(re.anomalies_created)::BIGINT AS total_anomalies_created,
    MAX(re.executed_at) AS last_execution
  FROM rule_executions re
  WHERE re.rule_id = rule_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (allow all access)
CREATE POLICY "Allow public access to custom_rules" ON custom_rules
  FOR ALL USING (true);

CREATE POLICY "Allow public access to rule_executions" ON rule_executions
  FOR ALL USING (true);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON TABLE custom_rules IS 'User-defined anomaly detection rules with JSON logic';
COMMENT ON TABLE rule_executions IS 'Execution history and performance metrics for custom rules';
COMMENT ON FUNCTION validate_rule_logic IS 'Validates the JSON structure of custom rule logic';
COMMENT ON FUNCTION get_rule_performance_stats IS 'Returns performance statistics for a custom rule';
