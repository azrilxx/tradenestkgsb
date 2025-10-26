import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { TradeRemedyCase } from '@/types/database';

// GET /api/trade-remedy - List trade remedy cases
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('trade_remedy_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      cases: data || [],
      pagination: {
        page,
        limit,
        total: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade remedy cases', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/trade-remedy - Create a new trade remedy case
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      case_number,
      case_name,
      petitioner_name,
      subject_product,
      hs_code,
      country_of_origin,
      petition_date,
      investigation_start_date,
      dumping_margin_percent,
      price_depression_percent,
      volume_impact_percent,
      status,
      notes,
    } = body;

    const { data, error } = await supabase
      .from('trade_remedy_cases')
      .insert({
        case_number,
        case_name,
        petitioner_name,
        subject_product,
        hs_code,
        country_of_origin,
        petition_date,
        investigation_start_date,
        dumping_margin_percent,
        price_depression_percent,
        volume_impact_percent,
        status: status || 'draft',
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case: data }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade remedy case', details: error.message },
      { status: 500 }
    );
  }
}

