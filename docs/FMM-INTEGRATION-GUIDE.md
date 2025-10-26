# FMM Company Integration Guide
## Populating TradeNest with Real Malaysian Manufacturers

### Overview

This guide explains how to populate your TradeNest database with **real companies** from the Federation of Malaysian Manufacturers (FMM) for your demo/presentation.

---

## 🎯 Business Objective

**Goal:** Show your boss a dashboard filled with 300-500+ real Malaysian manufacturing companies that are potential subscribers.

**Why FMM Companies?**
- They are actual exporters/importers (your target market)
- Real business names make demos more credible
- You can use this list for actual sales outreach later
- Industry sectors match your platform's focus areas

---

## 📊 Complete Pipeline

### Phase 1: Data Collection ✅ DONE

**Location:** `scripts/scraper/`

```bash
cd scripts/scraper
npm install
npm run scrape:all
```

**What it does:**
- Searches FMM member directory (A-Z, 0-9)
- Extracts company details from each profile page
- Saves to JSON and CSV formats

**Output:**
- `output/fmm-companies-all.json` - All company data
- `output/fmm-companies-all.csv` - Excel-friendly format
- `output/all-member-urls.json` - URL cache

**Time:** ~30-60 minutes

---

### Phase 2: Data Transformation ✅ DONE

**Location:** `scripts/scraper/`

```bash
npm run transform
```

**What it does:**
- Maps FMM data to TradeNest schema
- Auto-categorizes companies by industry
- Extracts state/region from addresses
- Assigns import/export types

**Output:**
- `lib/mock-data/fmm-companies-scraped.ts` - TypeScript data file

**Time:** < 1 minute

---

### Phase 3: Database Seeding 🔜 NEXT STEP

**Location:** Project root

```bash
npm run seed-db
```

**What it does:**
- Uploads all companies to Supabase
- Inserts in batches (100 at a time)
- Creates relationships with products/ports
- Generates sample shipment data

**Result:** Dashboard shows real companies with trade activity

---

## 📈 Expected Data Volume

Based on current FMM directory:

| Metric | Count |
|--------|-------|
| Total Companies | 300-500+ |
| Industry Sectors | 10+ categories |
| States Covered | All 13 states |
| With Phone Numbers | ~80% |
| With Websites | ~60% |
| With Addresses | ~95% |

---

## 🏭 Industry Distribution

Expected sectors (approximate):

- **Electronics & Electrical** - 25-30%
- **Steel & Metals** - 15-20%
- **Chemicals & Petrochemicals** - 12-15%
- **Food & Beverage** - 10-12%
- **Automotive & Parts** - 8-10%
- **Textiles & Apparel** - 5-8%
- **Machinery & Equipment** - 5-8%
- **Furniture & Wood** - 3-5%
- **Other Manufacturing** - 10-15%

---

## 🎨 Demo Presentation Tips

### Before Your Boss Demo:

1. **Verify Data Loaded**
   ```bash
   # Check company count in database
   ```

2. **Highlight Real Companies**
   - "Here are 500 real FMM members we can target"
   - "These are actual manufacturers, not fake data"
   - Show recognizable company names

3. **Show Geographic Coverage**
   - Filter by state (Selangor, Johor, Penang, etc.)
   - Demonstrate nationwide reach

4. **Industry Breakdown**
   - Show electronics sector (highest value)
   - Demonstrate multi-sector coverage

5. **Export Potential**
   - "Each company needs export compliance monitoring"
   - "Average value: RM 50M-100M exports/year"
   - "Potential subscription revenue: XXX"

---

## 🔍 Next Steps: Trade Data

After loading companies, you need **export/import transaction data**.

### Options for Trade Data:

#### Option 1: MATRADE (Malaysia External Trade Development Corporation)
- **Source:** https://www.matrade.gov.my/
- **Data:** Official Malaysian trade statistics
- **Format:** Excel reports, PDF documents
- **Challenge:** May require registration/payment

#### Option 2: Malaysian Ports (Northport, Westport)
- **Source:** Port Klang Authority
- **Data:** Shipping manifests, container movements
- **Format:** Varies by port
- **Challenge:** Need official access

#### Option 3: Commercial Trade Databases
- **Panjiva** (S&P Global) - Shipping data
- **ImportGenius** - Bill of lading data
- **Trade Map** (ITC) - Aggregated statistics
- **Challenge:** Subscription required ($$$)

#### Option 4: Simulated Data (For Demo)
- **Generate realistic trade transactions**
- **Based on company sectors and sizes**
- **Use actual HS codes and products**
- **Match typical Malaysia trade patterns**

**Recommendation for demo:** Option 4 (simulated data based on real patterns)

---

## 💡 Generating Simulated Trade Data

Once companies are loaded, enhance with:

```typescript
// For each FMM company:
- 50-200 shipments per year
- Realistic product mix (based on sector)
- Actual ports (Port Klang, Penang, Johor)
- Historical price trends
- Seasonal patterns
```

**This gives you:**
- Realistic dashboard metrics
- Drill-down capability
- Company trade histories
- Risk scoring based on patterns

---

## 📋 Pre-Demo Checklist

- [ ] Scraper completed successfully
- [ ] Data transformed to TradeNest format
- [ ] Companies loaded to database (300-500+)
- [ ] Sample shipments generated
- [ ] Dashboard shows company listings
- [ ] Drill-down to company details works
- [ ] Export/import filters functional
- [ ] Geographic filtering by state works
- [ ] Industry sector filtering works
- [ ] Charts/graphs populated with data

---

## 🚀 Launch Commands Summary

```bash
# 1. Scrape FMM companies
cd scripts/scraper
npm run scrape:all

# 2. Transform data
npm run transform

# 3. Seed database
cd ../..
npm run seed-db

# 4. Start dev server
npm run dev
```

---

## 📞 Support & Resources

- **FMM Website:** https://www.fmm.org.my
- **MATRADE:** https://www.matrade.gov.my
- **Department of Statistics Malaysia (DOSM):** https://www.dosm.gov.my
- **Malaysia External Trade Statistics:** https://www.matrade.gov.my/en/malaysian-exporters/services-for-exporters/trade-statistics

---

## ✅ Success Criteria

Your demo is ready when:

✅ Dashboard shows 300-500+ real Malaysian companies
✅ Each company has realistic trade data
✅ You can drill down to individual shipments
✅ Risk scoring works for all companies
✅ Geographic and sector filters work
✅ Boss can see recognizable company names
✅ Data looks professional and credible

**Result:** Compelling demo that shows TradeNest working with real target market data!

---

## 📝 Notes for Future

**Post-Demo:**
- This company list = your sales leads
- Export to CRM for outreach campaigns
- Match with real trade data when available
- Update periodically from FMM website

**Production Considerations:**
- FMM data updated quarterly/annually
- Real trade data requires API integration
- Consider data licensing for commercial use
- May need company permission for public display
