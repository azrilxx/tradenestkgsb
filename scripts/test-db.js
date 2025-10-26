// Test database connection and tables
import { supabase } from '../lib/supabase/client.js';

async function testDatabase() {
  console.log('🔍 Testing database connection...');

  try {
    // Test if companies table exists
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (companiesError) {
      console.log('❌ Companies table does not exist:', companiesError.message);
      console.log('📝 You need to run the database migration first.');
      console.log('   Run: supabase db push');
      return;
    }

    console.log('✅ Companies table exists');

    // Test if ports table exists
    const { data: ports, error: portsError } = await supabase
      .from('ports')
      .select('count')
      .limit(1);

    if (portsError) {
      console.log('❌ Ports table does not exist:', portsError.message);
      return;
    }

    console.log('✅ Ports table exists');

    // Test if shipments table exists
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('count')
      .limit(1);

    if (shipmentsError) {
      console.log('❌ Shipments table does not exist:', shipmentsError.message);
      return;
    }

    console.log('✅ Shipments table exists');

    // Check if data exists
    const { count: companyCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { count: portCount } = await supabase
      .from('ports')
      .select('*', { count: 'exact', head: true });

    const { count: shipmentCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true });

    console.log('\n📊 Current data:');
    console.log(`   Companies: ${companyCount || 0}`);
    console.log(`   Ports: ${portCount || 0}`);
    console.log(`   Shipments: ${shipmentCount || 0}`);

    if (companyCount === 0 || portCount === 0 || shipmentCount === 0) {
      console.log('\n🌱 Database is empty. Run seeding to populate data.');
    } else {
      console.log('\n✅ Database is populated and ready!');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
