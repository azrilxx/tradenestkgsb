# Netlify Environment Variables Setup

## Issue: "Invalid API key" Error on Login

If you're seeing an "Invalid API key" error when trying to log in, it means the Supabase environment variables are not configured in Netlify.

## Required Environment Variables

You need to add the following environment variables to your Netlify deployment:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Description**: Your Supabase project URL
- **Example**: `https://fckszlhkvdnrvgsjymgs.supabase.co`
- **Where to find**: Supabase Dashboard → Project Settings → API

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Description**: Your Supabase anonymous (public) key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Project Settings → API → anon/public key

### 3. OPENAI_API_KEY
- **Description**: Your OpenRouter API key for AI features
- **Where to find**: From your OpenRouter account

### 4. NEXT_PUBLIC_BASE_URL
- **Description**: Your deployed site URL
- **Example**: `https://tradekgsb.netlify.app`

### 5. NEXT_PRIVATE_STANDALONE (Optional)
- **Description**: Enable standalone mode
- **Value**: `true`

---

## How to Add Environment Variables to Netlify

### Method 1: Netlify Dashboard (Recommended)

1. **Go to your Netlify site dashboard**
   - Visit https://app.netlify.com/
   - Select your site (tradekgsb)

2. **Navigate to Site settings**
   - Click "Site settings" in the top navigation
   - Click "Environment variables" in the left sidebar

3. **Add each variable**
   - Click "Add a variable" button
   - Choose "Add a single variable"
   - Enter the key (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the value
   - Select "Same value for all deploy contexts" (or customize if needed)
   - Click "Create variable"

4. **Repeat for all required variables**
   - Add all 5 variables listed above

5. **Trigger a redeploy**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Or simply push a new commit to GitHub

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Set environment variables
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-supabase-url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-supabase-anon-key"
netlify env:set OPENAI_API_KEY "your-openrouter-api-key"
netlify env:set NEXT_PUBLIC_BASE_URL "https://tradekgsb.netlify.app"
netlify env:set NEXT_PRIVATE_STANDALONE "true"

# Trigger redeploy
netlify deploy --prod
```

---

## Where to Get the Values

### Supabase Variables

1. Go to https://app.supabase.com/
2. Select your project
3. Click the "Settings" icon (gear) in the left sidebar
4. Click "API" under Project Settings
5. Copy the values:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign in to your account
3. Go to "Keys" section
4. Copy your API key → Use for `OPENAI_API_KEY`

---

## Verify Setup

After adding the environment variables and redeploying:

1. **Check the build logs**
   - Go to Deploys tab in Netlify
   - Click on the latest deploy
   - Check "Deploy log" for any errors

2. **Test the login page**
   - Visit your site: https://tradekgsb.netlify.app/login
   - Try logging in with: `test@tradenest.com` / `password123`
   - You should no longer see "Invalid API key" error

3. **Check browser console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any error messages

---

## Troubleshooting

### Still seeing "Invalid API key"?

1. **Verify variables are set**
   - Netlify Dashboard → Site settings → Environment variables
   - Ensure all variables are present

2. **Check for typos**
   - Variable names must be exact (case-sensitive)
   - No extra spaces in values

3. **Redeploy the site**
   - Environment changes require a new deployment
   - Netlify Dashboard → Deploys → Trigger deploy

4. **Check Supabase project**
   - Ensure your Supabase project is active
   - Verify the URL and key are correct

### Build fails after adding variables?

1. Check the build logs for specific errors
2. Ensure the values don't contain special characters that need escaping
3. Try wrapping values in quotes if they contain special characters

---

## Quick Reference

**Your Supabase Project**: https://fckszlhkvdnrvgsjymgs.supabase.co

**Demo Login Credentials**:
- Email: `test@tradenest.com`
- Password: `password123`

**Netlify Dashboard**: https://app.netlify.com/sites/tradekgsb

---

## Next Steps After Setup

1. ✅ Add all environment variables
2. ✅ Trigger a new deployment
3. ✅ Test login functionality
4. ✅ Verify all features work correctly
5. Create test user accounts if needed
6. Run database migrations if not already done

---

**Note**: Never commit `.env` or `.env.local` files to git. Environment variables should only be set in Netlify dashboard or via CLI.
