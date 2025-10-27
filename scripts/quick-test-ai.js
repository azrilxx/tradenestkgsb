/**
 * Quick AI Test Script
 * Tests if TradeNest AI is working with Llama 3
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openrouterKey = process.env.OPENAI_API_KEY;

console.log('🧪 Testing TradeNest AI with Llama 3...\n');

if (!openrouterKey) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API Key found');
console.log('📡 Testing OpenRouter connection...\n');

try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3005',
      'X-Title': 'TradeNest AI Test',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: [
        {
          role: 'user',
          content: 'What is trade-based money laundering? Answer in 2 sentences.',
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`❌ API Error (${response.status}):`);
    console.log(error);
    process.exit(1);
  }

  const data = await response.json();
  const answer = data.choices[0]?.message?.content;

  console.log('✅ AI Test Successful!\n');
  console.log('📝 Llama 3 Response:');
  console.log('─'.repeat(50));
  console.log(answer);
  console.log('─'.repeat(50));

  console.log('\n🎉 TradeNest AI is working correctly!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Visit: http://localhost:3005/ai-assistant');
  console.log('   2. Try asking questions about trade compliance');
  console.log('   3. Test with your actual data');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

