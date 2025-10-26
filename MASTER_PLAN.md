# Trade Nest - Master Plan
**Version 1.0 | Prototype Phase (Week 1-2)**

## 🎯 Project Objective
Build a working prototype of Trade Nest - a trade anomaly detection SaaS platform - to secure seed capital funding from the office.

## 💰 Business Model
- **Revenue**: Subscription-based SaaS
- **Target Users**: Import/export businesses, trade compliance teams
- **Value Proposition**: Automated detection of pricing & tariff anomalies with evidence-based alerts

## 🏗️ Architecture Overview
**Technology Stack:**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Next.js API Routes + Supabase Edge Functions
- Database: Supabase (PostgreSQL + Auth + Realtime)
- UI Components: shadcn/ui
- Charts: Recharts
- PDF Generation: jsPDF

**Supabase Configuration:**
- Project URL: https://fckszlhkvdnrvgsjymgs.supabase.co
- API Key: [ANON_KEY - stored in .env.local]

## 📋 Core Features (Prototype Scope)

### 1. Data Foundation
- Mock data generators for:
  - UN Comtrade (import/export data)
  - DOSM (Malaysia statistical data)
  - BNM FX rates
  - Freightos freight indexes
- Database schema for normalized data storage

### 2. Anomaly Detection Engine
- **Price Anomaly Detection**
  - Z-score analysis (detect prices > 2 standard deviations)
  - Moving average comparison
  - Sudden spike detection
- **Tariff Change Detection**
  - Historical comparison
  - Threshold-based alerts
- **Freight Cost Monitoring**
  - Route-specific analysis
  - Cost trend tracking

### 3. Alert System
- Real-time alert generation
- Severity classification (Low, Medium, High, Critical)
- Alert history and tracking

### 4. Evidence Generation
- PDF report creation with:
  - Anomaly details
  - Historical data comparison
  - Visual charts
  - Data sources referenced

### 5. Dashboard Interface
- Key metrics overview
- Recent alerts panel
- Price trend charts
- Anomaly timeline
- Quick filters (product, date range, severity)

### 6. Authentication (Basic)
- Supabase Auth setup
- User registration/login
- Protected routes
- Ready for subscription tier implementation

## 🚫 Out of Scope (Prototype)
- Payment integration (Stripe/PayPal)
- Subscription tier management
- Real API integrations (using mock data only)
- Advanced reporting features
- Multi-tenant architecture
- Email notification system
- Mobile app
- Advanced analytics/ML models

## 📊 Success Criteria
**For Seed Capital Pitch:**
1. ✅ Working dashboard with real-time data visualization
2. ✅ Demonstrable anomaly detection (show 5+ detected anomalies)
3. ✅ PDF evidence generation (download sample report)
4. ✅ Professional UI/UX (investor-ready)
5. ✅ Clear data flow demonstration
6. ✅ Authentication system (show user management)

## 🗓️ Development Timeline

### Phase 1: Foundation (Days 1-2)
- Project initialization
- Supabase setup & schema
- Mock data generators
- Basic Next.js structure

### Phase 2: Core Logic (Days 3-4)
- Anomaly detection algorithms
- Alert generation system
- Data processing pipelines

### Phase 3: UI/UX (Days 5-6)
- Dashboard components
- Charts and visualizations
- Alert management interface

### Phase 4: Evidence & Polish (Days 7-8)
- PDF generation
- UI refinement
- Demo data population
- Documentation

## 📁 Project Structure
```
tradenest/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── alerts/              # Alert management
│   │   ├── api/                 # API routes
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── dashboard/           # Dashboard-specific
│   │   ├── charts/              # Chart components
│   │   └── alerts/              # Alert components
│   ├── lib/                     # Core business logic
│   │   ├── anomaly-detection/   # Detection algorithms
│   │   ├── mock-data/           # Data generators
│   │   ├── supabase/            # DB client & queries
│   │   ├── pdf/                 # PDF generation
│   │   └── utils/               # Utilities
│   └── types/                   # TypeScript definitions
├── supabase/
│   ├── migrations/              # Database migrations
│   └── functions/               # Edge functions
├── public/                      # Static assets
├── docs/                        # Documentation
├── MASTER_PLAN.md              # This file
├── TASK_BREAKDOWN.md           # Detailed tasks
└── project_brief.md            # Original brief
```

## 🔑 Key Differentiators
1. **Evidence-Based Alerts**: Not just notifications, but actionable reports
2. **Multi-Source Integration**: Combines tariff, price, FX, and freight data
3. **Malaysia Market Focus**: Specialized for Malaysian import/export
4. **Automated Compliance**: Reduces manual monitoring effort

## 💡 Future Monetization Strategy
**Tier Structure (Post-Prototype):**
- **Free**: 10 alerts/month, basic dashboard
- **Starter ($49/mo)**: 100 alerts/month, PDF reports, email notifications
- **Professional ($149/mo)**: Unlimited alerts, API access, custom rules
- **Enterprise ($499/mo)**: Multi-user, advanced analytics, dedicated support

## 📈 Metrics to Track (Demo)
- Total products monitored
- Anomalies detected (by type)
- Alert response time
- Data source coverage
- User engagement (dashboard views)

## 🎯 Pitch Preparation
**Key Demo Flow:**
1. Show dashboard with live data
2. Demonstrate anomaly detection (trigger a mock alert)
3. Generate and download PDF evidence
4. Show historical trend analysis
5. Explain subscription model potential
6. Present cost structure (Supabase free tier = $0 initial cost)

## 🔒 Security Considerations
- Environment variables for sensitive keys
- Row-level security in Supabase
- API route protection
- Input validation
- SQL injection prevention

## 📝 Documentation Requirements
- README with setup instructions
- API documentation
- Database schema diagram
- User guide (basic)
- Deployment guide

---

**Remember: This is a PROTOTYPE for funding. Focus on demonstrating value, not building a production-ready system. Every feature should answer: "Does this help secure funding?"**