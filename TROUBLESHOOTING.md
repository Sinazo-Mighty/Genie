# Troubleshooting Guide

## Issue 1: Admin Dashboard Not Showing All Users

**Problem:** The admin dashboard shows fewer users than actually registered in Supabase Authentication.

**Root Cause:** Users in `auth.users` table are not automatically synced to the `profiles` table that the dashboard queries.

**Solution:**

1. Run the SQL scripts in order:
   - `scripts/03-create-user-sync-trigger.sql` - Creates automatic sync for future users
   - `scripts/04-sync-existing-users.sql` - Imports all existing users

2. Verify the sync worked by checking the query results at the bottom of script 04

3. Refresh your admin dashboard - all 5 users should now appear

---

## Issue 2: Forgot Password Not Sending Emails

**Problem:** Users don't receive password reset emails when using the "Forgot Password" feature.

**Root Cause:** Supabase email delivery requires proper SMTP configuration in your Supabase project.

**Solution:**

### Step 1: Check Supabase Email Settings

1. Log into https://supabase.com with ngobenimohau4@gmail.com
2. Select your project "supabase-blue-ocean"
3. Go to **Settings** > **Authentication** in the left sidebar
4. Scroll to **SMTP Settings**

### Step 2: Configure Email Provider (Choose One)

**Option A: Use Supabase's Built-in Email (Development Only)**
- By default, Supabase provides limited email delivery for development
- Check **Authentication** > **Email Templates** to verify templates are enabled
- This may have daily limits and emails might go to spam

**Option B: Configure Custom SMTP (Recommended for Production)**

Set up a custom SMTP provider (Gmail, SendGrid, Mailgun, etc.):

**Using Gmail:**
1. Go to **Settings** > **Authentication** > **SMTP Settings**
2. Enable SMTP
3. Fill in:
   - Sender email: your-email@gmail.com
   - Sender name: Your App Name
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: (Use an App Password, not your regular password)

**Getting Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not enabled
3. Search for "App passwords"
4. Generate new app password for "Mail"
5. Use this 16-character password in Supabase SMTP settings

### Step 3: Test Password Reset

1. Go to your app's forgot password page
2. Enter a registered email
3. Check inbox (and spam folder)
4. If still not receiving, check Supabase **Logs** for email errors

### Step 4: Verify Email Templates

In Supabase Dashboard:
1. Go to **Authentication** > **Email Templates**
2. Check that "Reset Password" template is enabled
3. Verify the redirect URL matches your app URL

---

## Additional Checks

### Verify Environment Variables
Ensure these are set in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (for local development)

### Check Browser Console
Open browser DevTools console and look for error messages when testing password reset.

### Supabase Dashboard Logs
Check **Logs** section in Supabase dashboard for authentication errors.
