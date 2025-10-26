# FMM Company Scraper → TradeNest Integration

This complete pipeline scrapes company data from the Federation of Malaysian Manufacturers (FMM) website and transforms it for use in the TradeNest platform.

## 🎯 Purpose

Populate TradeNest's database with **real Malaysian manufacturing companies** to:
- Demo the platform with realistic data
- Build a target subscriber list for sales/marketing
- Show potential clients actual FMM members using the system

## 📋 Installation

```bash
cd scripts/scraper
npm install
```

## 🚀 Complete Workflow

### Step 1: Scrape ALL FMM Companies

```bash
npm run scrape:all
```

This comprehensive scraper:
- Searches A-Z, 0-9 to find all companies
- Extracts ~300-500+ companies (depends on FMM database)
- Saves results to `output/fmm-companies-all.json` and CSV
- Caches URLs for faster re-runs

**Time:** ~30-60 minutes (depends on number of companies)

### Step 2: Transform Data to TradeNest Format

```bash
npm run transform
```

This script:
- Reads scraped FMM data
- Maps to TradeNest database schema
- Categorizes companies by industry sector
- Generates TypeScript file: `../../lib/mock-data/fmm-companies-scraped.ts`

### Step 3: Seed Database

```bash
cd ../..  # Back to project root
npm run seed-db
```

This will upload all FMM companies to your Supabase database.

## 📁 Output Files

### Scraper Output (`scripts/scraper/output/`)
- `fmm-companies-all.json` - Complete scraped data
- `fmm-companies-all.csv` - CSV format for Excel
- `all-member-urls.json` - Cached company URLs
- `debug-*.png` - Screenshots (debug mode only)

### TradeNest Data (`lib/mock-data/`)
- `fmm-companies-scraped.ts` - Transformed TypeScript data ready for import

## 📊 Data Fields Extracted

### From FMM Website:
- Company Name
- Registration Number
- Member Type (Ordinary/Affiliate)
- Office Address
- Telephone
- Website
- Email
- Products/Services Manufactured
- Profile URL

### Transformed for TradeNest:
- All above fields +
- **Sector** (auto-categorized from products)
- **State/Region** (extracted from address)
- **Company Type** (importer/exporter/both)
- **Products Array** (parsed from services)

## 🏭 Industry Sectors Mapped

The transformer automatically categorizes companies into:
- Steel & Metals
- Electronics & Electrical
- Chemicals & Petrochemicals
- Food & Beverage
- Textiles & Apparel
- Automotive & Parts
- Furniture & Wood
- Machinery & Equipment
- Packaging & Printing
- Construction Materials
- Other Manufacturing

## 🛠️ Available Commands

```bash
# Quick scrape (~10 companies for testing)
npm run scrape

# Comprehensive scrape (all companies A-Z, 0-9)
npm run scrape:all

# Transform scraped data to TradeNest format
npm run transform

# Debug mode (screenshots, HTML export)
npm run debug
```

## 📈 Expected Results

Based on FMM's database size:
- **Companies:** 300-500+ real Malaysian manufacturers
- **Sectors:** 10+ industry categories
- **Geographic Coverage:** All Malaysian states
- **Data Quality:**
  - 95%+ with addresses
  - 80%+ with phone numbers
  - 60%+ with websites
  - Variable email availability

## 🔄 Re-running the Scraper

The scraper caches discovered URLs in `output/all-member-urls.json`.

**To force a fresh scrape:**
```bash
rm output/all-member-urls.json
npm run scrape:all
```

**To re-scrape using cached URLs:**
```bash
npm run scrape:all  # Will use cached URLs automatically
```

## 🐛 Troubleshooting

### Scraper finds only 10 companies per search
This is normal - FMM's website returns max 10 results per search. The A-Z search strategy helps discover more companies.

### Browser won't close after scraping
Press Ctrl+C to force close, or set `headless: true` in the scraper files.

### Transformation fails
Make sure `output/fmm-companies-all.json` exists and has valid data.

### Database seeding fails
Check your Supabase credentials in `.env` and ensure tables are created (run migrations).

## 📝 Notes

- Scraper includes 1-second delay between requests (be respectful to FMM servers)
- Browser runs in non-headless mode for monitoring
- All data is from public FMM member directory
- Perfect for demo/prototype - verify data freshness for production use

## 🎯 Integration with TradeNest

Once seeded, these companies appear in:
- Dashboard company listings
- Trade flow analysis
- Shipment drill-downs
- Risk assessment modules

Perfect for showcasing the platform to your boss with real Malaysian manufacturers!
