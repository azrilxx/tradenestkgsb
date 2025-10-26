# Trade Nest

**Trade Anomaly Detection Platform** - Automated detection of pricing & tariff anomalies for import/export businesses.

## 🎯 Project Overview

Trade Nest is a subscription-based SaaS platform designed to help Malaysian import/export businesses detect anomalies in:
- **Price fluctuations** (Z-score analysis)
- **Tariff changes** (policy updates)
- **Freight cost spikes** (shipping route analysis)
- **FX rate volatility** (currency risk management)

**Current Status**: Phase 3 Complete - Professional Dashboard UI ✅

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier)
- Git

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd tradenest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   The `.env.local` file is already configured with Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fckszlhkvdnrvgsjymgs.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Run database migration**
   - Go to [Supabase SQL Editor](https://fckszlhkvdnrvgsjymgs.supabase.co)
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire SQL file
   - Paste into SQL Editor and click **Run**

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Seed the database**
   - Navigate to: http://localhost:3000/setup
   - Click "Seed Database"
   - Wait for confirmation (creates 6 months of mock data + anomalies)

7. **Test anomaly detection**
   - Navigate to: http://localhost:3000/detect
   - Click "Run Detection"
   - View real-time anomaly detection results

## 📁 Project Structure

```
tradenest/
├── app/                      # Next.js App Router
│   ├── api/seed/            # Seeding API endpoint
│   ├── setup/               # Setup page for database initialization
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── lib/                     # Core business logic
│   ├── supabase/           # Supabase client setup
│   ├── mock-data/          # Mock data generators
│   │   ├── products.ts     # 50+ product definitions
│   │   ├── generators.ts   # Data generation utilities
│   │   └── seed.ts         # Database seeding script
│   ├── anomaly-detection/  # Detection algorithms (Phase 2)
│   ├── pdf/                # PDF generation (Phase 4)
│   └── utils/              # Helper utilities
├── types/                   # TypeScript type definitions
│   └── database.ts         # Database types
├── supabase/
│   ├── migrations/         # Database migration files
│   │   └── 001_initial_schema.sql
│   └── README.md           # Supabase setup guide
├── components/             # React components (Phase 3)
├── MASTER_PLAN.md         # Strategic roadmap
├── TASK_BREAKDOWN.md      # Detailed task list
└── project_brief.md       # Original project brief
```

## 🗄️ Database Schema

### Core Tables
- `products` - Product catalog with HS codes (50 products)
- `price_data` - Historical pricing (6 months, ~5,400 records)
- `tariff_data` - Tariff rates over time (~60 records)
- `fx_rates` - FX rates for 5 currency pairs (~900 records)
- `freight_index` - Freight costs for 5 routes (~900 records)
- `anomalies` - Detected anomalies (10 demo anomalies)
- `alerts` - Alert tracking system
- `users` - User profiles (extends Supabase Auth)

### Views
- `v_alerts_with_details` - Alerts joined with anomaly and product data
- `v_product_price_trends` - Price trends with anomaly flags

### Functions
- `calculate_price_stats()` - Calculate avg, stddev, min, max for price data
- `get_anomaly_count()` - Count anomalies by severity and date range

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Charts**: Recharts
- **PDF**: jsPDF
- **Icons**: Lucide React
- **Date Utils**: date-fns

## 📊 Phase Completion Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Next.js 14 project initialized
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Supabase client integration
- [x] Database schema (8 tables, 2 views, 2 functions)
- [x] Mock data generators (50 products)
- [x] 6 months historical data generation
- [x] 10 demo anomalies created
- [x] Database seeding API and UI

### ✅ Phase 2: Core Business Logic (COMPLETE)
- [x] Anomaly detection algorithms
  - [x] Z-score price spike detection
  - [x] Moving average analysis
  - [x] Tariff change detection
  - [x] Freight surge detection
  - [x] FX volatility detection
- [x] Alert generation system
- [x] Detection API endpoints
- [x] Detection dashboard UI

### ✅ Phase 3: User Interface (COMPLETE)
- [x] Dashboard layout with sidebar navigation
- [x] KPI cards (4 metrics)
- [x] Alert management UI with filtering
- [x] Charts and visualizations (Recharts)
- [x] Main dashboard page
- [x] Dedicated alerts page
- [x] Analytics page with insights
- [x] Products catalog page

### ⏳ Phase 4: Evidence & Polish
- [ ] PDF evidence generator
- [ ] UI refinement
- [ ] Documentation
- [ ] Testing

## 🎨 Design Philosophy

**Focus**: Investor-ready prototype for seed capital pitch
**Priority**: Demonstrable value over production-ready features
**Timeline**: 8-day sprint to working demo

## 📖 Key Documents

- [MASTER_PLAN.md](MASTER_PLAN.md) - Strategic roadmap and business model
- [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) - Detailed task checklist
- [PHASE_1_SUMMARY.md](PHASE_1_SUMMARY.md) - Foundation setup summary
- [PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md) - Detection engine summary
- [PHASE_3_SUMMARY.md](PHASE_3_SUMMARY.md) - Dashboard UI summary
- [GETTING_STARTED.md](GETTING_STARTED.md) - Quick start guide
- [project_brief.md](project_brief.md) - Original project brief
- [supabase/README.md](supabase/README.md) - Database setup guide

## 🔐 Security Notes

- Environment variables stored in `.env.local` (gitignored)
- Row-level security (RLS) enabled on all tables
- Public read access for prototype (restrict in production)
- Supabase anon key is safe for client-side use

## 🧪 Testing the Setup

After seeding, verify your data:

1. Go to Supabase dashboard > Table Editor
2. Check `products` table - should have 50 rows
3. Check `price_data` table - should have ~5,400 rows
4. Check `anomalies` table - should have 10 rows
5. Check `alerts` table - should have 10 rows

Query example in SQL Editor:
```sql
SELECT * FROM v_alerts_with_details LIMIT 10;
```

## 🚢 Deployment (Future)

```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel deploy
```

## 📞 Support

For issues or questions:
- Check [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) for current progress
- Review [MASTER_PLAN.md](MASTER_PLAN.md) for context
- Verify Supabase connection at http://localhost:3000/setup

## 📝 License

Proprietary - Trade Nest Prototype

---

**Built with** ⚡ Next.js | 🗄️ Supabase | 🎨 Tailwind CSS

**Goal**: Secure seed capital funding 💰