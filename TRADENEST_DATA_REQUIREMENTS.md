# TradeNest Data Requirements
## Complete Data Inventory to Make TradeNest Fully Functional

### 🎯 Overview
TradeNest is a comprehensive trade intelligence platform with 8 phases of features. To make it fully functional and demonstrate all capabilities, you need the following data:

---

## 📊 Core Tables & Data Requirements

### 1. **products** ✅ (Currently Seeded)
- **Current**: 50 products with HS codes
- **Purpose**: Product catalog for all trade activities
- **Categories**: Electronics, Textiles, Agriculture, Automotive, Chemicals, Furniture, Food, Rubber, Wood, Plastics, Metals, Medical, Renewable, Toys, Paper, Ceramics, Optical, Sports, Agri-Equipment, Jewelry
- **Status**: Sufficient for demo

### 2. **price_data** ✅ (Currently Seeded)
- **Current**: 6 months of daily price data (~1,800 days × 30 products = ~54,000 records)
- **Purpose**: Historical pricing for anomaly detection
- **Needed**: 
  - 30 products × 180 days = 5,400+ price records
  - Includes natural volatility and intentional anomalies
- **Status**: Sufficient for demo

### 3. **tariff_data** ✅ (Currently Seeded)
- **Current**: Historical tariff rates for 30 products (~60 records)
- **Purpose**: Track tariff changes over time
- **Needed**: Tariff changes with effective dates
- **Status**: Sufficient for demo

### 4. **fx_rates** ✅ (Currently Seeded)
- **Current**: 5 currency pairs × 180 days = 900 records
- **Pairs**: MYR/USD, MYR/CNY, MYR/EUR, MYR/SGD, MYR/JPY
- **Purpose**: Foreign exchange rate tracking
- **Status**: Sufficient for demo

### 5. **freight_index** ✅ (Currently Seeded)
- **Current**: 5 routes × 180 days = 900 records
- **Routes**: China-Malaysia, Europe-Malaysia, USA-Malaysia, Singapore-Malaysia, Thailand-Malaysia
- **Purpose**: Freight cost tracking for shipping routes
- **Status**: Sufficient for demo

### 6. **anomalies** ✅ (Currently Seeded)
- **Current**: 10 demo anomalies with varying severity
- **Types**: price_spike, tariff_change, freight_surge, fx_volatility
- **Severities**: low, medium, high, critical
- **Purpose**: Detected anomalies for alert generation
- **Status**: Needs MORE to showcase all features

### 7. **alerts** ✅ (Currently Seeded)
- **Current**: 10 alerts (linked to anomalies)
- **Status**: 'new' status alerts for dashboard
- **Purpose**: Alert tracking and status management
- **Status**: Needs MORE to show alert management features

---

## 🏢 Extended Tables (Phase 6+)

### 8. **companies** ⚠️ (Partially Seeded)
- **Current**: Mock + Scraped FMM companies (~300-500)
- **Purpose**: Importer/exporter company directory
- **Needed For**:
  - Company drill-down features
  - Trade intelligence dashboards
  - Shipment tracking
  - Top trade partners analysis
- **Fields**: name, country, type (importer/exporter/both), sector
- **Status**: Exists but may need more for realistic scenarios

### 9. **ports** ✅ (Currently Seeded)
- **Current**: Malaysian ports (MYPKG, MYTPM, etc.)
- **Purpose**: Port directory for shipment tracking
- **Status**: Sufficient

### 10. **shipments** ⚠️ (Partially Seeded)
- **Current**: 800+ generated shipments
- **Purpose**: Detailed transaction history
- **Needed For**:
  - Company drill-down
  - Trade intelligence page
  - Shipment analytics
  - Route analysis
- **Fields**: 
  - product_id, company_id, origin_port_id, destination_port_id
  - vessel_name, container_count, weight_kg, volume_m3
  - unit_price, total_value, freight_cost
  - shipment_date, arrival_date
- **Status**: Exists but needs verification of quality/realism

---

## 📰 Advanced Features (Phase 7+)

### 11. **gazettes** ⚠️ (Partially Seeded)
- **Current**: Mock Federal Gazette data
- **Purpose**: Malaysian government trade remedies tracking
- **Needed For**:
  - Gazette Tracker page
  - Trade remedy tracking
  - Anti-dumping monitoring
- **Status**: Has seed data, needs verification

### 12. **gazette_affected_items** ⚠️ (Partially Seeded)
- **Current**: Links to gazette entries
- **Purpose**: Track which HS codes/countries are affected
- **Status**: Needs verification

### 13. **custom_rules** ❌ (NEEDS DATA)
- **Purpose**: User-defined anomaly detection rules
- **Needed For**:
  - Custom Rules page
  - Rule Builder feature
  - Advanced pattern detection
- **Fields**: name, description, logic_json, active, severity
- **Status**: NEEDS SEED DATA

### 14. **rule_executions** ❌ (NEEDS DATA)
- **Purpose**: Track custom rule execution history
- **Status**: NEEDS SEED DATA

---

## 💼 Business Intelligence (Phase 8+)

### 15. **user_subscriptions** ⚠️ (Partially Configured)
- **Purpose**: Subscription tier management (Free/Professional/Enterprise)
- **Needed For**:
  - Feature gating in Intelligence page
  - Usage limits tracking
- **Status**: Schema exists, needs user data

### 16. **intelligence_analysis_usage** ❌ (NEEDS DATA)
- **Purpose**: Track usage of intelligence analysis features
- **Needed For**:
  - Interconnected Intelligence dashboard
  - Usage monitoring
  - Billing integration
- **Status**: NEEDS SEED DATA

---

## 🚨 Critical Gaps to Address

### IMMEDIATE NEEDS (To Show All Features):

1. **More Anomalies** 
   - Current: 10 anomalies
   - Needed: 50-100+ anomalies across all types and severities
   - Why: Show alert filtering, severity charts, detailed analysis

2. **Custom Rules Data**
   - Current: No data
   - Needed: 5-10 sample custom rules
   - Why: Demonstrate rule builder and custom pattern detection

3. **Rule Execution History**
   - Current: No data
   - Needed: Execution logs for custom rules
   - Why: Show rule performance and validation

4. **Subscription Tiers Data**
   - Current: No user subscriptions
   - Needed: Sample subscription records for demo user
   - Why: Show feature gating and tier benefits

5. **Intelligence Analysis Usage**
   - Current: No data
   - Needed: Sample usage records
   - Why: Show usage monitoring and limits

6. **More Recent Alerts**
   - Current: 10 alerts
   - Needed: 100+ alerts spanning 30+ days
   - Why: Show alert filtering, recent vs old, trend analysis

---

## 📈 Recommended Data Volumes for Full Demo

| Table | Current | Recommended | Purpose |
|-------|---------|-------------|---------|
| **products** | 50 | 50-100 | Product catalog |
| **price_data** | ~5,400 | ~10,000+ | Historical pricing |
| **tariff_data** | ~60 | ~120 | Tariff history |
| **fx_rates** | 900 | 900+ | FX tracking |
| **freight_index** | 900 | 900+ | Freight costs |
| **anomalies** | 10 | **100+** | ⚠️ Alert generation |
| **alerts** | 10 | **100+** | ⚠️ Dashboard |
| **companies** | ~500 | 500-1000 | Trade partners |
| **shipments** | 800 | **2000+** | ⚠️ Trade intelligence |
| **gazettes** | ~20 | 50+ | Trade remedies |
| **custom_rules** | **0** | **10-20** | ⚠️ Rule builder |
| **rule_executions** | **0** | **50+** | ⚠️ Rule tracking |
| **user_subscriptions** | 0 | **1-3** | ⚠️ Tier gating |
| **intelligence_usage** | **0** | **50+** | ⚠️ Usage tracking |

---

## 🎯 Priority Data to Add

### PRIORITY 1: More Anomalies & Alerts (Critical for Dashboard)
```typescript
// Generate 100+ anomalies with:
- Mix of all 4 types (price_spike, tariff_change, freight_surge, fx_volatility)
- Mix of all 4 severities (low, medium, high, critical)
- Distributed over past 30-90 days
- Link to diverse products
- Include some null product_id anomalies (freight, FX)
```

### PRIORITY 2: Custom Rules Data (For Rules Page)
```typescript
// Create 10-20 sample rules:
- Price change detection
- Volume spike detection
- Geographic pattern detection
- Time-based patterns
- Multi-factor rules
```

### PRIORITY 3: Intelligence Usage Data (For Intelligence Page)
```typescript
// Generate usage records:
- Connection analyses
- Multi-hop analyses
- Temporal analyses
- Different users (if multi-user)
- Different time windows
```

### PRIORITY 4: More Shipments (For Trade Intelligence)
```typescript
// Increase to 2000+ shipments:
- Diverse companies
- Various routes
- Realistic pricing
- Proper date distribution
- Link to real products
```

---

## 🛠️ How to Add This Data

### Option 1: Extend Existing Seed Script
Modify `lib/mock-data/seed.ts` to:
1. Increase anomaly generation (currently generates 10, should generate 100+)
2. Add custom rules generation
3. Add user subscription seeding
4. Add intelligence usage tracking

### Option 2: Create Additional Seed Scripts
Create:
- `scripts/seed-custom-rules.js` - Add custom rules
- `scripts/seed-intelligence-usage.js` - Add usage tracking
- `scripts/seed-more-anomalies.js` - Generate 100+ anomalies
- `scripts/seed-subscriptions.js` - Add subscription tiers

### Option 3: Use Supabase SQL Editor
Manually insert sample data directly via SQL

---

## 📋 Summary Checklist

To fully demonstrate TradeNest capabilities:

- [x] Products - ✅ Has 50 products
- [x] Price Data - ✅ Has ~5,400 records
- [x] Tariff Data - ✅ Has tariff history
- [x] FX Rates - ✅ Has FX data
- [x] Freight Index - ✅ Has freight data
- [x] Companies - ✅ Has 500+ companies
- [x] Ports - ✅ Has Malaysian ports
- [x] Shipments - ⚠️ Has 800, needs 2000+
- [x] Gazettes - ⚠️ Has some data
- [ ] Anomalies - ❌ Needs 90+ more (currently only 10)
- [ ] Alerts - ❌ Needs 90+ more (currently only 10)
- [ ] Custom Rules - ❌ NEEDS 10-20 rules
- [ ] Rule Executions - ❌ NEEDS execution history
- [ ] User Subscriptions - ❌ NEEDS subscription data
- [ ] Intelligence Usage - ❌ NEEDS usage tracking

---

## 🚀 Quick Start to Fix This

### Run These Commands:
```bash
# 1. Clear existing anomalies/alerts
psql -d your_db -c "DELETE FROM alerts; DELETE FROM anomalies;"

# 2. Run enhanced seed script (to be created)
node scripts/seed-more-anomalies.js

# 3. Run custom rules seed
node scripts/seed-custom-rules.js

# 4. Run subscription seed
node scripts/seed-subscriptions.js

# 5. Run intelligence usage seed
node scripts/seed-intelligence-usage.js
```

### Or: Update Main Seed Script
Modify `lib/mock-data/seed.ts` to generate 10x more data:
- Change from 10 to 100+ anomalies
- Add custom rules generation
- Add subscription seeding
- Add usage tracking

---

**Bottom Line**: TradeNest needs ~90 more anomalies, custom rules data, and intelligence usage tracking to fully showcase all features. The existing data is good for basic features, but to show the full platform's capabilities, you need additional seed data.

