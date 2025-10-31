/**
 * GET /api/tariff-types
 * Returns list of all tariff types (trade agreements)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tariff_types')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching tariff types:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Tariff types error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tariff types' },
      { status: 500 }
    );
  }
}

