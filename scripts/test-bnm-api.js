/**
 * Quick test to verify BNM API endpoint
 */

async function testBNMAPI() {
  const BNM_API_BASE_URL = 'https://apikijangportal.bnm.gov.my';

  console.log('Testing BNM API...\n');

  // Test 1: Standard endpoint
  console.log('Test 1: /exchange-rate endpoint');
  try {
    const response = await fetch(`${BNM_API_BASE_URL}/exchange-rate`, {
      headers: {
        'Accept': 'application/vnd.bnm.api+json'
      }
    });

    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Sample data:', JSON.stringify(data).substring(0, 200));
    } else {
      console.log('Response not ok');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: With currency code
  console.log('\nTest 2: /exchange-rate/USD endpoint');
  try {
    const response = await fetch(`${BNM_API_BASE_URL}/exchange-rate/USD`, {
      headers: {
        'Accept': 'application/vnd.bnm.api+json'
      }
    });

    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data:', JSON.stringify(data).substring(0, 300));
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testBNMAPI().catch(console.error);

