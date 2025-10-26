// Create Demo User in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Creating demo user in Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDemoUser() {
  try {
    // Try to sign up the demo user
    const { data, error } = await supabase.auth.signUp({
      email: 'test@tradenest.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Demo User',
        },
        emailRedirectTo: undefined, // Skip email confirmation for demo
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Demo user already exists!');
        console.log('   Email: test@tradenest.com');
        console.log('   Password: password123');
        console.log('\nYou can now login at: http://localhost:3007/login');
      } else {
        console.error('❌ Error creating user:', error.message);
      }
      return;
    }

    if (data.user) {
      console.log('✅ Demo user created successfully!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Password: password123');

      if (data.user.identities && data.user.identities.length === 0) {
        console.log('\n⚠️  Note: Email confirmation may be required.');
        console.log('   Check your Supabase dashboard to disable email confirmation');
        console.log('   or confirm the user manually.');
      } else {
        console.log('\n✅ User is ready to use!');
        console.log('   Login at: http://localhost:3007/login');
      }
    }

  } catch (err) {
    console.error('❌ Failed to create user:', err.message);
  }
}

createDemoUser();
