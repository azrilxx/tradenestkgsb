# 🚀 Getting Started with Trade Nest

**Quick start guide to get your prototype running in 5 minutes**

## ✅ Phase 1 Status: COMPLETE

Your development environment is ready! Follow these steps to get started.

---

## 📋 Prerequisites Checklist

- [x] Node.js installed (we used npm successfully)
- [x] Supabase account created
- [x] Project initialized
- [x] Dependencies installed (452 packages)
- [x] Development server running at http://localhost:3000

---

## 🎯 Next Steps (Do These Now!)

### Step 1: Run Database Migration ⚙️

The database schema is ready but needs to be executed in Supabase.

**Actions:**
1. Open your Supabase dashboard:
   ```
   https://fckszlhkvdnrvgsjymgs.supabase.co
   ```

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Open this file in your editor:
   ```
   supabase/migrations/001_initial_schema.sql
   ```

5. Copy the ENTIRE file contents (all 300+ lines)

6. Paste into Supabase SQL Editor

7. Click **RUN** button (bottom right)

8. You should see: "Success. No rows returned"

**What this creates:**
- 8 database tables
- 2 views for common queries
- 2 helper functions
- Row-level security policies
- Indexes for performance

---

### Step 2: Access Setup Page 🖥️

Your Next.js server is already running!

**Actions:**
1. Open your browser

2. Go to:
   ```
   http://localhost:3000/setup
   ```

3. You should see a professional setup interface

**If the server isn't running:**
```bash
npm run dev
```

---

### Step 3: Seed the Database 🌱

This populates your database with realistic mock data.

**Actions:**
1. On the setup page, click **"Seed Database"** button

2. Wait 30-60 seconds

3. You'll see a summary with:
   - 50 Products
   - ~5,400 Price Records
   - ~60 Tariff Records
   - ~900 FX Rates
   - ~900 Freight Indexes
   - 10 Anomalies
   - 10 Alerts

**What gets created:**
- 6 months of historical trade data
- 50 products with real HS codes
- Demo anomalies for your pitch
- Alert records ready to display

---

### Step 4: Verify in Supabase 🔍

**Actions:**
1. Go back to Supabase dashboard

2. Click **Table Editor** in left sidebar

3. Click on **products** table
   - Should see 50 rows
   - Real HS codes like "8517.12", "1511.10"
   - Categories like Electronics, Agriculture

4. Click on **anomalies** table
   - Should see 10 rows
   - Various severities (critical, high, medium, low)
   - Different types (price_spike, tariff_change, etc.)

5. Try this SQL query in SQL Editor:
   ```sql
   SELECT * FROM v_alerts_with_details LIMIT 10;
   ```
   - Shows alerts with full details

---

## 🎉 You're Done with Phase 1!

### What You Now Have:

✅ **Running Application**
- Next.js dev server on port 3000
- Professional setup interface
- API endpoints for seeding

✅ **Database Infrastructure**
- 8 tables with relationships
- 7,000+ data points
- 6 months of historical data
- Real-world product catalog

✅ **Demo-Ready Data**
- 10 anomalies to showcase
- Multiple severity levels
- Different anomaly types
- Realistic trade scenarios

---

## 🔍 Quick Verification Checklist

Run through this to make sure everything works:

- [ ] Navigate to http://localhost:3000 - see Trade Nest homepage
- [ ] Navigate to http://localhost:3000/setup - see setup interface
- [ ] Supabase SQL Editor shows 8 tables in 'public' schema
- [ ] Products table has 50 rows
- [ ] Anomalies table has 10 rows
- [ ] No error messages in browser console
- [ ] No error messages in terminal

---

## 📊 What the Data Looks Like

### Sample Product:
```
HS Code: 8517.12
Description: Smartphones and cellular phones
Category: Electronics
```

### Sample Anomaly:
```
Type: price_spike
Severity: critical
Previous Price: MYR 1,500.00
Current Price: MYR 3,200.00
Change: +113.3%
Z-Score: 4.5 (threshold: 2.0)
```

### Sample Alert:
```
Status: new
Created: 2 days ago
Type: Price Spike - Electronics
Product: Smartphones and cellular phones
```

---

## 🎯 Ready for Phase 2

Now you can start building:

1. **Anomaly Detection Engine** - The algorithms that find anomalies
2. **Dashboard UI** - Visual interface to see alerts
3. **Charts & Graphs** - Price trends, anomaly timeline
4. **PDF Reports** - Evidence generation

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Check `.env.local` file exists
- Verify Supabase URL and key are correct
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Seeding fails"
- Make sure you ran the SQL migration first
- Check Supabase dashboard > SQL Editor for errors
- Try "Clear Database" then "Seed" again

### "Page not found"
- Make sure dev server is running
- Check terminal for errors
- Try: `npm run dev`

### "Dependency errors"
- Run: `npm install`
- Delete `node_modules` folder
- Run: `npm install` again

---

## 📚 Key Files Reference

**Read these to understand the project:**
- `README.md` - Main documentation
- `MASTER_PLAN.md` - Strategic roadmap
- `TASK_BREAKDOWN.md` - What's next to build
- `PHASE_1_SUMMARY.md` - What we just completed

**Database:**
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `lib/supabase/client.ts` - Database connection

**Mock Data:**
- `lib/mock-data/products.ts` - 50 products
- `lib/mock-data/generators.ts` - Data generators
- `lib/mock-data/seed.ts` - Seeding logic

---

## 💡 Pro Tips

1. **Bookmark these URLs:**
   - http://localhost:3000/setup
   - https://fckszlhkvdnrvgsjymgs.supabase.co

2. **Keep terminal open** to see server logs

3. **Use Supabase Table Editor** to inspect data visually

4. **Run queries in SQL Editor** to test data

5. **Reseed anytime** with the "Clear" then "Seed" buttons

---

## 🎤 Pitch Preparation

Even now, you can show investors:

1. **Professional Tech Stack**
   - Modern Next.js application
   - PostgreSQL database
   - TypeScript for reliability

2. **Real Data Structure**
   - Show Supabase tables
   - Explain the schema
   - Demonstrate data relationships

3. **Market Understanding**
   - 50 real product categories
   - Actual HS codes
   - Malaysian trade focus

4. **Clear Roadmap**
   - Phase 1 complete
   - 3 more phases planned
   - 8-day timeline to MVP

---

## ✨ What's Next?

Proceed to Phase 2 when ready:
```
Anomaly Detection Engine Development
- Z-score calculations
- Moving averages
- Threshold detection
- Alert generation
```

Or start building the UI:
```
Dashboard Development
- KPI cards
- Alert tables
- Charts and graphs
- Filters and search
```

---

**Current Status**: ✅ Phase 1 Complete - Ready to Build

**Your server is running at**: http://localhost:3000

**Setup page**: http://localhost:3000/setup

**Time to complete Phase 1**: ~2 hours

**Ready for seed capital pitch**: After Phase 2-4 (6 more days)

---

🎊 **Congratulations on completing Phase 1!** 🎊

You now have a solid foundation to build Trade Nest into a compelling prototype.