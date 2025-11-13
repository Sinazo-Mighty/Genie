# Email Verification Setup Guide for Supabase

## Problem
Users are not receiving verification emails after signing up.

## Possible Causes and Solutions

### 1. Email Confirmation is Disabled in Supabase

**To Enable Email Confirmation:**

1. Go to your Supabase Dashboard: https://supabase.com
2. Select your project "supabase-blue-ocean"
3. Navigate to **Authentication** > **Providers** in the left sidebar
4. Click on **Email** provider
5. Find the **"Confirm email"** toggle and make sure it's **ENABLED**
6. Save changes

### 2. SMTP Email Service Not Configured

Supabase needs an email service to send verification emails. By default, it uses a limited built-in service.

**Option A: Use Supabase's Built-in Email Service (Limited)**
- Supabase provides basic email sending for development
- Limited to 3 emails per hour per project
- May be blocked by spam filters

**Option B: Configure Custom SMTP (Recommended for Production)**

1. Go to **Project Settings** > **Auth** in your Supabase dashboard
2. Scroll to **SMTP Settings**
3. Enable **"Enable Custom SMTP"**
4. Configure with one of these providers:

#### Using Gmail:
\`\`\`
Host: smtp.gmail.com
Port: 587
Username: your-gmail@gmail.com
Password: (Use App Password, not your regular password)
Sender email: your-gmail@gmail.com
Sender name: Genie Recipe App
\`\`\`

**To create Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled
3. Search for "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password and use it in Supabase SMTP settings

#### Using SendGrid (Free tier available):
\`\`\`
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: (Your SendGrid API key)
Sender email: verified-email@yourdomain.com
Sender name: Genie Recipe App
\`\`\`

#### Using Resend (Modern, developer-friendly):
\`\`\`
Host: smtp.resend.com
Port: 587
Username: resend
Password: (Your Resend API key)
Sender email: verified-email@yourdomain.com
Sender name: Genie Recipe App
\`\`\`

### 3. Email Templates Configuration

Make sure your email templates are properly configured:

1. Go to **Authentication** > **Email Templates** in Supabase
2. Review the **"Confirm signup"** template
3. Ensure the template contains the confirmation link: `{{ .ConfirmationURL }}`

Default template should look like:
\`\`\`html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
\`\`\`

### 4. Check Redirect URL Configuration

The app is configured to use these redirect URLs for email confirmation:

- Development: `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` environment variable
- Production: `https://your-app-domain.com/auth/callback`

**Configure in Supabase:**

1. Go to **Authentication** > **URL Configuration**
2. Add your redirect URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-production-domain.com/auth/callback` (for production)

### 5. Testing Email Delivery

After configuration:

1. Sign up with a test email address
2. Check browser console (F12) for logs starting with `[v0]` - they will show:
   - Signup attempt details
   - Whether email confirmation is required
   - Any errors that occurred
3. Check spam/junk folder for the verification email
4. Check Supabase Dashboard > **Authentication** > **Logs** for email sending status

### 6. Development Testing Without Email

If you want to test without setting up email:

1. Temporarily disable email confirmation in Supabase
2. Users will be automatically confirmed after signup
3. Re-enable email confirmation before going to production

## Troubleshooting

**No email received:**
- Check Supabase Auth Logs for email sending errors
- Verify SMTP credentials are correct
- Check spam folder
- Try a different email address

**"Email not confirmed" error:**
- Email confirmation is enabled but email wasn't sent
- Manually confirm user in Supabase Dashboard > Authentication > Users

**Confirmation link doesn't work:**
- Check redirect URLs are properly configured
- Verify the `/auth/callback` route exists in your app

## Current App Configuration

Your app currently:
- Uses Supabase email/password authentication
- Has email verification screen implemented
- Has auth callback handler at `/auth/callback`
- Includes resend verification button
- Shows detailed console logs for debugging

## Next Steps

1. Enable email confirmation in Supabase Auth settings
2. Configure SMTP (Gmail recommended for quick setup)
3. Add redirect URLs to Supabase URL configuration
4. Test signup with a real email address
5. Check console logs and Supabase Auth logs for any errors
</parameter>
