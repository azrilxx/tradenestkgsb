Project Brief
Trade Nest: Early Warning and Evidence Engine for Malaysian Steel Trade
________________________________________
Introduction
Trade Nest is a Malaysian-built trade intelligence platform created for steel manufacturers, associations, and trade consultants. It provides real-time visibility into import anomalies by using live shipment data and automated analytics. It replaces slow, manual reporting with a fast, transparent system that helps users act before market shocks impact their margins.
The platform addresses a major gap in Malaysia’s steel ecosystem. Current trade data is delayed and fragmented, leaving decision-makers to rely on assumptions instead of evidence. Trade Nest automates monitoring, identifies irregularities, and prepares defensible evidence packs that can support both internal decision-making and external trade petitions.
________________________________________
Problem
•	Mills lose profit from sudden import price drops and dumping.
•	Trade remedy data is outdated and manually compiled.
•	SMEs lack analysts and tools to monitor HS codes and freight movements.
•	Evidence preparation delays policy and legal response.
________________________________________
Solution
Trade Nest automates detection and reporting of import anomalies. It consolidates trade, freight, and FX data into one environment, applies analytical models, and generates alerts and professional evidence reports.
Step	Function	Description
1	Ingest	Collects HS6 import data, freight indexes, FX rates, and tariff updates.
2	Normalize	Cleans and aligns monthly import volumes and values by partner country.
3	Detect	Identifies anomalies using z-scores, moving averages, and mix shifts.
4	Context	Adjusts detection thresholds using freight and FX indexes.
5	Evidence	Produces structured PDF reports with data tables and charts.
6	Alert	Sends notifications through dashboard and email when thresholds are exceeded.
________________________________________
Core Features
•	HS code watchlist with custom thresholds
•	Automated PDF evidence generator
•	Real-time alert dashboard and case log
•	Gazette and tariff tracker
•	Data vault for audit and compliance
•	Monthly analytics brief for management
________________________________________
Technology
•	Frontend: Next.js or React
•	Backend: Python FastAPI or Node.js Express
•	Database: Supabase or PostgreSQL
•	Hosting: Cloudflare Pages and Workers
•	APIs: UN Comtrade, DOSM, BNM FX, Freightos Index
•	Analytics: Python Pandas and Matplotlib
________________________________________
Build Plan
Module	Description	Priority
Data Ingest	Import trade, FX, and freight data	High
Rules Engine	Detect anomalies and trigger alerts	High
Evidence Generator	Generate structured PDF reports	High
Dashboard	Web-based alert and monitoring interface	Medium
Gazette Tracker	Track remedies and expiry updates	Medium
Admin Console	Manage users, thresholds, and logs	Medium
________________________________________
Target Clients
•	Steel mills and rebar manufacturers
•	Industry associations and chambers
•	Trade law firms and anti-dumping consultants
•	Importers seeking compliance validation
•	Banks financing import-heavy portfolios
________________________________________
Revenue Model
Segment	Pricing	Notes
Single HS code monitoring	RM1,200 per month	Core data, alerts, one evidence pack per quarter
Mill bundle (5 HS codes)	RM4,500 per month	Extended partner coverage
Evidence pack on demand	RM1,500 per issue	Detailed graphs and data appendix
Association license	RM18,000 per year	Shared dashboard for members
Advisory partnership	30 percent referral share	For law firms and consultants
________________________________________
Expected Impact
•	Enables faster, evidence-based trade petitions.
•	Reduces data preparation time by 70 percent.
•	Provides analytical parity with global competitors.
•	Establishes a Malaysian-owned trade intelligence system.
________________________________________
Pilot Program
Objective: Monitor five HS codes tied to long and flat steel products across two partner countries for three months.
Deliverables: Alerts per anomaly, one evidence pack per case, onboard two mills and one association.
Timeline: - Week 1: Data schema and API setup - Week 2: Rule logic and detection module - Week 3: Alert engine and PDF generator - Week 4: Dashboard beta and pilot onboarding
________________________________________
Strategic Rationale
Malaysia loses millions each year due to invisible import behavior, weak analytics, and slow policy response. Trade Nest offers a real-time, verifiable, and automated system that enables industry players to protect margins and act decisively using credible, localized data.
