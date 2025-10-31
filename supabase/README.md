# Supabase Database Setup

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended for Prototype)

1. Go to your Supabase project dashboard: https://fckszlhkvdnrvgsjymgs.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref fckszlhkvdnrvgsjymgs

# Run migration
supabase db push
```

## Database Schema Overview

### Tables Created:
1. **products** - Product catalog with HS codes
2. **tariff_data** - Historical tariff rates
3. **price_data** - Historical pricing information
4. **fx_rates** - Foreign exchange rates
5. **freight_index** - Freight cost indexes
6. **anomalies** - Detected anomalies
7. **alerts** - Alert tracking
8. **users** - User profile extensions

### Views:
- `v_alerts_with_details` - Alerts joined with anomaly and product info
- `v_product_price_trends` - Price trends with anomaly indicators

### Functions:
- `calculate_price_stats()` - Calculate price statistics for anomaly detection
- `get_anomaly_count()` - Get count of recent anomalies

## Verify Installation

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should return 8 tables
```