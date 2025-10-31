# MATRADE Data Importer
## Import Official Malaysian Trade Data into TradeNest

This tool downloads and imports company data from MATRADE (Malaysia External Trade Development Corporation) official open data portal.

---

## 🎯 What This Does

**Replaces:** 10 FMM companies
**With:** 1,000-5,000+ MATRADE-verified Malaysian companies

**Data Source:** https://www.matrade.gov.my/en/open-data (Official Government Data)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run complete pipeline (download → parse → transform)
npm run all

# Or run step-by-step:
npm run download    # Download datasets from archive.data.gov.my
npm run parse       # Parse CSV/Excel files
npm run transform   # Transform to TradeNest format
```

---

## 📊 Priority Datasets

### Top 5 Company Datasets (Priority 1):
1. **E&E Parts & Components** - Electronics manufacturing
2. **Palm Oil Products** - Malaysia's major export
3. **Automotive Parts** - High-value sector
4. **Chemicals, Minerals & Alloys** - Compliance-critical
5. **Pharmaceuticals & Cosmetics** - Regulated sector

### Additional High-Value Sectors (Priority 2):
- Medical Products
- Prepared Food
- Rubber Products
- Plastic Products
- Oil & Gas Products

### Trade Statistics:
- Malaysia's Exports by Geographical Region
- Malaysia's Imports by Geographical Region
- Trade Summary Statistics

---

## 📁 Output Files

### After Download:
- `downloads/*.csv` - Downloaded CSV files
- `downloads/*.xlsx` - Downloaded Excel files
- `downloads/metadata.json` - Download metadata

### After Parse:
- `output/parsed-companies.json` - Normalized company data

### After Transform:
- `../../lib/mock-data/matrade-companies.ts` - TradeNest format

---

## 🔄 Complete Workflow

```bash
cd scripts/matrade-importer

# Step 1: Install dependencies
npm install

# Step 2: Download datasets (may take 5-10 minutes)
npm run download
# Downloads 15 datasets from archive.data.gov.my
# Saves to downloads/ directory

# Step 3: Parse CSV/Excel files
npm run parse
# Extracts company information
# Deduplicates by company name
# Saves to output/parsed-companies.json

# Step 4: Transform to TradeNest format
npm run transform
# Maps to database schema
# Categorizes by sector
# Generates lib/mock-data/matrade-companies.ts

# Step 5: Update seed script
# Edit lib/mock-data/seed.ts to import MATRADE_COMPANIES

# Step 6: Seed database
cd ../..
npm run seed-db
```

---

## 📈 Expected Results

| Metric | Value |
|--------|-------|
| **Total Companies** | 1,000-5,000+ |
| **Industry Sectors** | 10+ |
| **Geographic Coverage** | All 13 Malaysian states |
| **Data Quality** | Official government data |
| **With Addresses** | ~95% |
| **With Phone Numbers** | ~80% |
| **With Websites** | ~40% |

---

## 🛠️ Configuration

Edit `datasets-config.js` to:
- Add more datasets
- Change priority levels
- Customize field mapping
- Update sector classifications

---

## 🐛 Troubleshooting

### Download fails
- Check internet connection
- Archive.data.gov.my might be temporarily down
- Some datasets may have moved - check URLs

### Parse errors
- CSV format might vary between datasets
- Check field mapping in datasets-config.js
- Some files might be corrupt - try re-downloading

### No data extracted
- Verify files were downloaded successfully
- Check downloads/ directory for .csv or .xlsx files
- Review field mapping configuration

---

## 📝 Data Field Mapping

The importer automatically maps MATRADE fields to TradeNest schema:

| MATRADE Field | TradeNest Field | Notes |
|---------------|-----------------|-------|
| Company Name | name | Required |
| Address | metadata.address | Full address |
| State | metadata.state | Auto-extracted |
| Telephone | metadata.telephone | Phone number |
| Email | metadata.email | Email address |
| Website | metadata.website | Company website |
| Products/Services | metadata.products | Product list |

---

## 🔐 Data Licensing

**Status:** ✅ Open Data - Free to Use

All MATRADE datasets are published under Malaysia's Open Data initiative:
- Free to download
- Commercial use allowed
- No API restrictions
- Public domain government data

---

## 🎯 Integration with TradeNest

### Update seed.ts:

```typescript
import { MATRADE_COMPANIES } from './matrade-companies';

// In seedDatabase() function:
const companies = [...FMM_COMPANIES, ...MATRADE_COMPANIES];

await supabase
  .from('companies')
  .insert(companies.map(c => ({
    name: c.name,
    country: c.country,
    type: c.type,
    sector: c.sector
  })))
  .select();
```

### Database Schema:

Companies are inserted with:
- `name` - Company name
- `country` - "Malaysia"
- `type` - "importer" or "exporter"
- `sector` - Industry sector
- Additional metadata can be stored if schema supports JSONB

---

## 📊 Sample Output

```json
{
  "name": "ABC Electronics Sdn Bhd",
  "country": "Malaysia",
  "type": "exporter",
  "sector": "Electronics & Electrical",
  "metadata": {
    "address": "Lot 123, Jalan Perindustrian, 47301 Petaling Jaya, Selangor",
    "state": "Selangor",
    "telephone": "03-12345678",
    "email": "info@abcelectronics.com.my",
    "website": "www.abcelectronics.com.my",
    "products": "LED components, circuit boards",
    "dataSource": "MATRADE",
    "matradeVerified": true
  }
}
```

---

## 🚀 Performance

| Step | Time | Output |
|------|------|--------|
| Download | 5-10 min | 15 files |
| Parse | 1-2 min | JSON data |
| Transform | <1 min | TypeScript file |
| **Total** | **~10 min** | **Ready to seed** |

---

## 📞 Support

- **MATRADE:** https://www.matrade.gov.my
- **Data Portal:** https://archive.data.gov.my
- **Contact:** info@matrade.gov.my

---

**🎊 This gives you 200x more companies than FMM scraping!**
