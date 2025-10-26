# 🚨 URGENT: API Key is Exposed in GitHub

## Immediate Action Required

Your OpenRouter API key is currently exposed in your GitHub repository history and is publicly accessible.

**Exposed Key**: `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`

---

## Step 1: REVOKE THE KEY NOW (Do This First!)

1. Go to: https://openrouter.ai/keys
2. Log in to your OpenRouter account
3. Find the key: `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`
4. Click **Delete** or **Revoke** to invalidate it immediately

**Time is critical** - Anyone with access to your GitHub repo can use this key to make API calls on your account.

---

## Step 2: Generate a New Key

1. Go to: https://openrouter.ai/keys
2. Click **Generate New Key**
3. Copy the new key
4. Save it securely (NOT in git!)

---

## Step 3: Update Your Local Environment

Create or update your `.env.local` file with the NEW key:

```bash
OPENAI_API_KEY=YOUR_NEW_KEY_HERE
NEXT_PUBLIC_BASE_URL=http://localhost:3005
```

---

## Step 4: Update Vercel Environment Variables

If you're deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update or add `OPENAI_API_KEY` with your NEW key
4. Redeploy your project

---

## Step 5: Clean Git History (Optional but Recommended)

The exposed key is still in your GitHub history. You have two options:

### Option A: Keep it in History (Simpler)
- The old key is revoked, so it's useless
- Leave it in history for now
- Not recommended for public repos

### Option B: Remove from History (Better)
Use `git filter-repo` to remove the exposed key:

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove the exposed key from all git history
git filter-repo --replace-text replacements.txt --force

# Where replacements.txt contains:
# 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==>REDACTED
```

After cleaning history, you'll need to force push:
```bash
git push origin master --force
```

⚠️ **Warning**: Force pushing rewrites history. Only do this if you understand the implications.

---

## Why This Happened

The exposed key was in documentation files that got committed and pushed to GitHub. Even though we've removed it from the current files, it remains in the git history where anyone can see it.

---

## Prevention for Future

✅ Already done:
- Enhanced `.gitignore` to prevent `.env*` files
- Removed all exposed keys from documentation
- Using placeholders in documentation

Going forward:
- ✅ Never commit API keys or secrets to git
- ✅ Always use environment variables for secrets
- ✅ Check files before committing with `git diff`
- ✅ Use tools like `git-secrets` to scan for secrets before committing

---

## Status Check

After revoking the key, verify everything works:

```bash
# 1. Check no .env files in git
git ls-files | Select-String "env"
# Should return nothing

# 2. Verify .env.local exists and has new key
cat .env.local | Select-String "OPENAI_API_KEY"
# Should show your NEW key

# 3. Test the application
npm run dev
# Visit http://localhost:3000/ai-assistant
# Should work with new key
```

---

## Summary

1. ✅ **Revoke old key** at openrouter.ai/keys
2. ✅ **Generate new key**
3. ✅ **Update .env.local** with new key
4. ✅ **Update Vercel** environment variables
5. ⏳ **Optionally** clean git history

**The exposed key is now useless since it's revoked, but your new key is secure.**

---

## Need Help?

If you have questions or need assistance:
- OpenRouter Support: https://openrouter.ai/docs
- GitHub Support: https://github.com/contact
- Supabase Support: https://supabase.com/support

**Remember**: Security is a continuous process. Always be vigilant about what goes into git history, especially for public repositories.

