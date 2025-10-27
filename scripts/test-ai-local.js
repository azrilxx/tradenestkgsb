/**
 * Test Script for TradeNest AI Setup
 * 
 * This script tests:
 * 1. Environment variables are configured
 * 2. OpenRouter connection works
 * 3. Llama 3 model responds correctly
 */

import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const testQuery = "What is trade-based money laundering?";

console.log('🤖 TradeNest AI Setup Test\n');
console.log('='.repeat(50));

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Environment Variables...\n');

const envChecks = {
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'AI_MODEL': process.env.AI_MODEL || 'meta-llama/llama-3-70b-instruct (default)',
};

let envOk = true;
for (const [key, value] of Object.entries(envChecks)) {
  if (!value || value.includes('YOUR_') || value.includes('HERE')) {
    console.log(`❌ ${key}: NOT SET or placeholder value`);
    envOk = false;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key}: ${preview}`);
  }
}

if (!envOk) {
  console.log('\n⚠️  Please create .env.local and set the required values.');
  console.log('📄 Template created: SETUP_AI_LOCAL.md');
  process.exit(1);
}

// Step 2: Test OpenRouter API
console.log('\n🔌 Step 2: Testing OpenRouter Connection...\n');

async function testOpenRouter() {
  try {
    const openrouterKey = process.env.OPENAI_API_KEY;

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API returned ${response.status}`);
    }

    const models = await response.json();
    console.log('✅ OpenRouter connection successful!');
    console.log(`   Available models: ${models.data?.length || 'unknown'}`);

    return true;
  } catch (error) {
    console.log('❌ OpenRouter connection failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Step 3: Test Llama 3 query
console.log('\n🧪 Step 3: Testing Llama 3 Query...\n');

async function testLlama3() {
  try {
    console.log(`📤 Sending test query: "${testQuery}"`);

    const openrouterKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || 'meta-llama/llama-3-70b-instruct';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3007',
        'X-Title': 'TradeNest AI Test',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are TradeNest AI Assistant, a trade compliance expert specializing in Malaysian trade and money laundering detection.',
          },
          {
            role: 'user',
            content: testQuery,
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response from model');
    }

    console.log('\n✅ Llama 3 query successful!');
    console.log(`\n📝 Response preview:`);
    console.log('-'.repeat(50));
    console.log(answer.substring(0, 200) + (answer.length > 200 ? '...' : ''));
    console.log('-'.repeat(50));

    return true;
  } catch (error) {
    console.log('❌ Llama 3 query failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run all tests
(async () => {
  const routerOk = await testOpenRouter();
  const llamaOk = await testLlama3();

  console.log('\n' + '='.repeat(50));

  if (routerOk && llamaOk) {
    console.log('\n🎉 All tests passed! TradeNest AI is ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3007/ai-assistant');
    console.log('   3. Try the test queries in SETUP_AI_LOCAL.md');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('\n💡 Help:');
    console.log('   - Make sure OpenRouter API key is correct');
    console.log('   - Check you have credits: https://openrouter.ai/credits');
    console.log('   - Verify all env vars in .env.local');
  }

  console.log('\n');
})();

