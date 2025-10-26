import { NextResponse } from 'next/server';
import { generateAllAlerts, getAlertStatistics } from '@/lib/anomaly-detection/alert-generator';

/**
 * POST /api/detect - Run anomaly detection and generate alerts
 */
export async function POST() {
  try {
    console.log('🔍 Detection API called...');
    const result = await generateAllAlerts();

    return NextResponse.json({
      success: result.success,
      message: `Detection complete. ${result.alertsCreated} alerts created.`,
      data: result,
    });
  } catch (error) {
    console.error('Detection API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/detect - Get detection statistics
 */
export async function GET() {
  try {
    const stats = await getAlertStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}