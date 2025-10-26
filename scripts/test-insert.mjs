import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test with a single company
const testCompany = {
  name: '004 International (MY) Sdn Bhd',
  country: 'Malaysia',
  type: 'both',
  sector: 'Chemicals & Petrochemicals'
};

console.log('Testing single company insert...');
console.log('Company data:', JSON.stringify(testCompany, null, 2));

const { data, error } = await supabase
  .from('companies')
  .insert([testCompany])
  .select();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Success!', data);
}

// Also check what's currently in the table
const { data: existing, error: fetchError } = await supabase
  .from('companies')
  .select('*')
  .limit(5);

console.log('\nExisting companies:', existing);
