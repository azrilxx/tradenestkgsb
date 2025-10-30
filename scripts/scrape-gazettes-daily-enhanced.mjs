// Daily Gazette Scraping Cron Job
// Task 2.4: Daily Cron Job
// Run this script daily to scrape new gazettes and send notifications

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function scrapeGazettes() {
  console.log(`[${new Date().toISOString()}] Starting daily gazette scraping...`);
  console.log(`Using API URL: ${API_URL}`);

  try {
    const response = await fetch(`${API_URL}/api/gazette/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error(`✗ API returned error status ${response.status}`);
      console.error(`Response: ${text.substring(0, 200)}...`);
      console.log('\n💡 Make sure the development server is running: npm run dev');
      return false;
    }

    const result = await response.json();

    if (result.success) {
      console.log(`✓ Successfully processed ${result.stats.processed} gazettes`);
      console.log(`  - Scraped: ${result.stats.scraped}`);
      console.log(`  - New: ${result.stats.new}`);
      console.log(`  - Errors: ${result.stats.errors}`);

      // Send email notifications if new gazettes were found
      if (result.stats.new > 0) {
        console.log(`📧 ${result.stats.new} new gazettes found - email notifications would be sent`);
        // TODO: Implement email notification system
      }

      return true;
    } else {
      console.error('✗ Scraping failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('✗ Error running scrape:', error.message);

    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Make sure the development server is running: npm run dev');
      console.log('   Or use the API endpoint directly when deployed.');
    }

    return false;
  }
}

// Run the scraper
scrapeGazettes()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
