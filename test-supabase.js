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

    // Test auth instead of querying users table
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('Session:', sessionData?.session ? 'Active' : 'None (this is normal)');

    // Try to sign in with demo credentials to test auth
    console.log('\nTesting authentication with demo credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@tradenest.com',
      password: 'password123',
    });

    if (authError) {
      console.log('ℹ️  Demo user login failed:', authError.message);
      console.log('   This is normal if the user hasn\'t been created yet.');
    } else {
      console.log('✅ Demo user login successful!');
      console.log('   User ID:', authData.user?.id);
      console.log('   Email:', authData.user?.email);
    }

  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
}

testConnection();
