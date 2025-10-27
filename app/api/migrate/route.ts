import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { migration } = await request.json();

    if (!migration) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', `${migration}.sql`);

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ error: 'Migration file not found' }, { status: 404 });
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migration}.sql`);

    // Execute the SQL directly
    // Note: Supabase doesn't have a direct exec_sql RPC by default
    // We'll need to execute this through psql or the Supabase dashboard
    // For now, return the SQL to be executed manually

    return NextResponse.json({
      success: false,
      message: 'Please run this migration manually through Supabase dashboard SQL Editor',
      sql: migrationSQL,
      instructions: [
        '1. Go to https://supabase.com/dashboard/project/fckszlhkvdnrvgsjymgs/sql/new',
        '2. Copy the SQL below',
        '3. Paste and run it in the SQL Editor',
      ],
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Migration API - Use POST with {"migration": "010_fix_anomalies_schema"}',
  });
}