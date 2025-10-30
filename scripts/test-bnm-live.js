/**
 * Test BNM API with correct endpoint
 */

async function testBNM() {
  const url = 'https://api.bnm.gov.my/public/exchange-rate';

  console.log('Testing BNM API...');
  console.log('URL:', url);
  console.log('');

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json'
      }
    });

    console.log('Status:', response.status);
    console.log('OK:', response.ok);

    const data = await response.json();

    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));

    if (data.data && Array.isArray(data.data)) {
      console.log('\nSample data:');
      console.log(JSON.stringify(data.data[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error狼.message);
  }
}

testBNM();

