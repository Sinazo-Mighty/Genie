# Fix Supabase Email Verification Issue

## The Problem
Users receive verification emails but clicking the link shows "localhost not loading" or redirects to the wrong URL.

## Step-by-Step Solution

### Step 1: Configure Redirect URLs in Supabase Dashboard

1. Go to https://supabase.com and log in
2. Select your project "supabase-blue-ocean"
3. Click on **Authentication** in the left sidebar
4. Click on **URL Configuration**
5. Find the **Redirect URLs** section
6. Add the following URLs (one per line):
   \`\`\`
   http://localhost:3000/auth/callback
   https://your-deployed-app-url.vercel.app/auth/callback
   \`\`\`
   (Replace `your-deployed-app-url.vercel.app` with your actual Vercel deployment URL)

7. Click **Save**

### Step 2: Configure Site URL

In the same URL Configuration page:

1. Set **Site URL** to your production URL:
   \`\`\`
   https://your-deployed-app-url.vercel.app
   \`\`\`

### Step 3: Enable Email Confirmations

1. Still in **Authentication** settings
2. Click on **Email** in the submenu
3. Make sure **Enable email confirmations** is checked
4. Configure your email provider (see below)

### Step 4: Configure Email Provider

#### Option A: Use Supabase's Built-in Email (Easiest)
- No configuration needed
- Limited to 4 emails per hour in free tier
- Good for development/testing

#### Option B: Use Your Own SMTP (Recommended for Production)
1. In the **Email** settings, find **SMTP Settings**
2. Fill in your SMTP details:
   - **Host**: smtp.gmail.com (for Gmail)
   - **Port**: 587
   - **Username**: your-email@gmail.com
   - **Password**: Your app password (not your regular password)
   - **Sender email**: your-email@gmail.com
   - **Sender name**: Genie Recipe App

3. For Gmail App Password:
   - Go to Google Account → Security
   - Enable 2-Factor Authentication
   - Generate an App Password
   - Use that password in Supabase

### Step 5: Test Email Verification

1. Try signing up with a new email address
2. Check your inbox (and spam folder!)
3. Click the verification link
4. You should be redirected to your app and logged in

### Troubleshooting

**Issue**: Still redirecting to localhost
- **Solution**: Make sure you added both localhost and production URLs to Redirect URLs
- Clear your browser cache and cookies

**Issue**: Email not received
- **Solution**: 
  - Check spam folder
  - Verify SMTP settings if using custom email
  - Check Supabase logs: Authentication → Logs

**Issue**: "Invalid redirect URL" error
- **Solution**: The URL in the email must exactly match one of the URLs you added in Step 1

**Issue**: Email received but link doesn't work
- **Solution**: Make sure the `/auth/callback` route exists in your app (it does!)

### For Local Development

If you want to test locally:
1. Add `http://localhost:3000/auth/callback` to Redirect URLs
2. Run your app locally on port 3000
3. Sign up with a test email
4. The verification link will work on localhost

### Environment Variables (Not Required)

You can optionally set this in your Vercel project:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

These should already be configured in your Vercel project settings.

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Check Supabase Dashboard → Authentication → Logs
3. Verify your SMTP credentials are correct
