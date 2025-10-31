import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { data, share_for_benchmarks } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No data provided', inserted: 0, errors: [] },
        { status: 400 }
      );
    }

    const errors: Array<{ row: number; error: string }> = [];
    let insertedCount = 0;
    let shareableCount = 0;

    // Get or create products for each HS code
    const hsCodes = [...new Set(data.map((row: any) => row.hs_code))];
    const productMap = new Map();

    for (const hsCode of hsCodes) {
      // Check if product exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('hs_code', hsCode)
        .single();

      if (existingProduct) {
        productMap.set(hsCode, existingProduct.id);
      } else {
        // Create product if doesn't exist
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            hs_code: hsCode,
            description: data.find((r: any) => r.hs_code === hsCode)?.description || 'Unknown',
            category: getCategoryFromHSCode(hsCode),
          })
          .select()
          .single();

        if (createError || !newProduct) {
          console.error('Error creating product:', createError);
        } else {
          productMap.set(hsCode, newProduct.id);
        }
      }
    }

    // Get or create companies (use origin country for now)
    const companies = [...new Set(data.map((row: any) => row.origin_country))];
    const companyMap = new Map();

    for (const country of companies) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', country)
        .single();

      if (existingCompany) {
        companyMap.set(country, existingCompany.id);
      } else {
        // Create company placeholder
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: country,
            country: country,
            type: 'exporter',
            sector: 'Unknown',
          })
          .select()
          .single();

        if (createError || !newCompany) {
          console.error('Error creating company:', createError);
        } else {
          companyMap.set(country, newCompany.id);
        }
      }
    }

    // Insert shipments in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const shipmentsToInsert = [];

      for (const row of batch) {
        const productId = productMap.get(row.hs_code);
        const companyId = companyMap.get(row.origin_country);

        if (!productId || !companyId) {
          errors.push({ row: i + 1, error: 'Missing product or company' });
          continue;
        }

        shipmentsToInsert.push({
          product_id: productId,
          company_id: companyId,
          shipment_date: row.shipment_date,
          unit_price: row.unit_price,
          total_value: row.total_value,
          weight_kg: row.weight_kg,
          volume_m3: row.volume_m3,
          currency: row.currency,
          hs_code: row.hs_code, // Denormalized for quick filtering
          invoice_number: row.invoice_number,
          bl_number: row.bl_number,
          vessel_name: row.vessel_name,
          container_count: row.container_count,
          freight_cost: row.freight_cost,
          origin_country: row.origin_country,
          destination_country: row.destination_country,
          // Mark as shareable if user opted in
          shared_for_benchmarks: share_for_benchmarks ? true : false,
        });
      }

      if (shipmentsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shipments')
          .insert(shipmentsToInsert);

        if (insertError) {
          console.error('Batch insert error:', insertError);
          errors.push({ row: i + 1, error: insertError.message });
        } else {
          insertedCount += shipmentsToInsert.length;
          if (share_for_benchmarks) {
            shareableCount += shipmentsToInsert.length;
          }
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length > 0
        ? `Inserted ${insertedCount} shipments with ${errors.length} errors`
        : `Successfully inserted ${insertedCount} shipments`,
      inserted: insertedCount,
      errors,
      shareable_count: shareableCount,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to upload data',
        inserted: 0,
        errors: [],
      },
      { status: 500 }
    );
  }
}

// Helper function to categorize HS codes
function getCategoryFromHSCode(hsCode: string): string {
  const code = parseInt(hsCode);
  if (isNaN(code)) return 'Unknown';

  if (code >= 7200 && code < 7300) return 'Steel & Metals';
  if (code >= 8400 && code < 8500) return 'Machinery';
  if (code >= 8500 && code < 8600) return 'Electronics';
  if (code >= 9000 && code < 9100) return 'Optical/Medical';
  if (code >= 3800 && code < 3900) return 'Chemicals';
  if (code >= 5000 && code < 6400) return 'Textiles';

  return 'Other';
}

