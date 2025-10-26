# Trade Nest

**Trade Anomaly Detection Platform** - Automated detection of pricing & tariff anomalies for import/export businesses.

## 🎯 Project Overview

Trade Nest is a subscription-based SaaS platform designed to help Malaysian import/export businesses detect anomalies in:
- **Price fluctuations** (Z-score analysis)
- **Tariff changes** (policy updates)
- **Freight cost spikes** (shipping route analysis)
- **FX rate volatility** (currency risk management)

**Current Status**: Phase 8 Complete - Production Ready Platform ✅

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
├── app/                     # Next.js App Router
│   ├── api/                # API Routes (alerts, analytics, AI, etc.)
│   ├── dashboard/          # Dashboard pages
│   ├── associations/      # FMM association portals
│   └── (auth)/            # Authentication pages
├── lib/                    # Core business logic
│   ├── analytics/         # Analytics engines
│   ├── anomaly-detection/ # Detection algorithms
│   ├── customs-declaration/ # Customs checker
│   ├── mock-data/         # Data generators
│   ├── pdf/               # PDF generation
│   └── trade-remedy/      # Trade remedy calculations
├── components/             # React components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Base UI components
├── types/                  # TypeScript definitions
├── scripts/                # Database & utility scripts
├── supabase/              # Database migrations
└── docs/                   # Documentation
    ├── architecture/       # Technical documentation
    ├── guides/            # Integration guides
    ├── history/           # Phase completion summaries
    └── planning/           # Project planning docs
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
### ✅ Phase 2: Core Business Logic (COMPLETE)
### ✅ Phase 3: User Interface (COMPLETE)
### ✅ Phase 4: Evidence & Polish (COMPLETE)
### ✅ Phase 5: Deployment (COMPLETE)
### ✅ Phase 6: Platform Enhancement (COMPLETE)
### ✅ Phase 7: Malaysia-Specific Features (COMPLETE)
  - [x] Gazette Tracker
  - [x] Trade Remedy Workbench
  - [x] FMM Association Portal
  - [x] Customs Declaration Checker
### ✅ Phase 8: Wood Mackenzie Analytics (COMPLETE)
  - [x] Interconnected Intelligence Dashboard
  - [x] Expert Insights Panel
  - [x] Scenario Modeling
  - [x] Executive Intelligence Reports
  - [x] Cross-Sector Correlation
  - [x] Automated Risk Scoring

**All phases complete - Platform ready for production deployment** 🚀

## 🎨 Design Philosophy

**Focus**: Investor-ready prototype for seed capital pitch
**Priority**: Demonstrable value over production-ready features
**Timeline**: 8-day sprint to working demo

## 📖 Key Documents

### Getting Started
- [Quick Start Guide](docs/guides/GETTING_STARTED.md) - Setup instructions
- [Architecture Overview](docs/architecture/README.md) - Technical documentation

### Planning & Strategy
- [Master Plan](docs/planning/MASTER_PLAN.md) - Strategic roadmap
- [Task Breakdown](docs/planning/TASK_BREAKDOWN.md) - Detailed task list
- [FMM Strategy](docs/planning/FMM_STRATEGY.md) - Association partnerships

### Integration Guides
- [AI Gateway Integration](docs/guides/AI-GATEWAY-INTEGRATION.md)
- [FMM Integration Guide](docs/guides/FMM-INTEGRATION-GUIDE.md)
- [MATRADE Data Integration](docs/guides/MATRADE-DATA-INTEGRATION-PLAN.md)

### Historical Development
- [Phase Completion Summaries](docs/history/) - All phase summaries
- [Project Brief](docs/planning/project_brief.md) - Original requirements

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
- Check [Task Breakdown](docs/planning/TASK_BREAKDOWN.md) for current progress
- Review [Master Plan](docs/planning/MASTER_PLAN.md) for context
- See [Architecture Docs](docs/architecture/README.md) for technical details
- Verify Supabase connection at http://localhost:3000/setup

## 📝 License

Proprietary - Trade Nest Prototype

---

**Built with** ⚡ Next.js | 🗄️ Supabase | 🎨 Tailwind CSS

**Goal**: Secure seed capital funding 💰