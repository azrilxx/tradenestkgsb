const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ";
process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyViewPermissions() {
  console.log('🔄 Applying view permissions for shipment_details...\n');

  const sql = `
    -- Grant SELECT permission on the view to anonymous role
    GRANT SELECT ON shipment_details TO anon;
    
    -- Grant SELECT permission to authenticated role
    GRANT SELECT ON shipment_details TO authenticated;
    
    -- Grant SELECT permission to public role
    GRANT SELECT ON shipment_details TO public;
    
    -- Make the view use SECURITY INVOKER to respect RLS on underlying tables
    ALTER VIEW shipment_details SET (security_invoker = true);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Fallback: Try direct query approach
      console.log('⚠️  RPC exec failed, trying alternative approach...');

      // Read the migration file
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '014_fix_shipment_details_view_permissions.sql');

      if (fs.existsSync(migrationPath)) {
        console.log('✅ Migration file found. Please apply it manually:');
        console.log(`\n📄 File: ${migrationPath}`);
        console.log('\n📋 SQL to run in Supabase Dashboard:\n');
        console.log(fs.readFileSync(migrationPath, 'utf8'));
        console.log('\n💡 Instructions:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click "Run"\n');
      } else {
        console.log('❌ Migration file not found');
        process.exit(1);
      }
    } else {
      console.log('✅ View permissions applied successfully!\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please apply this SQL manually in Supabase Dashboard:\n');
    console.log(sql);
    process.exit(1);
  }
}

applyViewPermissions();

