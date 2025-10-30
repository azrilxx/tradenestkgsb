// Cron Job: Daily BNM Exchange Rate Fetch
// Scheduled to run daily at 9 AM Malaysia Time (MYT)
// Configured via Vercel cron or Netlify scheduled functions

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the BNM API to fetch and store rates
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/data-sources/bnm?action=store`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch BNM rates');
    }

    return NextResponse.json({
      success: true,
      message: 'BNM rates fetched and stored successfully',
      timestamp: new Date().toISOString(),
      data: {
        stored: data.stored,
        pairs: data.stored || 0,
      },
    });
  } catch (error) {
    console.error('Cron job error (fetch-bnm-rates):', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

