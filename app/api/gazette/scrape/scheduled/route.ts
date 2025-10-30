// Scheduled Gazette Scraping Endpoint
// Task 2.4: Cron-friendly endpoint for external schedulers
// This endpoint can be called by external cron services like cron-job.org

import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for better compatibility with external cron

export async function GET(request: Request) {
  // Verify request is from authorized source (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_KEY;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Call the scraping endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.url.split('/api')[0];
    const scrapeUrl = `${baseUrl}/api/gazette/scrape`;

    const response = await fetch(scrapeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      message: 'Gazette scraping triggered',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('Error in scheduled scraping:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger scraping',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

