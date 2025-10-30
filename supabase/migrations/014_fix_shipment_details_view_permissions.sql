-- Migration 014: Fix shipment_details view permissions
-- Problem: View needs explicit permissions for RLS-enabled tables
-- Solution: Grant SELECT permission on the view to public/anonymous role

-- =====================================================
-- VIEW PERMISSIONS: shipment_details
-- =====================================================

-- Grant SELECT permission on the view to anonymous role
GRANT SELECT ON shipment_details TO anon;

-- Grant SELECT permission to authenticated role
GRANT SELECT ON shipment_details TO authenticated;

-- Grant SELECT permission to public role
GRANT SELECT ON shipment_details TO public;

-- Alternative: Make the view use SECURITY INVOKER
-- This ensures it runs with the caller's permissions (respects RLS)
ALTER VIEW shipment_details SET (security_invoker = true);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON VIEW shipment_details IS 'Denormalized view for fast queries. Uses SECURITY INVOKER to respect RLS policies on underlying tables';

