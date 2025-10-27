-- Add details column to anomalies if it doesn't exist
-- This migration ensures the anomalies table has the details column

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'anomalies' 
        AND column_name = 'details'
    ) THEN
        ALTER TABLE anomalies ADD COLUMN details JSONB NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added details column to anomalies table';
    ELSE
        RAISE NOTICE 'details column already exists in anomalies table';
    END IF;
END $$;

COMMENT ON COLUMN anomalies.details IS 'JSONB field containing anomaly-specific details like prices, rates, percentages, etc.';

