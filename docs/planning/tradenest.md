TRADE NEST
Early Warning and Evidence Engine for Malaysian Steel Trade

Purpose
Detect abnormal import activities by HS code. Produce instant evidence packs for mills, associations, and advisors. Support trade remedy actions with verified, data-backed insights.

Problem
• Mills lose margin from sudden import price drops and dumping.
• Data for trade remedies is scattered, outdated, and manually compiled.
• SMEs lack analysts and tools to monitor HS codes and freight context.
• Evidence packs take weeks to prepare, delaying policy response.

Solution
Automate monitoring, detection, and reporting of import anomalies. Deliver clear, verifiable data and charts in a single interface.

| Step | Function  | Description                                                                                |
| ---- | --------- | ------------------------------------------------------------------------------------------ |
| 1    | Ingest    | Pulls HS6 import data (Comtrade), freight proxies, FX rates (BNM API), and tariff updates. |
| 2    | Normalize | Cleans and aligns monthly import volumes and values per partner country.                   |
| 3    | Detect    | Runs anomaly detection using z-scores, moving averages, and partner mix shifts.            |
| 4    | Context   | Adjusts thresholds with freight and FX indexes to prevent false alerts.                    |
| 5    | Evidence  | Generates ready-to-submit PDF case packs with graphs, tables, and references.              |
| 6    | Alert     | Notifies users via dashboard and email when anomalies exceed set thresholds.               |

Core Features
• HS code watchlist with custom thresholds
• Alert dashboard and case log
• Automated evidence pack in PDF format
• Gazette and tariff tracker
• Data vault for case storage and audit use
• Monthly analytics brief for management

Technology
Frontend: Next.js or React
Backend: Python FastAPI or Node.js Express
Database: Supabase or PostgreSQL
Hosting: Cloudflare Pages and Workers
APIs: UN Comtrade, DOSM, BNM FX, Freightos Index (manual CSV)
Analytics: Python Pandas and Matplotlib for computation and charts

What We Are Building

| Module             | Description                           | Build Priority |
| ------------------ | ------------------------------------- | -------------- |
| Data Ingest        | Import trade, FX, and freight data    | High           |
| Rules Engine       | Detect anomalies and trigger alerts   | High           |
| Evidence Generator | Produce structured PDF reports        | High           |
| Dashboard          | Web-based monitoring and alert center | Medium         |
| Gazette Tracker    | Track remedies and expiry updates     | Medium         |
| Admin Console      | Manage users, thresholds, and logs    | Medium         |

Target Clients
• Steel mills and rebar processors
• Industry associations and chambers
• Trade law firms and anti-dumping consultants
• Importers seeking compliance assurance
• Banks financing import-heavy portfolios

Revenue Model

| Segment                   | Pricing            | Notes                                       |
| ------------------------- | ------------------ | ------------------------------------------- |
| Single HS code monitoring | RM1,200 per month  | Core data, alerts, and one pack per quarter |
| Mill bundle (5 HS codes)  | RM4,500 per month  | Extended partner coverage                   |
| Evidence pack on demand   | RM1,500 per issue  | Detailed graphs and data appendix           |
| Association license       | RM18,000 per year  | Shared dashboard for members                |
| Advisory partnership      | 30% referral share | Law firms and consultants                   |

Impact
• Enables faster trade petitions with defensible evidence.
• Reduces data prep time by 70 percent.
• Gives local mills visibility equal to multinational traders.
• Builds a Malaysia-focused trade intelligence layer, owned locally.

Pilot Objective
Monitor 5 HS codes linked to long and flat products for 2 partner countries. Deliver 3 months of alerts and 1 evidence pack per anomaly. Onboard 2 mills and 1 association.

Milestones
Week 1: Data schema and API connections
Week 2: Rule logic and detection module
Week 3: Alert engine and PDF generator
Week 4: Dashboard beta and pilot client onboarding
