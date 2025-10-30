import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { fetchBNMFXRates } from '@/lib/data-sources/bnm-fx';
import { DataSource } from '@/lib/data-sources/types';
import { logDataSourceOperation } from '@/lib/data-sources/utils';

/**
 * POST /api/data/ingest-fx
 * Ingest latest FX rates from BNM API
 */
export async function POST(request: Request) {
  try {
    logDataSourceOperation(DataSource.BNM, 'Starting FX ingestion', {});

    // Fetch latest rates from BNM
    const rates = await fetchBNMFXRates();

    if (rates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No rates fetched from BNM',
        recordsInserted: 0,
        recordsUpdated: 0
      }, { status: 500 });
    }

    // Prepare data for database
    const insertData = rates.map(rate => ({
      currency_pair: rate.currency_pair,
      rate: rate.rate.toString(),
      date: rate.date.toISOString().split('T')[0],
      source: rate.source
    }));

    // Insert or update (upsert based on currency_pair + date unique constraint)
    let insertedCount = 0;
    let updatedCount = 0;

    for (const data of insertData) {
      const { data: existing, error: checkError } = await supabase
        .from('fx_rates')
        .select('id')
        .eq('currency_pair', data.currency_pair)
        .eq('date', data.date)
        .single();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('fx_rates')
          .update(data)
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
        } else {
          updatedCount++;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('fx_rates')
          .insert(data);

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          insertedCount++;
        }
      }
    }

    logDataSourceOperation(DataSource.BNM, 'FX ingestion complete', {
      inserted: insertedCount,
      updated: updatedCount,
      total: rates.length
    });

    return NextResponse.json({
      success: true,
      source: DataSource.BNM,
      recordsInserted: insertedCount,
      recordsUpdated: updatedCount,
      totalRecords: rates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('FX ingestion error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recordsInserted: 0,
      recordsUpdated: 0
    }, { status: 500 });
  }
}

/**
 * GET /api/data/ingest-fx
 * Get ingestion status
 */
export async function GET(request: Request) {
  try {
    // Get latest FX rates from database
    const { data: latestRates, error } = await supabase
      .from('fx_rates')
      .select('currency_pair, date, source')
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      latestRates: latestRates || [],
      message: 'FX ingestion endpoint is ready'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

