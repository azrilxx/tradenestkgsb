// Test Supabase Connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('Anon Key length:', supabaseAnonKey?.length);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Try to query a simple table
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (error) {
      console.error('❌ Supabase error:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('Found users:', data?.length || 0);

    // Try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('ℹ️  No active session (this is normal)');
    } else {
      console.log('Session:', sessionData?.session ? 'Active' : 'None');
    }

  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
}

testConnection();
