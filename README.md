# Trade Nest - Trade Intelligence Platform

**Enterprise-Grade Trade Anomaly Detection & Intelligence Platform**

[![Platform Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-1.0-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)]()
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)]()

---

## 🎯 Overview

Trade Nest is a comprehensive SaaS platform for trade anomaly detection, intelligence analysis, and compliance management. Built with enterprise-grade architecture for Malaysian import/export businesses.

### Key Features

✅ **Real-Time Anomaly Detection** - Automated detection of pricing & tariff anomalies  
✅ **Interconnected Intelligence** - Graph theory-based connection analysis  
✅ **AI-Powered Insights** - Llama 3 70B integration via OpenRouter  
✅ **Government Data Integration** - BNM FX rates, MATRADE statistics, Malaysian Gazettes  
✅ **Malaysian-Specific** - Gazette tracking, trade remedies, FMM portal  
✅ **Subscription Infrastructure** - Three-tier monetization (Free/Professional/Enterprise)  
✅ **Enterprise Security** - Multitenancy, RLS, audit trails

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenRouter API key (for AI features)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase and API keys

# Run database migrations
# See docs/deployment/APPLY_MISSING_MIGRATIONS.md

# Start development server
npm run dev

# Access the application
open http://localhost:3000
```

---

## 📁 Project Structure

```
tradenest/
├── app/                      # Next.js App Router
│   ├── api/                 # API endpoints (50+ routes)
│   ├── dashboard/           # Dashboard pages
│   ├── (auth)/              # Authentication pages
│   └── ...
├── components/              # React components (40+ components)
│   ├── dashboard/
│   ├── intelligence/
│   └── ui/
├── lib/                     # Business logic (50+ modules)
│   ├── analytics/
│   ├── anomaly-detection/
│   ├── api/                 # API middleware
│   ├── data-sources/
│   └── ...
├── scripts/                 # Utility scripts
│   ├── test/
│   ├── sql/
│   └── ...
├── supabase/               # Database
│   └── migrations/         # 24+ migrations
├── docs/                   # Documentation
│   ├── architecture/       # Technical docs
│   ├── deployment/         # Deployment guides
│   ├── fixes/              # Troubleshooting
│   ├── guides/             # Integration guides
│   ├── history/            # Phase summaries
│   ├── planning/           # Project planning
│   └── status/             # Status reports
└── types/                  # TypeScript definitions
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS**
- **Recharts** (visualization)
- **Cytoscape.js** (network graphs)

### Backend
- **Next.js API Routes**
- **Supabase** (PostgreSQL + Auth + Realtime)
- **OpenRouter AI** (Llama 3 70B)
- **jsPDF** (document generation)

### Infrastructure
- **Netlify** (hosting)
- **Sentry** (error monitoring)
- **Cron Jobs** (automated tasks)

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](docs/guides/GETTING_STARTED.md)
- [Environment Setup](docs/deployment/SETUP_ENV_FILE.md)
- [Database Setup](docs/guides/FULL_DATABASE_SETUP.md)

### Architecture
- [Platform Status Report](docs/status/PLATFORM_STATUS_REPORT.md)
- [Master Plan](docs/planning/MASTER_PLAN.md)
- [Task Breakdown](docs/planning/TASK_BREAKDOWN.md)

### Integration Guides
- [AI Integration](docs/guides/AI-GATEWAY-INTEGRATION.md)
- [FMM Integration](docs/guides/FMM-INTEGRATION-GUIDE.md)
- [MATRADE Data](docs/guides/MATRADE-DATA-INTEGRATION-PLAN.md)

### Deployment
- [Netlify Deployment](docs/deployment/NETLIFY_DEPLOYMENT_GUIDE.md)
- [Migration Guide](docs/deployment/DEPLOYMENT_CHECKLIST.md)

### Troubleshooting
- [Common Issues](docs/fixes/)
- [Data Sources](docs/DATA_SOURCES.md)

---

## 🗄️ Database

### Tables (20+)
- `products`, `price_data`, `tariff_data`, `fx_rates`
- `companies`, `ports`, `shipments`
- `alerts`, `anomalies`
- `organizations`, `user_org_memberships`
- `gazettes`, `trade_statistics`
- And more...

### Migrations (24+)
All migrations in `supabase/migrations/`

**Latest:**
- `024_multitenancy_orgs.sql` - Organizations & multitenancy
- `025_views_org_alerts.sql` - Org-scoped views

---

## 🔌 API Endpoints

### Analytics
- `GET /api/analytics/correlation` - Correlation analysis
- `POST /api/analytics/connections` - Connection analysis
- `GET /api/analytics/risk-score` - Risk scoring

### Intelligence
- `POST /api/analytics/connections/monitor` - Start monitoring
- `GET /api/analytics/insights/[alertId]` - AI insights
- `POST /api/analytics/scenario` - Scenario modeling

### Data Sources
- `GET /api/data-sources/refresh` - Refresh data
- `GET /api/cron/fetch-bnm-rates` - Fetch FX rates

### AI
- `POST /api/ai/chat` - AI chat
- `POST /api/ai/explain-alert` - Alert explanations
- `POST /api/ai/analyze-company` - Company analysis

---

## 🔐 Enterprise Features

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Organization-based multitenancy
- ✅ Audit trails for all operations
- ✅ API middleware (validation, rate limiting, idempotency)

### Monitoring
- ✅ Sentry error tracking
- ✅ Request logging
- ✅ Performance monitoring
- ✅ Data freshness tracking

### Subscription Tiers
- **Free**: 5 analyses/month, 30-day window
- **Professional**: Unlimited analyses, 90-day window
- **Enterprise**: ML predictions, API access, 180-day window

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Database migration test
npm run test-db

# AI integration test
npm run test-ai
```

### Test Scripts
Located in `scripts/test/`:
- `test-supabase.js` - Database connection
- `test-bnm-api.js` - BNM API integration
- `test-ai-local.js` - AI features

---

## 📊 Project Status

### Completion: 100%

- ✅ Phase 1: Foundation
- ✅ Phase 2: Core Logic
- ✅ Phase 3: User Interface
- ✅ Phase 4: Evidence & Polish
- ✅ Phase 5: Deployment
- ✅ Phase 6: Platform Enhancement
- ✅ Phase 7: Malaysia-Specific Features
- ✅ Phase 8: Wood Mackenzie Analytics

**All planned features complete and production-ready.**

---

## 🌍 Data Sources

### Real Government Data
- ✅ **BNM FX Rates** - Daily automated fetch
- ✅ **MATRADE Statistics** - Quarterly trade data
- ✅ **Malaysian Gazettes** - Automated PDF scraping

### Mock Data (for demo)
- ⚠️ Shipment details
- ⚠️ Price data

See [DATA_SOURCES.md](docs/DATA_SOURCES.md) for details.

---

## 🤝 Contributing

This is a proprietary project for seed capital funding.

For issues or questions:
1. Check [docs/fixes/](docs/fixes/) for solutions
2. Review [docs/status/](docs/status/) for latest status
3. See [docs/guides/](docs/guides/) for integration help

---

## 📝 License

Proprietary - Trade Nest Prototype

**Built with** ⚡ Next.js | 🗄️ Supabase | 🎨 Tailwind CSS | 🤖 AI

**Goal**: Secure seed capital funding 💰

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Status Reports**: [docs/status/](docs/status/)
- **Architecture**: [docs/architecture/](docs/architecture/)

---

**Last Updated**: January 2025  
**Version**: 1.0 Production-Ready  
**Platform**: Enterprise-Grade SaaS

