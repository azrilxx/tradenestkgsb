-- Fix anomalies table schema to match application requirements
-- 1. Add description column if it doesn't exist
-- 2. Make product_id nullable (freight_surge and fx_volatility don't have products)

DO $$
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'anomalies'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE anomalies ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added description column to anomalies table';
    ELSE
        RAISE NOTICE 'description column already exists in anomalies table';
    END IF;

    -- Make product_id nullable if it has NOT NULL constraint
    -- Check if the column is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'anomalies'
        AND column_name = 'product_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE anomalies ALTER COLUMN product_id DROP NOT NULL;
        RAISE NOTICE 'Made product_id nullable in anomalies table';
    ELSE
        RAISE NOTICE 'product_id is already nullable in anomalies table';
    END IF;
END $$;

COMMENT ON COLUMN anomalies.description IS 'Human-readable description of the anomaly';
COMMENT ON COLUMN anomalies.product_id IS 'Product reference (nullable for anomalies like freight_surge and fx_volatility)';