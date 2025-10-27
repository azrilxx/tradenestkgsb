# Database Seeding Issue Found

## Problem
The database seeding is failing because the `anomalies` table is missing the `details` column in your Supabase database.

## Solution

You need to add the missing column to your Supabase database. Follow these steps:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Run This SQL Command
```sql
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}';
```

### Step 3: Run the Seed Again
After running the SQL, execute the seed command again:

```powershell
$body = '{\"action\": \"seed\"}'; Invoke-WebRequest -Uri 'http://localhost:3001/api/seed' -Method POST -Body (ConvertTo-Json @{action='seed'}) -ContentType 'application/json' -UseBasicParsing
```

## Expected Result After Fix

After adding the column and re-seeding, you should see:
- ✅ 100+ anomalies
- ✅ 100+ alerts  
- ✅ 18 custom rules
- ✅ 50+ rule executions
- ✅ 1 subscription
- ✅ 55+ intelligence usage records

## Files Modified
- `lib/mock-data/generators.ts` - Fixed product_id to use null instead of empty string
- `types/database.ts` - Updated Anomaly interface to allow null product_id
- `lib/mock-data/seed.ts` - Added detailed error logging

