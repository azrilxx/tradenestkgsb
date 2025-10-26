# Disable Email Confirmation in Supabase

## Issue
The demo user was created but can't login because:
```
Email not confirmed
```

## Quick Fix (2 minutes)

### Step 1: Go to Supabase Auth Settings
Visit: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/auth/users

### Step 2: Confirm the Demo User Manually
1. Find the user: `test@tradenest.com`
2. Click on the user
3. Look for "Confirm email" button or toggle
4. Click to confirm the email

**OR**

### Alternative: Disable Email Confirmation for All Users

1. Go to: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/auth/providers
2. Scroll to "Email" section
3. Toggle **"Enable email confirmations"** to **OFF**
4. Click "Save"

This will allow users to sign in immediately without email confirmation.

---

## After Disabling

Run this test again:
```bash
node test-supabase.js
```

You should see:
```
✅ Demo user login successful!
```

Then test in browser:
1. Open: http://localhost:3007/login
2. Email: `test@tradenest.com`
3. Password: `password123`
4. Click "Sign In"

Should work! ✅

---

## For Production

For production, you might want to keep email confirmation enabled for security.
For development/testing, it's fine to disable it.
