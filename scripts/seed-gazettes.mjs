// Seed Malaysian Federal Gazette Data
// Task 7.1: Gazette Tracker Demo Data

import { createClient } from '@supabase/supabase-js';
import { mockGazettes } from '../lib/mock-data/gazette-data.ts';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedGazettes() {
  console.log('🌱 Seeding Malaysian Federal Gazette data...');

  let seededCount = 0;
  let errorCount = 0;

  for (const gazette of mockGazettes) {
    try {
      // Insert gazette
      const { data: gazetteData, error: gazetteError } = await supabase
        .from('gazettes')
        .insert({
          gazette_number: gazette.gazette_number,
          publication_date: gazette.publication_date,
          category: gazette.category,
          title: gazette.title,
          summary: gazette.summary,
          pdf_url: gazette.pdf_url,
          extracted_data: gazette.extracted_data,
        })
        .select()
        .single();

      if (gazetteError) {
        console.error(`❌ Error inserting gazette ${gazette.gazette_number}:`, gazetteError.message);
        errorCount++;
        continue;
      }

      // Insert affected items
      if (gazette.affected_items && gazetteData) {
        for (const item of gazette.affected_items) {
          const { error: itemError } = await supabase
            .from('gazette_affected_items')
            .insert({
              gazette_id: gazetteData.id,
              hs_codes: item.hs_codes,
              affected_countries: item.affected_countries,
              summary: item.summary,
              remedy_type: item.remedy_type,
              expiry_date: item.expiry_date,
            });

          if (itemError) {
            console.error(`❌ Error inserting affected item:`, itemError.message);
          }
        }
      }

      seededCount++;
      console.log(`✅ Seeded: ${gazette.gazette_number} - ${gazette.title}`);
    } catch (error) {
      console.error(`❌ Error:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully seeded: ${seededCount} gazettes`);
  console.log(`❌ Errors: ${errorCount}`);
}

seedGazettes()
  .then(() => {
    console.log('\n✨ Gazette seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

