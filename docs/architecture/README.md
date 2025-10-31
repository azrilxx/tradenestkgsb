# TradeNest Architecture

## Overview

TradeNest is built on Next.js 14 with TypeScript, using Supabase as the backend and Tailwind CSS for styling.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
tradenest/
├── app/                     # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── ai/            # AI-powered endpoints
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── associations/  # FMM association features
│   │   ├── alerts/        # Alert management
│   │   └── ...
│   ├── dashboard/         # Dashboard pages
│   ├── associations/      # Association portals
│   └── (auth)/           # Authentication pages
├── components/           # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── rules/           # Rule builder components
│   └── ui/              # Base UI components
├── lib/                  # Core business logic
│   ├── analytics/       # Analytics engines
│   ├── anomaly-detection/ # Detection algorithms
│   ├── customs-declaration/ # Customs checking
│   ├── mock-data/       # Mock data generators
│   ├── pdf/             # PDF generation
│   ├── rules-engine/    # Custom rule evaluator
│   ├── trade-remedy/    # Trade remedy calculations
│   └── supabase/        # Supabase clients
├── types/               # TypeScript definitions
├── scripts/             # Database scripts & utilities
├── supabase/           # Database migrations
└── docs/              # Documentation
```

## Architecture Layers

### 1. Presentation Layer (`app/`)

- **Dashboard Pages**: Main analytics, alerts, benchmarks
- **Association Portals**: FMM sector dashboards
- **Authentication**: Login/signup with Supabase Auth
- **API Routes**: RESTful endpoints for data operations

### 2. Business Logic Layer (`lib/`)

- **Anomaly Detection**: Z-score analysis, pattern detection
- **Analytics Engines**: Risk scoring, correlation analysis
- **Rule Engine**: Custom rule evaluation
- **PDF Generation**: Evidence report generation
- **Trade Remedy**: Dumping calculator, injury analysis

### 3. Data Layer (`supabase/`)

- **Migrations**: Database schema definitions
- **Row Level Security**: Multi-tenant data isolation
- **Views**: Optimized query views
- **Functions**: Database-level calculations

## Key Features

### 1. Anomaly Detection System
- Price spike detection (Z-score analysis)
- Tariff change monitoring
- Freight surge detection
- FX volatility tracking

### 2. Wood Mackenzie-Inspired Analytics
- Interconnected Intelligence Dashboard
- Risk scoring and prioritization
- Scenario modeling (What-If calculator)
- Cross-sector correlation analysis

### 3. Malaysia-Specific Features
- Gazette Tracker (schema ready, scraping pending)
- Trade Remedy Workbench
- FMM Association Portal (multi-tenant)
- Customs Declaration Checker

### 4. Enterprise Features
- Custom Rule Builder
- Executive Intelligence Reports
- Smart Insights (AI-generated recommendations)
- Benchmarks & Peer Comparison

## Database Schema

### Core Tables
- `products` - Product catalog with HS codes
- `companies` - Company profiles (FMM members)
- `ports` - Port location data
- `shipments` - Transaction history
- `anomalies` - Detected anomalies
- `alerts` - Alert management
- `gazettes` - Malaysian gazette entries
- `associations` - FMM association management
- `custom_rules` - User-defined detection rules

See `supabase/migrations/` for complete schema.

## Security

- Row Level Security (RLS) enabled on all tables
- Multi-tenant data isolation by user_id
- Environment variables for sensitive credentials
- Supabase Auth for authentication

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
vercel deploy
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` (for AI features)

## Development

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env.local` with Supabase credentials
4. Run migrations in Supabase SQL Editor
5. Start dev server: `npm run dev`
6. Seed database: visit `/setup` or run `npm run seed`

### Database Migration
- Create migration: Add SQL file to `supabase/migrations/`
- Apply migration: Run in Supabase SQL Editor or via CLI
- Versioning: Files named `001_*`, `002_*`, etc.

## Performance Optimizations

- Database indexes on foreign keys
- Materialized views for common queries
- API route caching where appropriate
- Lazy loading for heavy components
- Optimized Supabase queries with select() limits

## Testing

- Manual testing via `/detect` endpoint
- Seed database for demo data
- Test AI features via `/ai-assistant`

## Monitoring

- Supabase dashboard for database metrics
- Vercel analytics for performance
- Error tracking via Sentry (optional)

## Roadmap

- [ ] Gazette web scraping integration
- [ ] Real-time alerts via Supabase Realtime
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced ML models

