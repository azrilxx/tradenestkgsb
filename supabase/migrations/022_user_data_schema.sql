-- Migration 022: User Data Contribution Schema
-- Stage 4: User data upload with privacy controls

-- Add shared_for_benchmarks column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shared_for_benchmarks BOOLEAN DEFAULT false;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_country VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_country VARCHAR(100);

-- Comment the column
COMMENT ON COLUMN shipments.shared_for_benchmarks IS 'Whether user opted in to share this data for anonymous sector benchmarks';
COMMENT ON COLUMN shipments.origin_country IS 'Country of origin for this shipment';
COMMENT ON COLUMN shipments.destination_country IS 'Country of destination for this shipment';

-- Create index for benchmarking queries
CREATE INDEX idx_shipments_shared ON shipments(shared_for_benchmarks) WHERE shared_for_benchmarks = true;
CREATE INDEX idx_shipments_origin ON shipments(origin_country);
CREATE INDEX idx_shipments_destination ON shipments(destination_country);

-- Create view for anonymized benchmark data (only aggregations, no individual company data)
CREATE OR REPLACE VIEW v_benchmark_data AS
SELECT
  p.category AS sector,
  p.hs_code,
  AVG(s.unit_price) AS avg_unit_price,
  AVG(s.total_value) AS avg_total_value,
  AVG(s.weight_kg) AS avg_weight_kg,
  AVG(s.volume_m3) AS avg_volume_m3,
  COUNT(*) AS shipment_count,
  MIN(s.shipment_date) AS earliest_date,
  MAX(s.shipment_date) AS latest_date
FROM shipments s
JOIN products p ON s.product_id = p.id
WHERE s.shared_for_benchmarks = true
GROUP BY p.category, p.hs_code;

COMMENT ON VIEW v_benchmark_data IS 'Anonymized aggregate data for sector benchmarks - no individual company information exposed';

