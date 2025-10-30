-- Temporarily disable RLS to test if that's the issue

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE ports DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

