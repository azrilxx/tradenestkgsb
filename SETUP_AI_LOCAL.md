# 🤖 Setup TradeNest AI Locally - Quick Guide

## What You Need

1. ✅ **Supabase Connection** - Already working (from CURRENT_STATUS.md)
2. ⏳ **OpenRouter API Key** - Need to get this
3. ⏳ **Environment File** - Need to create .env.local

---

## Step 1: Get OpenRouter API Key (2 minutes)

### Option A: Use Existing Key (If you have one)
- You probably already have an OpenRouter account
- Check your email for "OpenRouter" login

### Option B: Create New Account (Free credits)
1. Visit: https://openrouter.ai/
2. Click "Sign In" → "Create Account"
3. Verify your email
4. Go to: https://openrouter.ai/keys
5. Click "Create Key"
6. Copy the key (starts with `sk-or-v1-`)

**Free Credits**: You get ~$5 free to test with!

---

## Step 2: Create .env.local File

I've created a template file for you: `.env.local.template`

### Quick Setup:

```bash
# Copy the template
cp .env.local.template .env.local

# Or on Windows PowerShell:
Copy-Item .env.local.template .env.local
```

### Then Edit .env.local:

```bash
# Open the file in your editor
code .env.local
# or
notepad .env.local
```

### Fill in these values:

```env
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=https://fckszlhkvdnrvgsjymgs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE

# OpenRouter (get from step 1)
OPENAI_API_KEY=sk-or-v1-YOUR_KEY_HERE

# AI Model (Llama 3 70B - already set as default)
AI_MODEL=meta-llama/llama-3-70b-instruct

# Base URL (for local dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3007
```

---

## Step 3: Get Your Actual Supabase Anon Key

Based on CURRENT_STATUS.md, you might need to verify your anon key is correct:

1. Go to: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/settings/api
2. Copy the **anon/public** key
3. Replace `YOUR_ACTUAL_ANON_KEY_HERE` in .env.local

---

## Step 4: Start the Dev Server

```bash
npm run dev
```

Should start on http://localhost:3007

---

## Step 5: Test AI Assistant

### Visit AI Assistant:
http://localhost:3007/ai-assistant

### Try These Test Queries:

1. **Simple test:**
   ```
   What is trade-based money laundering?
   ```

2. **Analyze data:**
   ```
   Analyze the FMM companies in our database
   ```

3. **Get explanations:**
   ```
   What are red flags for TBML?
   ```

4. **Malaysian context:**
   ```
   Which Malaysian companies should we prioritize?
   ```

### Expected Response:
- ✅ Streams response in real-time
- ✅ Gives detailed, relevant answers
- ✅ References trade compliance
- ✅ Fast response (Llama 3 is fast!)

---

## Troubleshooting

### Issue: "Invalid API key"
**Solution**: Check your OpenRouter key is correct in .env.local

### Issue: "Failed to process query"
**Solution**: Check browser console and server logs for errors

### Issue: No response
**Solution**: 
1. Verify OpenRouter key is valid
2. Check you have credits: https://openrouter.ai/credits
3. Check server terminal for error messages

### Issue: Dev server won't start
**Solution**:
```bash
# Make sure .env.local exists
ls .env.local

# Check file has actual values (not template placeholders)
cat .env.local

# Restart dev server
npm run dev
```

---

## Quick Test Script

I've created `scripts/test-ai.js` for you:

```bash
node scripts/test-ai.js
```

This will:
- ✅ Test Supabase connection
- ✅ Test OpenRouter connection
- ✅ Send a test query to Llama 3
- ✅ Display the response

---

## What to Expect

### Success Indicators:
- ✅ AI responses are coherent and relevant
- ✅ Streaming works (words appear gradually)
- ✅ Responses are detailed (not one-word answers)
- ✅ References TBML, compliance, Malaysian trade

### Cost:
- Llama 3 70B: $0.59 per 1M tokens
- Typical query: ~500-1000 tokens = $0.0003 per query
- With $5 free credits: ~16,000 queries!

---

## Next Steps After Setup

Once AI is working:

1. ✅ **Test different features:**
   - Dashboard alerts with AI explanations
   - Company risk analysis
   - Trade intelligence queries

2. ✅ **Try different models:**
   Edit `.env.local` and change:
   ```env
   AI_MODEL=mistralai/mistral-large  # Premium quality
   AI_MODEL=openai/gpt-4-turbo      # Original
   ```
   Restart dev server to apply changes.

3. ✅ **Add knowledge base** (advanced):
   See `docs/guides/AI-KNOWLEDGE-BASE.md` for adding deep domain knowledge

---

## Need Help?

- Open an issue describing the problem
- Check logs in terminal and browser console
- Verify all environment variables are set correctly

---

**TradeNest AI with Llama 3 is now ready for testing! 🦙**

