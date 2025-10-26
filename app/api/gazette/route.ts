import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { Gazette, GazetteSummary } from '@/types/database';

// GET /api/gazette - List gazettes with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const hsCode = searchParams.get('hs_code');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('gazettes')
      .select('*, gazette_affected_items(*)')
      .order('publication_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (hsCode || country) {
      // If filtering by HS code or country, we need to join with affected items
      const { data: affectedItems } = await supabase
        .from('gazette_affected_items')
        .select('gazette_id');

      const gazetteIds: string[] = [];

      if (hsCode) {
        const { data } = await supabase
          .from('gazette_affected_items')
          .select('gazette_id')
          .contains('hs_codes', [hsCode]);
        if (data) {
          gazetteIds.push(...data.map((item: any) => item.gazette_id));
        }
      }

      if (country) {
        const { data } = await supabase
          .from('gazette_affected_items')
          .select('gazette_id')
          .contains('affected_countries', [country]);
        if (data) {
          const countryIds = data.map((item: any) => item.gazette_id);
          if (hsCode) {
            // Intersect both filters
            const filtered = gazetteIds.filter(id => countryIds.includes(id));
            query = query.in('id', filtered);
          } else {
            query = query.in('id', countryIds);
          }
        } else if (hsCode) {
          query = query.in('id', gazetteIds);
        }
      } else if (hsCode) {
        query = query.in('id', gazetteIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      gazettes: data || [],
      pagination: {
        page,
        limit,
        total: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gazettes', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/gazette - Create a new gazette entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gazette_number, publication_date, category, pdf_url, title, summary, extracted_data, affected_items } = body;

    // Insert gazette
    const { data: gazette, error: gazetteError } = await supabase
      .from('gazettes')
      .insert({
        gazette_number,
        publication_date,
        category,
        pdf_url,
        title,
        summary,
        extracted_data,
      })
      .select()
      .single();

    if (gazetteError) {
      console.error('Supabase error:', gazetteError);
      return NextResponse.json({ error: gazetteError.message }, { status: 500 });
    }

    // Insert affected items if provided
    if (affected_items && affected_items.length > 0 && gazette) {
      const itemsToInsert = affected_items.map((item: any) => ({
        gazette_id: gazette.id,
        hs_codes: item.hs_codes || [],
        affected_countries: item.affected_countries || [],
        summary: item.summary,
        remedy_type: item.remedy_type,
        expiry_date: item.expiry_date,
      }));

      await supabase.from('gazette_affected_items').insert(itemsToInsert);
    }

    return NextResponse.json({ gazette }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to create gazette', details: error.message },
      { status: 500 }
    );
  }
}

