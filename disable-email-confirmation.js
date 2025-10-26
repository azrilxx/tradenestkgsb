// Disable Email Confirmation in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key for admin access
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZja3N6bGhrdmRucnZnc2p5bWdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQyMzg1MiwiZXhwIjoyMDc2OTk5ODUyfQ.tLniuJJ1Rk_gNWPmt-FUK8saYVpYmta8ZjyqDNLBIQ4';

console.log('Disabling email confirmation in Supabase...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableEmailConfirmation() {
  try {
    // Get the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    console.log(`Found ${users.users.length} user(s) in database`);

    // Find the demo user
    const demoUser = users.users.find(u => u.email === 'test@tradenest.com');

    if (!demoUser) {
      console.log('❌ Demo user not found');
      return;
    }

    console.log(`\nFound demo user: ${demoUser.email}`);
    console.log(`User ID: ${demoUser.id}`);
    console.log(`Email confirmed: ${demoUser.email_confirmed_at ? 'Yes' : 'No'}`);

    if (demoUser.email_confirmed_at) {
      console.log('\n✅ Email already confirmed! User can login.');
      return;
    }

    // Update user to confirm email
    console.log('\nConfirming email...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('❌ Error updating user:', updateError.message);
      return;
    }

    console.log('✅ Email confirmed successfully!');
    console.log('\nUser can now login at: http://localhost:3007/login');
    console.log('Credentials:');
    console.log('  Email: test@tradenest.com');
    console.log('  Password: password123');

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

disableEmailConfirmation();
