# 🗄️ Complete Database Setup Guide

## Current Issue
The database tables don't exist yet. We need to run migrations first, then disable RLS, then seed.

---

## 📋 Step-by-Step Solution

### Step 1: Run All Migrations

Go to Supabase SQL Editor (https://fckszlhkvdnrvgsjymgs.supabase.co/project/_/sql)

Run each migration file in order:

#### 1️⃣ Initial Schema (001_initial_schema.sql)
```bash
# Copy entire contents of supabase/migrations/001_initial_schema.sql
# Paste into SQL Editor
# Click RUN
```

#### 2️⃣ Company Drilldown (002_company_drilldown_schema.sql)
```bash
# Copy supabase/migrations/002_company_drilldown_schema.sql
# Run it
```

#### 3️⃣ Custom Rules (003_custom_rules_schema.sql)
```bash
# Copy supabase/migrations/003_custom_rules_schema.sql
# Run it
```

#### 4️⃣ Gazette Tracker (004_gazette_tracker_schema.sql)
```bash
# Copy and run
```

#### 5️⃣ Trade Remedy (005_trade_remedy_schema.sql)
```bash
# Copy and run
```

#### 6️⃣ FMM Association (006_fmm_association_schema.sql)
```bash
# Copy and run
```

#### 7️⃣ Subscription Tiers (007_subscription_tiers.sql)
```bash
# Copy and run
```

#### 8️⃣ Intelligence Webhooks (008_intelligence_webhooks.sql)
```bash
# Copy and run
```

#### 9️⃣ Performance Indexes (008_performance_indexes.sql)
```bash
# Copy and run (note: there are two 008 files)
```

---

### Step 2: Disable RLS Temporarily

After all tables are created, run this to allow seeding:

```sql
-- Disable RLS for seeding (temporarily)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE ports DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE freight_index DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gazettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_affected_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_analysis_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE fmm_directories DISABLE ROW LEVEL SECURITY;
```

---

### Step 3: Seed Database

Now run the seed API:

```powershell
# Clear existing data (if any)
Invoke-RestMethod -Uri "http://localhost:3000/api/seed" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action": "clear"}'

# Seed database
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/seed" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action": "seed"}'

# Check results
Write-Host "Success: $($result.success)"
```

Expected output:
```
Success: True
Anomalies: 100
Alerts: 100
Custom Rules: 18
Shipments: 2000
```

---

### Step 4: Re-enable RLS (Optional for Prod)

If you want RLS re-enabled after seeding:

```sql
-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazette_affected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_analysis_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmm_directories ENABLE ROW LEVEL SECURITY;
```

---

## 🚀 Quick Alternative: Run All Migrations at Once

Create this script:

```sql
-- Run all migrations in sequence
-- Copy contents of each file one by one into SQL Editor
```

OR use this PowerShell script to generate combined SQL:

```powershell
Get-ChildItem -Path "supabase/migrations/*.sql" | ForEach-Object { Get-Content $_.FullName -Raw } | Out-File "all_migrations.sql"
```

Then copy `all_migrations.sql` to Supabase SQL Editor and run.

---

## ✅ Verification

After completing all steps, verify in Supabase:

1. Go to **Table Editor**
2. Check these tables exist:
   - [x] products
   - [x] companies
   - [x] shipments
   - [x] anomalies
   - [x] alerts
   - [x] custom_rules
   - [x] rule_executions
   - [x] user_subscriptions

3. Check data:
   ```sql
   SELECT COUNT(*) FROM products; -- Should be 50
   SELECT COUNT(*) FROM anomalies; -- Should be 100
   SELECT COUNT(*) FROM custom_rules; -- Should be 18
   ```

---

## 🎯 Summary

1. Run 9 migration files in Supabase SQL Editor
2. Disable RLS for all tables
3. Run seed API
4. (Optional) Re-enable RLS

This will create all tables and populate with demo data!
