-- Migration 012: Fix Shipments RLS Policies
-- Problem: RLS was enabled on shipments table with only SELECT policy
-- Solution: Add INSERT/UPDATE/DELETE policies to allow data seeding

-- =====================================================
-- COMPANIES: Add INSERT/UPDATE/DELETE policies
-- =====================================================

CREATE POLICY "Allow public insert to companies" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to companies" ON companies
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from companies" ON companies
  FOR DELETE USING (true);

-- =====================================================
-- PORTS: Add INSERT/UPDATE/DELETE policies  
-- =====================================================

CREATE POLICY "Allow public insert to ports" ON ports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to ports" ON ports
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from ports" ON ports
  FOR DELETE USING (true);

-- =====================================================
-- SHIPMENTS: Add INSERT/UPDATE/DELETE policies (CRITICAL FIX)
-- =====================================================

CREATE POLICY "Allow public insert to shipments" ON shipments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to shipments" ON shipments
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from shipments" ON shipments
  FOR DELETE USING (true);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON POLICY "Allow public insert to shipments" ON shipments IS 'Allows data seeding and insertion operations';
COMMENT ON POLICY "Allow public update to shipments" ON shipments IS 'Allows updates to existing shipment records';
COMMENT ON POLICY "Allow public delete from shipments" ON shipments IS 'Allows deletion of shipment records for database management';

