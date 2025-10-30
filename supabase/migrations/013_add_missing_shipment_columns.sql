-- Migration 013: Add Missing Shipment Columns
-- Problem: volume_m3 column is missing from shipments table
-- Solution: Add the missing column

-- Add volume_m3 column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS volume_m3 DECIMAL(15, 2);

-- Verify the column was added
COMMENT ON COLUMN shipments.volume_m3 IS 'Volume in cubic meters';

