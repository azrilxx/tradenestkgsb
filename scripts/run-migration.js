const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '010_fix_anomalies_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration: 010_fix_anomalies_schema.sql');
  console.log('SQL:', migrationSQL.substring(0, 200) + '...');

  // Execute migration
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    console.error('Migration failed:', error);

    // Try alternative approach: use raw SQL query
    console.log('\nTrying alternative approach...');
    const { error: altError } = await supabase.from('_migrations').select('*').limit(1);

    if (altError) {
      console.log('Alternative approach also failed. Trying direct query...');

      // Split into individual statements and execute
      const statements = migrationSQL.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            console.error('Statement failed:', stmtError);
          }
        }
      }
    }
  } else {
    console.log('Migration completed successfully!');
    console.log('Result:', data);
  }
}

runMigration().catch(console.error);