// SQL to fix anomalies table schema

const sql = `-- Fix anomalies table schema to support all anomaly types
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fckszlhkvdnrvgsjymgs/sql/new

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
        ALTER TABLE anomalies ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to anomalies table';
    ELSE
        RAISE NOTICE 'description column already exists';
    END IF;

    -- Make product_id nullable (required for freight_surge and fx_volatility anomalies)
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
        RAISE NOTICE 'product_id is already nullable';
    END IF;
END $$;

COMMENT ON COLUMN anomalies.description IS 'Human-readable description of the anomaly';
COMMENT ON COLUMN anomalies.product_id IS 'Product reference (nullable for freight_surge and fx_volatility)';
`;

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  DATABASE SCHEMA FIX REQUIRED                                 ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('The anomalies table needs to be updated to support all anomaly types.\n');
console.log('STEPS:');
console.log('1. Open Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/fckszlhkvdnrvgsjymgs/sql/new\n');
console.log('2. Copy and paste the SQL below:\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log(sql);
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('3. Click "Run" to execute the SQL\n');
console.log('4. After successful execution, run the seed script again:\n');
console.log('   curl -X POST http://localhost:3002/api/seed -H "Content-Type: application/json" -d "{\\"action\\": \\"seed\\"}"\n');