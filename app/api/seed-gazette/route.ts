import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // Sample gazette data
    const sampleGazettes = [
      {
        gazette_number: 'P.U.(A) 123/2024',
        publication_date: '2024-01-15',
        category: 'anti_dumping',
        title: 'Notice of Anti-Dumping Investigation on Steel Imports',
        summary: 'Malaysian authorities announce preliminary affirmative determination in anti-dumping investigation concerning imports of certain flat-rolled steel products from China, India, and Vietnam.',
        pdf_url: 'https://lom.agc.gov.my',
        extracted_data: {
          investigation_number: 'AD/01/2024',
          subject_product: 'Flat-rolled steel products',
          countries: ['China', 'India', 'Vietnam'],
        },
        sector: 'Steel & Metals',
        estimated_impact_value: 125000000,
        duty_rate_min: 15.3,
        duty_rate_max: 42.7,
      },
      {
        gazette_number: 'P.U.(A) 156/2024',
        publication_date: '2024-02-20',
        category: 'tariff_change',
        title: 'Customs Duties Amendment (Import Duties) Order 2024',
        summary: 'Amendment to import duties on electronic components and integrated circuits.',
        pdf_url: 'https://lom.agc.gov.my',
        extracted_data: {
          effective_date: '2024-03-01',
          hs_codes: ['8542', '8471', '8517'],
        },
        sector: 'Electronics',
        estimated_impact_value: 89000000,
        duty_rate_min: 6.0,
        duty_rate_max: 10.0,
      },
      {
        gazette_number: 'P.U.(A) 189/2024',
        publication_date: '2024-03-10',
        category: 'trade_remedy',
        title: 'Safeguard Measure on Palm Oil Imports',
        summary: 'Malaysia imposes safeguard measures on certain palm oil products to protect domestic industry.',
        pdf_url: 'https://lom.agc.gov.my',
        extracted_data: {
          measure_type: 'safeguard',
          duration: '3 years',
        },
        sector: 'Food & Beverages',
        estimated_impact_value: 45000000,
        duty_rate_min: 8.0,
        duty_rate_max: 12.0,
      },
    ];

    const seeded = [];

    for (const gazetteData of sampleGazettes) {
      // Insert gazette
      const { data: gazette, error: gazError } = await supabase
        .from('gazettes')
        .insert(gazetteData)
        .select()
        .single();

      if (gazError) {
        console.error('Error inserting gazette:', gazError);
        continue;
      }

      // Insert affected item
      const affectedItem = {
        gazette_id: gazette.id,
        hs_codes: ['7208', '7214'], // Steel HS codes
        affected_countries: ['CN', 'IN', 'VN'],
        summary: 'Primary affected products and countries',
        remedy_type: 'anti_dumping',
        expiry_date: '2025-01-15',
        duty_rate: 28.5,
        affected_companies_count: 47,
      };

      await supabase.from('gazette_affected_items').insert(affectedItem);
      seeded.push(gazette.gazette_number);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded.length} gazettes`,
      gazettes: seeded,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to seed', details: error.message },
      { status: 500 }
    );
  }
}

