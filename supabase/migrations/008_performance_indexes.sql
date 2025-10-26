-- Migration: Performance Indexes for Interconnected Intelligence
-- Date: January 2025
-- Purpose: Optimize query performance for analytics and intelligence features

-- ============================================
-- Anomalies Table Indexes
-- ============================================

-- Composite index for type, severity, and time (most common queries)
CREATE INDEX IF NOT EXISTS idx_anomalies_composite 
ON anomalies(type, severity, detected_at DESC);

-- Product-based temporal index
CREATE INDEX IF NOT EXISTS idx_anomalies_product_time 
ON anomalies(product_id, detected_at DESC) 
WHERE product_id IS NOT NULL;

-- Alert-based composite index
CREATE INDEX IF NOT EXISTS idx_anomalies_alert_composite
ON anomalies(alert_id, type, severity, detected_at DESC);

-- Severity and time (for filtering)
CREATE INDEX IF NOT EXISTS idx_anomalies_severity_time
ON anomalies(severity, detected_at DESC);

-- ============================================
-- Intelligence Analysis Usage Table
-- ============================================

-- Alert and time index (for usage tracking)
CREATE INDEX IF NOT EXISTS idx_intelligence_alert_time
ON intelligence_analysis_usage(alert_id, created_at DESC);

-- User and time index (for user-specific queries)
CREATE INDEX IF NOT EXISTS idx_intelligence_user_time
ON intelligence_analysis_usage(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_intelligence_composite
ON intelligence_analysis_usage(alert_id, analysis_type, created_at DESC);

-- ============================================
-- Subscriptions Table Indexes
-- ============================================

-- User subscription lookup
CREATE INDEX IF NOT EXISTS idx_subscription_user
ON user_subscriptions(user_id, tier, created_at DESC);

-- Active subscriptions only
CREATE INDEX IF NOT EXISTS idx_subscription_active
ON user_subscriptions(user_id, tier)
WHERE is_active = true;

-- ============================================
-- Performance Analytics
-- ============================================

-- Analyze tables for query optimization
ANALYZE anomalies;
ANALYZE intelligence_analysis_usage;
ANALYZE user_subscriptions;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON INDEX idx_anomalies_composite IS 
'Optimizes queries filtering by type, severity, and time range';

COMMENT ON INDEX idx_anomalies_product_time IS 
'Speeds up product-specific anomaly lookups with temporal ordering';

COMMENT ON INDEX idx_anomalies_alert_composite IS 
'Optimizes alert-based anomaly queries with composite fields';

COMMENT ON INDEX idx_intelligence_alert_time IS 
'Speeds up intelligence analysis usage tracking by alert and time';

COMMENT ON INDEX idx_subscription_user IS 
'Optimizes user subscription lookups with tier and time';

-- ============================================
-- Query Performance Monitoring
-- ============================================

-- Create view for slow query monitoring (if enabled)
DO $$
BEGIN
    -- Check if pg_stat_statements extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        EXECUTE '
            COMMENT ON EXTENSION pg_stat_statements IS 
            ''Track query performance for intelligence features'';
        ';
    END IF;
END $$;

-- ============================================
-- Vacuum and Analyze
-- ============================================

-- Vacuum analyze to update statistics
VACUUM ANALYZE anomalies;
VACUUM ANALYZE intelligence_analysis_usage;
VACUUM ANALYZE user_subscriptions;

-- ============================================
-- Migration Complete
-- ============================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes migration completed successfully';
END $$;

