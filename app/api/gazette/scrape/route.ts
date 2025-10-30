import { NextResponse } from 'next/server';
import { scrapeGazettes, filterNewGazettes } from '@/lib/gazette-tracker/gazette-fetcher';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/gazette/scrape
 * Scrape new gazettes from Malaysian Federal Gazette and store in database
 */
export async function POST() {
  try {
    console.log('🔍 Starting gazette scraping...');

    // Step 1: Scrape gazettes from website
    const scrapedGazettes = await scrapeGazettes(50); // Limit to 50 for performance

    if (scrapedGazettes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No gazettes found on website',
        stats: {
          scraped: 0,
          new: 0,
          processed: 0,
          errors: 0
        }
      });
    }

    console.log(`📄 Scraped ${scrapedGazettes.length} gazettes from website`);

    // Step 2: Get existing gazette numbers from database
    const { data: existingGazettes, error: fetchError } = await supabase
      .from('gazettes')
      .select('gazette_number');

    if (fetchError) {
      console.error('Error fetching existing gazettes:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch existing gazettes',
        details: fetchError.message
      }, { status: 500 });
    }

    const existingGazetteNumbers = existingGazettes?.map(g => g.gazette_number) || [];

    // Step 3: Filter to only new gazettes
    const newGazettes = await filterNewGazettes(scrapedGazettes, existingGazetteNumbers);

    console.log(`🆕 Found ${newGazettes.length} new gazettes`);

    if (newGazettes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new gazettes to process',
        stats: {
          scraped: scrapedGazettes.length,
          new: 0,
          processed: 0,
          errors: 0
        }
      });
    }

    // Step 4: Process and store new gazettes
    let processedCount = 0;
    let errorCount = 0;

    for (const gazette of newGazettes) {
      try {
        console.log(`Processing: ${gazette.gazette_number}`);

        // Insert gazette
        const { data: insertedGazette, error: insertError } = await supabase
          .from('gazettes')
          .insert({
            gazette_number: gazette.gazette_number,
            publication_date: gazette.publication_date,
            category: gazette.category,
            pdf_url: gazette.pdf_url,
            title: gazette.title,
            summary: gazette.summary,
            extracted_data: {
              scraped_at: new Date().toISOString(),
              source: 'malaysian_federal_gazette',
              download_url: gazette.download_url
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting ${gazette.gazette_number}:`, insertError.message);
          errorCount++;
          continue;
        }

        // Insert basic affected item
        if (insertedGazette) {
          await supabase
            .from('gazette_affected_items')
            .insert({
              gazette_id: insertedGazette.id,
              hs_codes: [],
              affected_countries: [],
              summary: gazette.summary || 'Scraped from Malaysian Federal Gazette',
              remedy_type: null,
              expiry_date: null
            });
        }

        processedCount++;
        console.log(`✅ Successfully processed: ${gazette.gazette_number}`);

      } catch (error) {
        console.error(`Error processing ${gazette.gazette_number}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Scraping complete! Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedCount} new gazettes`,
      stats: {
        scraped: scrapedGazettes.length,
        new: newGazettes.length,
        processed: processedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('Fatal error in gazette scraping:', error);
    return NextResponse.json({
      success: false,
      error: 'Gazette scraping failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/gazette/scrape
 * Get scraping status and statistics
 */
export async function GET() {
  try {
    const { data: gazettes, error } = await supabase
      .from('gazettes')
      .select('gazette_number, publication_date, category, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch gazette statistics',
        details: error.message
      }, { status: 500 });
    }

    const stats = {
      total_gazettes: gazettes?.length || 0,
      latest_gazette: gazettes?.[0]?.gazette_number || 'None',
      latest_date: gazettes?.[0]?.publication_date || 'None',
      categories: gazettes?.reduce((acc, g) => {
        acc[g.category] = (acc[g.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json({
      success: true,
      stats,
      recent_gazettes: gazettes || []
    });

  } catch (error) {
    console.error('Error fetching scraping status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scraping status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}