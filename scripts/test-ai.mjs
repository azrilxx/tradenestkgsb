/**
 * Test script for Vercel AI Gateway integration
 */

console.log('🧪 Testing TradeNest AI Features\n');

// Test 1: Explain Alert
console.log('Test 1: Explain Alert API');
console.log('=' .repeat(50));

try {
  const alertResponse = await fetch('http://localhost:3005/api/ai/explain-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-alert-1',
      type: 'Price Deviation',
      severity: 'high',
      companyName: '004 International (MY) Sdn Bhd',
      description: 'Product priced 45% above market average',
      shipmentDetails: {
        product: 'Fuel Oils',
        declaredPrice: '$145/barrel',
        marketAverage: '$100/barrel',
        deviation: '+45%',
      },
    }),
  });

  if (alertResponse.ok) {
    const alertData = await alertResponse.json();
    console.log('✅ Success!');
    console.log('Explanation:', alertData.explanation);
  } else {
    console.log('❌ Failed:', alertResponse.status, alertResponse.statusText);
    const error = await alertResponse.text();
    console.log('Error:', error);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n');

// Test 2: Analyze Company
console.log('Test 2: Analyze Company API');
console.log('=' .repeat(50));

try {
  const companyResponse = await fetch('http://localhost:3005/api/ai/analyze-company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '004 International (MY) Sdn Bhd',
      country: 'Malaysia',
      type: 'exporter',
      sector: 'Chemicals & Petrochemicals',
      products: ['Fuel Oils', 'Vegetable Cooking Oils'],
    }),
  });

  if (companyResponse.ok) {
    const companyData = await companyResponse.json();
    console.log('✅ Success!');
    console.log('Analysis:', companyData.analysis);
  } else {
    console.log('❌ Failed:', companyResponse.status, companyResponse.statusText);
    const error = await companyResponse.text();
    console.log('Error:', error);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n');
console.log('🎉 AI Testing Complete!');
console.log('\n📝 Next Steps:');
console.log('1. Visit http://localhost:3005/ai-assistant to try the chat interface');
console.log('2. Ask questions like "Analyze the FMM companies in our database"');
console.log('3. Test the AI-powered alert explanations');
