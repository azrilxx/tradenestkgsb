# Apply Missing Database Migrations

**Status**: Your data is ready, but 3 database tables are missing!
**Time Required**: 15 minutes
**Impact**: Unlocks Custom Rules, Subscriptions, and Intelligence Usage tracking

---

## Quick Summary

Your seed script successfully created:
- ✅ 100 anomalies
- ✅ 100 alerts
- ✅ 2,000 shipments
- ✅ All time-series data (prices, tariffs, FX, freight)

But showed 0 for:
- ❌ Custom Rules (0 instead of 18)
- ❌ Rule Executions (0 instead of 30)
- ❌ Subscriptions (0 instead of 1)
- ❌ Intelligence Usage (0 instead of 20)

**Why?** These 3 tables don't exist in your database yet.

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/fckszlhkvdnrvgsjymgs/sql/new

### Step 2: Run Migration #1 - Custom Rules Schema

Copy and paste this entire SQL block, then click **RUN**:

\`\`\`sql
-- Migration 003: Custom Rules Schema
-- Creates custom_rules and rule_executions tables

CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logic_json JSONB NOT NULL,
  user_id UUID DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT true,
  alert_type VARCHAR(50) DEFAULT 'CUSTOM_PATTERN',
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_rules_user_id ON custom_rules(user_id);
CREATE INDEX idx_custom_rules_active ON custom_rules(active);
CREATE INDEX idx_custom_rules_alert_type ON custom_rules(alert_type);
CREATE INDEX idx_custom_rules_severity ON custom_rules(severity);

CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES custom_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matches_found INTEGER DEFAULT 0,
  anomalies_created INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  metadata JSONB
);

CREATE INDEX idx_rule_executions_rule_id ON rule_executions(rule_id);
CREATE INDEX idx_rule_executions_executed_at ON rule_executions(executed_at DESC);

CREATE OR REPLACE FUNCTION update_custom_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_rules_timestamp
  BEFORE UPDATE ON custom_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_rules_timestamp();

ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to custom_rules" ON custom_rules
  FOR ALL USING (true);

CREATE POLICY "Allow public access to rule_executions" ON rule_executions
  FOR ALL USING (true);
\`\`\`

**Expected Result**: "Success. No rows returned."

---

### Step 3: Run Migration #2 - Subscription Tiers

In the same SQL Editor, paste this SQL block and click **RUN**:

\`\`\`sql
-- Migration 007: Subscription Management Schema

CREATE TYPE subscription_tier AS ENUM ('free', 'professional', 'enterprise');

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier subscription_tier NOT NULL DEFAULT 'free',
  features JSONB NOT NULL DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(is_active) WHERE is_active = true;

CREATE TABLE intelligence_analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  analysis_type VARCHAR(50) NOT NULL DEFAULT 'connection',
  time_window INTEGER NOT NULL DEFAULT 30,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_intelligence_usage_user ON intelligence_analysis_usage(user_id);
CREATE INDEX idx_intelligence_usage_alert ON intelligence_analysis_usage(alert_id);
CREATE INDEX idx_intelligence_usage_created ON intelligence_analysis_usage(created_at DESC);
CREATE INDEX idx_intelligence_usage_user_created ON intelligence_analysis_usage(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_analysis_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to user_subscriptions" ON user_subscriptions
  FOR ALL USING (true);

CREATE POLICY "Allow public access to intelligence_usage" ON intelligence_analysis_usage
  FOR ALL USING (true);
\`\`\`

**Expected Result**: "Success. No rows returned."

**Note**: I've removed the `REFERENCES auth.users(id)` constraints since you're using mock users for demo. Also removed the RLS policies that depend on `auth.uid()`.

---

### Step 4: Verify Tables Were Created

Run this query to confirm all tables exist:

\`\`\`sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('custom_rules', 'rule_executions', 'user_subscriptions', 'intelligence_analysis_usage')
ORDER BY table_name;
\`\`\`

**Expected Result**: You should see all 4 table names listed.

---

### Step 5: Re-Seed the Database

Now that the tables exist, re-run the seed script to populate them:

\`\`\`bash
# Clear existing data (optional, but recommended for clean state)
curl -X POST http://localhost:3002/api/seed -H "Content-Type: application/json" -d "{\"action\": \"clear\"}"

# Seed with all tables
curl -X POST http://localhost:3002/api/seed -H "Content-Type: application/json" -d "{\"action\": \"seed\"}"
\`\`\`

**Expected Result**:
\`\`\`json
{
  "success": true,
  "stats": {
    "products": 49,
    "companies": 70,
    "ports": 25,
    "shipments": 2000,
    "prices": 5490,
    "tariffs": 31,
    "fxRates": 915,
    "freight": 915,
    "anomalies": 100,
    "alerts": 100,
    "customRules": 18,           // ← Should be > 0 now!
    "ruleExecutions": 30,        // ← Should be > 0 now!
    "subscriptions": 1,          // ← Should be > 0 now!
    "intelligenceUsage": 20      // ← Should be > 0 now!
  }
}
\`\`\`

---

## Troubleshooting

### Problem 1: "type subscription_tier already exists"

If you see this error, skip the `CREATE TYPE` line and just run the CREATE TABLE statements.

### Problem 2: "relation auth.users does not exist"

This is why I removed the foreign key constraints. The migration above uses mock user IDs instead of real auth users, which is perfect for demos.

### Problem 3: Tables still showing 0 data after re-seed

Check the dev server console for errors. Some common issues:
- Schema cache needs refresh (restart Next.js dev server)
- RLS policies blocking inserts (already fixed in SQL above)

---

## What This Unlocks

### Before Migrations:
- ❌ Custom Rules page shows "No rules"
- ❌ Intelligence analysis limited
- ❌ No subscription tier gating

### After Migrations:
- ✅ **18 Custom Rules** with realistic logic
  - Price spike detection
  - Volume anomaly tracking
  - Geographic pattern detection
  - Time-based alerts

- ✅ **30 Rule Execution Records**
  - Performance metrics
  - Match tracking
  - Execution history

- ✅ **1 Active Subscription** (Free tier)
  - Feature gating ready
  - Usage limit tracking
  - Tier upgrade paths configured

- ✅ **20 Intelligence Usage Records**
  - Connection analysis tracking
  - Usage monitoring
  - Billing-ready data

---

## Files Reference

All migration SQL files are in:
- `supabase/migrations/003_custom_rules_schema.sql`
- `supabase/migrations/007_subscription_tiers.sql`

Seed data generators are in:
- `lib/mock-data/custom-rules.ts` (18 sample rules)
- `lib/mock-data/subscriptions.ts` (subscription + usage generators)

---

## Next: Demo Checklist

After completing these steps, you'll have a **fully functional TradeNest** ready to demo:

- [ ] 100 anomalies across all types
- [ ] 100 alerts with mixed severity
- [ ] 2,000 shipment transactions
- [ ] 18 custom detection rules
- [ ] Subscription tier management
- [ ] Usage tracking system
- [ ] 6 months of historical data
- [ ] Real Malaysian trade companies
- [ ] Realistic pricing & trends

**Total Time**: ~15 minutes to apply migrations + re-seed
**Result**: Production-quality demo platform! 🚀