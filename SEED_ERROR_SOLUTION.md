# 🔧 Database Seeding Error - Solution

## ❌ Current Issue

The seed API is being blocked by **Row Level Security (RLS) policies** in Supabase:

```
Error: new row violates row-level security policy for table "products"
Code: 42501
```

## 🎯 Quick Solutions

### Option 1: Disable RLS for Seeding (Recommended for Demo)

Go to your Supabase Dashboard:
1. Visit: https://fckszlhkvdnrvgsjymgs.supabase.co
2. Navigate to **Authentication** → **Policies** (or SQL Editor)
3. Run this SQL:

```sql
-- Temporarily disable RLS for all tables during seeding
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
```

**After seeding, re-enable RLS:**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
```

### Option 2: Use Service Role Key

Add service role key to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Then modify `lib/mock-data/seed.ts` to create a separate client with service role key.

### Option 3: Update RLS Policies

In Supabase SQL Editor, update policies to allow inserts:

```sql
-- Allow authenticated users to insert
CREATE POLICY "Allow public insert on products" ON products FOR INSERT 
TO public WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Allow public select on products" ON products FOR SELECT 
TO public USING (true);

-- Repeat for other tables...
```

## ✅ Verification

After fixing RLS, run:

```powershell
# Clear database
Invoke-RestMethod -Uri "http://localhost:3000/api/seed" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action": "clear"}'

# Seed database
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/seed" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action": "seed"}'

# Check success
Write-Host "Success: $($result.success)"
Write-Host "Anomalies: $($result.stats.anomalies)"
Write-Host "Alerts: $($result.stats.alerts)"
Write-Host "Custom Rules: $($result.stats.customRules)"
```

## 📝 Recommended Approach

For a demo environment, **Option 1 (Disable RLS temporarily)** is the quickest solution.

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the "DISABLE ROW LEVEL SECURITY" commands above
3. Run the seed API again
4. Re-enable RLS with the "ENABLE ROW LEVEL SECURITY" commands

This allows the seed to work without affecting your production security.
