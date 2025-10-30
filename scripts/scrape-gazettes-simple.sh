#!/bin/bash
# Daily Gazette Scraping Script - Simple version
# Task 2.4: Daily Cron Job
# Usage: Add to crontab for daily execution at 9 AM MYT

echo "[$(date)] Starting daily gazette scraping..."

# Call the API endpoint
curl -X POST http://localhost:3000/api/gazette/scrape \
  -H "Content-Type: application/json"

echo ""
echo "[$(date)] Scraping complete"

