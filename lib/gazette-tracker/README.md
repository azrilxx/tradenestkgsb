# Gazette Tracker Module

Real-time gazette monitoring and scraping for Malaysian Federal Gazette.

## Overview

This module provides automated scraping, parsing, and matching of Malaysian government gazettes related to trade remedy measures.

## Components

### 1. Gazette Fetcher (`gazette-fetcher.ts`)
- Scrapes gazettes from https://lom.agc.gov.my
- Uses Puppeteer for web scraping
- Extracts gazette numbers, dates, categories, PDF URLs

### 2. PDF Parser (`pdf-parser.ts`)
- Downloads PDFs from gazette URLs
- Parses PDF content using pdf-parse library
- Extracts text and metadata

### 3. Content Extractor (`content-extractor.ts`)
- Extracts HS codes from text
- Identifies affected countries
- Determines remedy types
- Extracts dates and regulatory authorities

### 4. Match Engine (`match-engine.ts`)
- Matches gazettes to user watchlists
- Calculates confidence scores
- Creates automatic alerts
- Batch processes multiple gazettes

### 5. Email Notifier (`email-notifier.ts`)
- Sends email alerts for matched gazettes
- Pluggable email service support
- HTML email templates

### 6. Steel Matcher (`steel-matcher.ts`)
- Matches gazettes to steel products
- Uses MITI Roadmap steel product definitions
- HS code based matching

## Usage

### Manual Scraping

```bash
npm run scrape-gazettes
```

### API Endpoint

```bash
curl -X POST http://localhost:3000/api/gazette/scrape
```

### Programmatic Usage

```typescript
import { scrapeGazettes } from '@/lib/gazette-tracker/gazette-fetcher';
import { downloadAndParsePdf } from '@/lib/gazette-tracker/pdf-parser';
import { extractGazetteData } from '@/lib/gazette-tracker/content-extractor';
import { batchMatchGazettes } from '@/lib/gazette-tracker/match-engine';

// Scrape gazettes
const gazettes = await scrapeGazettes(50);

// Parse PDF
const pdfContent = await downloadAndParsePdf(pdfUrl);
const data = extractGazetteData(pdfContent.text, 'Title');

// Match to watchlists
await batchMatchGazettes(['gazette-id-1', 'gazette-id-2']);
```

## Configuration

### Environment Variables

```env
CRON_SECRET_KEY=your-secret-key
NEXT_PUBLIC_SITE_URL=https://your-app.netlify.app
SENDGRID_API_KEY=your-sendgrid-key  # For email notifications
```

### Cron Job

Add to crontab for daily execution at 9 AM MYT:

```bash
0 1 * * * cd /path/to/tradenest && npm run scrape-gazettes
```

Or use external cron service calling:
```
GET https://your-app.netlify.app/api/gazette/scrape/scheduled
```

## Testing

```bash
# Infect scraping
npm run scrape-gazettes

# Check database
psql -d your_db -c "SELECT * FROM gazettes ORDER BY publication_date DESC LIMIT 10;"
```

## Notes

- Scraping may fail if AGC website is unavailable
- PDF parsing works best with text-based PDFs (not scanned images)
- Matching accuracy depends on quality of extracted data
- Email notifications require email service configuration

