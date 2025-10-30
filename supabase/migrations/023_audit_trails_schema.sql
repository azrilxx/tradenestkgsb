-- Migration 023: Audit Trails & Legal Defensibility Schema
-- Stage 7: Audit Trails & Legal Defensibility
-- Makes reports admissible in Malaysian trade remedy proceedings

-- =====================================================
-- TABLE: audit_logs
-- Purpose: Immutable append-only audit log
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  action_type VARCHAR(100) NOT NULL, -- 'report_generated', 'data_accessed', 'case_modified', 'evidence_downloaded'
  entity_type VARCHAR(100), -- 'alert', 'case', 'evidence', 'user_data'
  entity_id UUID, -- ID of the affected entity
  
  -- Who did it
  user_id UUID DEFAULT gen_random_uuid(), -- Will be real user_id when auth is implemented
  
  -- When it happened
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- What changed
  changes JSONB, -- Before/after state or action details
  metadata JSONB, -- Additional context (IP address, user agent, etc.)
  
  -- Audit integrity
  log_hash TEXT, -- SHA-256 hash of this log entry for tamper detection
  previous_log_hash TEXT, -- Link to previous log entry (chain of custody)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);

-- Make audit_logs immutable (no updates/deletes allowed via RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are append-only - no updates or deletes"
  ON audit_logs
  FOR ALL
  USING (false); -- Nobody can update or delete audit logs

-- Function to automatically calculate log hash
CREATE OR REPLACE FUNCTION calculate_audit_log_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate SHA-256 hash of the log entry (excluding the hash fields themselves)
  NEW.log_hash := encode(digest(
    NEW.id::text || NEW.action_type || 
    COALESCE(NEW.entity_type, '') || 
    COALESCE(NEW.entity_id::text, '') ||
    COALESCE(NEW.user_id::text, '') ||
    NEW.timestamp::text ||
    COALESCE(NEW.changes::text, '') ||
    COALESCE(NEW.metadata::text, ''),
    'sha256'
  ), 'hex');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_hash_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_log_hash();

-- =====================================================
-- TABLE: evidence_hashes
-- Purpose: Cryptographic hashes for PDF reports
-- =====================================================
CREATE TABLE IF NOT EXISTS evidence_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to the evidence
  evidence_id UUID, -- Can link to alert, anomaly, or trade_remedy_evidence
  evidence_type VARCHAR(100) NOT NULL, -- 'alert_pdf', 'case_pdf', 'evidence_pdf'
  
  -- File information
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_url TEXT,
  
  -- Cryptographic hash
  sha256_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the PDF content
  
  -- Generation metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID, -- User who generated the report
  generation_metadata JSONB, -- Additional context (alert details, case info, etc.)
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE, -- When hash was last verified
  verification_status VARCHAR(50) DEFAULT 'not_verified', -- 'not_verified', 'verified', 'tampered'
  
  -- Integration with audit log
  audit_log_id UUID REFERENCES audit_logs(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for evidence_hashes
CREATE INDEX idx_evidence_hashes_evidence ON evidence_hashes(evidence_type, evidence_id);
CREATE INDEX idx_evidence_hashes_hash ON evidence_hashes(sha256_hash);
CREATE INDEX idx_evidence_hashes_generated ON evidence_hashes(generated_at);

-- =====================================================
-- TABLE: data_lineage
-- Purpose: Track data sources and transformations
-- =====================================================
CREATE TABLE IF NOT EXISTS data_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What data this lineage tracks
  entity_type VARCHAR(100) NOT NULL, -- 'alert', 'case', 'benchmark', 'report'
  entity_id UUID NOT NULL,
  
  -- Data sources
  source_type VARCHAR(100) NOT NULL, -- 'bnm', 'matrade', 'user_upload', 'calculated'
  source_id UUID, -- Link to specific data record
  source_description TEXT, -- Human-readable description
  
  -- Data processing
  transformation_steps JSONB, -- Array of transformation operations
  
  -- Calculations
  ownership_percent NUMERIC, -- shopw much of final result came from this source
  
  -- When data was used
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit link
  audit_log_id UUID REFERENCES audit_logs(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for data_lineage
CREATE INDEX idx_data_lineage_entity ON data_lineage(entity_type, entity_id);
CREATE INDEX idx_data_lineage_source ON data_lineage(source_type);

-- =====================================================
-- FUNCTION: Verify evidence integrity
-- Purpose: Check if PDF hash matches stored hash
-- =====================================================
CREATE OR REPLACE FUNCTION verify_evidence_integrity(
  p_evidence_id UUID,
  p_evidence_type VARCHAR,
  p_file_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_hash TEXT;
  v_verification_status VARCHAR;
BEGIN
  -- Get stored hash
  SELECT sha256_hash, verification_status 
  INTO v_stored_hash, v_verification_status
  FROM evidence_hashes
  WHERE evidence_id = p_evidence_id
    AND evidence_type = p_evidence_type
  ORDER BY generated_at DESC
  LIMIT 1;
  
  -- If no hash found, cannot verify
  IF v_stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Compare hashes
  IF v_stored_hash = p_file_hash THEN
    -- Hashes match - update verification status
    UPDATE evidence_hashes
    SET verified_at = NOW(),
        verification_status = 'verified'
    WHERE evidence_id = p_evidence_id
      AND evidence_type = p_evidence_type;
    
    RETURN true;
  ELSE
    -- Hashes don't match - evidence has been tampered with
    UPDATE evidence_hashes
    SET verified_at = NOW(),
        verification_status = 'tampered'
    WHERE evidence_id = p_evidence_id
      AND evidence_type = p_evidence_type;
    
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get complete evidence chain of custody
-- Purpose: Return all audit logs related to an evidence piece
-- =====================================================
CREATE OR REPLACE FUNCTION get_evidence_chain_of_custody(
  p_evidence_id UUID,
  p_evidence_type VARCHAR
)
RETURNS TABLE (
  log_id UUID,
  action_type VARCHAR,
  timestamp TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  changes JSONB,
  log_hash TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action_type,
    al.timestamp,
    al.user_id,
    al.changes,
    al.log_hash
  FROM audit_logs al
  WHERE al.entity_id = p_evidence_id
    AND al.entity_type = p_evidence_type
  ORDER BY al.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: evidence_audit_summary
-- Purpose: Quick view of evidence integrity status
-- =====================================================
CREATE OR REPLACE VIEW evidence_audit_summary AS
SELECT 
  eh.id,
  eh.evidence_id,
  eh.evidence_type,
  eh.file_name,
  eh.sha256_hash,
  eh.generated_at,
  eh.verification_status,
  eh.verified_at,
  CASE 
    WHEN eh.verification_status = 'tampered' THEN '🔴 Tampered'
    WHEN eh.verification_status = 'verified' THEN '✅ Verified'
    ELSE '⚪ Not Verified'
  END as status_indicator,
  -- Get count of audit logs for this evidence
  (SELECT COUNT(*) FROM audit_logs al 
   WHERE al.entity_id = eh.evidence_id 
   AND al.entity_type = eh.evidence_type) as audit_log_count
FROM evidence_hashes eh;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all platform actions - append-only';
COMMENT ON TABLE evidence_hashes IS 'Cryptographic hashes for PDF reports to ensure legal defensibility';
COMMENT ON TABLE data_lineage IS 'Track data sources and transformations for complete transparency';
COMMENT ON FUNCTION verify_evidence_integrity IS 'Verify that evidence file matches stored hash';
COMMENT ON FUNCTION get_evidence_chain_of_custody IS 'Return complete audit trail for an evidence piece';


