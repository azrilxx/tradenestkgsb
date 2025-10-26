# Netlify Deployment Guide

## Netlify Form Settings

Fill in the Netlify deployment form with these settings:

### ✅ **Base directory**
- **Leave empty** (or don't fill this field)

### ✅ **Build command**
- **Fill with**: `npm run build`

### ✅ **Publish directory**
- **Fill with**: `.next`

### ✅ **Functions directory**
- **Fill with**: `netlify/functions` (this will be created automatically)

---

## Environment Variables

Click **"Add environment variables"** and add these:

```
OPENAI_API_KEY=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
NEXT_PUBLIC_BASE_URL=https://YOUR-APP-NAME.netlify.app
NEXT_PUBLIC_SUPABASE_URL=https://fckszlhkvdnrvgsjymgs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZja3N6bGhrdmRucnZnc2p5bWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0ODIyMzIsImV4cCI6MjA1MDA1ODIzMn0.dK6WJYi4Vj1Y2v7v9KjJ4HJ8xQkzJZ7yJZ7yJZ7yJZ7
```

**Important**: Replace `YOUR-APP-NAME` with your actual Netlify app name once deployed.

---

## After Deployment

### 1. Get Your Netlify URL
After the first deployment, Netlify will give you a URL like:
- `https://YOUR-APP-NAME.netlify.app`

### 2. Update Environment Variables
Go back to **Site settings → Environment variables** and update:
- `NEXT_PUBLIC_BASE_URL=https://YOUR-APP-NAME.netlify.app`
- Redeploy the site

### 3. Apply Supabase Migrations
Go to https://fckszlhkvdnrvgsjymgs.supabase.co and run the 3 migrations:
- `004_gazette_tracker_schema.sql`
- `005_trade_remedy_schema.sql`
- `006_fmm_association_schema.sql`

---

## Files Added for Netlify

✅ `netlify.toml` - Netlify configuration
✅ `@netlify/plugin-nextjs` - Installed via npm
✅ `next.config.js` - Updated for Netlify

These files tell Netlify how to build your Next.js app properly.

---

## Build Time

Typical Netlify build time: 3-5 minutes

Monitor at: https://app.netlify.com/

---

## Troubleshooting

### Build fails with "Cannot find module"
- Make sure `node_modules` is committed (it shouldn't be)
- Check that `package.json` has all dependencies

### API routes return 404
- Ensure `netlify.toml` is in the root directory
- Check that `@netlify/plugin-nextjs` is installed

### Environment variables not working
- Restart the build after adding env vars
- Use the Netlify dashboard to verify they're set correctly

---

**You're all set! Click "Deploy" and Netlify will build and deploy your app.** 🚀

