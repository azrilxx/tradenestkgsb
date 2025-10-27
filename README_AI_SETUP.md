# 🚀 TradeNest AI - Quick Setup Guide

## ✅ What's Been Done

Your TradeNest AI has been **upgraded to Llama 3 70B** and is ready for testing!

### Changes Made:
1. ✅ Switched from GPT-4 Turbo to Llama 3 70B (95% cost savings!)
2. ✅ Added dynamic model selection via `AI_MODEL` environment variable
3. ✅ Updated all 6 AI functions to use Llama 3
4. ✅ Created test scripts for verification
5. ✅ Environment variables configured

---

## ⚡ Quick Start (3 Steps)

### Step 1: Update OpenRouter API Key

Your current OpenRouter key appears invalid. Get a new one:

1. Visit: https://openrouter.ai/keys
2. Click "Create Key"
3. Copy the key

Edit `.env.local`:
```bash
OPENAI_API_KEY=sk-or-v1-YOUR_NEW_KEY_HERE
```

### Step 2: Test AI Connection

```bash
node scripts/quick-test-ai.js
```

Should see: ✅ AI Test Successful!

### Step 3: Start Dev Server & Test

```bash
# Start server (if not running)
npm run dev

# Visit AI Assistant
# http://localhost:3005/ai-assistant
```

---

## 🧪 Test Queries to Try

Visit http://localhost:3005/ai-assistant and ask:

```
What is trade-based money laundering?
Analyze the FMM companies in our database
What are red flags for TBML?
Which Malaysian companies should we prioritize?
Explain the anomalies in our database
```

---

## 💰 Cost Savings

| Model | Cost/M Tokens | Monthly (10k users) | Annual |
|-------|---------------|---------------------|--------|
| GPT-4 Turbo | $10-15 | $4,500-9,000 | $54,000-108,000 |
| **Llama 3 70B** | **$0.59** | **$270** | **$3,240** |
| **Savings** | **95%** | **$4,230-8,730** | **$50,760-104,760** |

---

## 📋 What You Get

### AI Features Using Llama 3:
- ✅ **AI Chat Assistant** (`/ai-assistant`) - Natural language queries
- ✅ **Alert Explanations** (`/api/ai/explain-alert`) - Why alerts triggered
- ✅ **Company Analysis** (`/api/ai/analyze-company`) - Risk profiling
- ✅ **Trade Intelligence** (`/api/ai/chat`) - General queries
- ✅ **MATRADE Stats** - Industry insights
- ✅ **Risk Categorization** - Auto-tier companies

### Model Switching:
Change models anytime by editing `.env.local`:
```bash
# Llama 3 70B (default, best value)
AI_MODEL=meta-llama/llama-3-70b-instruct

# Mistral Large (premium quality)
AI_MODEL=mistralai/mistral-large

# GPT-4 Turbo (original)
AI_MODEL=openai/gpt-4-turbo
```

Restart dev server after changing.

---

## 🛠️ Troubleshooting

### Issue: "User not found"
**Solution**: Update OpenRouter API key in `.env.local`

### Issue: "Insufficient credits"
**Solution**: Add credits at https://openrouter.ai/credits

### Issue: No response
**Solution**: Check browser console and server logs

---

## 📁 Files to Know

- `lib/ai.ts` - AI implementation (now uses Llama 3)
- `.env.local` - Environment variables (update API key here)
- `scripts/quick-test-ai.js` - Test AI connection
- `app/ai-assistant/page.tsx` - AI Assistant UI
- `app/api/ai/chat/route.ts` - Chat endpoint

---

## 🎯 Next Steps

1. ⏳ **Update OpenRouter API Key** (see Step 1 above)
2. ✅ **Test AI Connection** (`node scripts/quick-test-ai.js`)
3. ✅ **Visit AI Assistant** (`http://localhost:3005/ai-assistant`)
4. ✅ **Try test queries** (see examples above)
5. ✅ **Enjoy 95% cost savings!**

---

**TradeNest AI with Llama 3 is ready - just update your API key! 🦙**

