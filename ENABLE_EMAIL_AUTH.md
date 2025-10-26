# Enable Email Authentication in Supabase

## Current Issue
```
Email logins are disabled
```

This means the email/password authentication provider is not enabled in Supabase.

## Quick Fix (2 minutes)

### Step 1: Go to Auth Providers
Visit: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/auth/providers

### Step 2: Enable Email Provider
1. Find the **Email** provider in the list
2. Click to expand it
3. Toggle **"Enable Email provider"** to **ON**
4. Make sure these are set:
   - ✅ Enable Email provider: **ON**
   - ⚠️ Confirm email: **OFF** (for easier testing)
   - ⚠️ Secure email change: Can leave default
5. Click **"Save"**

### Step 3: Verify Settings
After enabling, these should be your settings:
- ✅ Email provider: **Enabled**
- ⚠️ Confirm email: **Disabled** (for development)
- ✅ User can sign up: **Yes**

---

## Alternative: Quick Manual Steps

If the above link doesn't work:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select project: **fckszlhkvdnrvgsjymgs**
3. Click **Authentication** (🔐) in the left sidebar
4. Click **Providers** tab
5. Find **Email** in the list
6. Toggle it **ON**
7. Click **Save**

---

## After Enabling

Test the login again:

```bash
node test-supabase.js
```

You should see:
```
✅ Demo user login successful!
   User ID: 1bbef803-5738-49ba-a60e-b3589c0f6cd8
   Email: test@tradenest.com
```

Then test in browser:
- Open: http://localhost:3007/login
- Email: `test@tradenest.com`
- Password: `password123`
- Should work! ✅

---

## Why This Happens

Supabase has multiple authentication providers (Email, Google, GitHub, etc.).
By default, some might be disabled. We need to enable Email/Password authentication
to allow users to sign in with email and password.

---

## For Production

Keep these settings for production:
- ✅ Email provider: **Enabled**
- ✅ Confirm email: **Enabled** (for security)
- ✅ Rate limiting: **Enabled**

For development:
- ✅ Email provider: **Enabled**
- ⚠️ Confirm email: **Disabled** (easier testing)
