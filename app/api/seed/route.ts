import { NextResponse } from 'next/server';
import { seedDatabase, clearDatabase } from '@/lib/mock-data/seed';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'clear') {
      await clearDatabase();
      return NextResponse.json({ success: true, message: 'Database cleared' });
    }

    if (action === 'seed') {
      const result = await seedDatabase();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Seed API - Use POST with {"action": "seed"} or {"action": "clear"}',
  });
}