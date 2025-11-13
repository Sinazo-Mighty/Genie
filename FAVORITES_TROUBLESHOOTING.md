# Favorites Troubleshooting Guide

## Issue: Favorites Not Showing After Adding Them

If you're experiencing issues where favorites don't appear in the Favorites tab after liking them, follow these steps:

### Step 1: Verify Database Tables Exist

1. Log in to your Supabase dashboard at https://supabase.com
2. Go to **SQL Editor**
3. Run the following query to check if the favorites table exists:

\`\`\`sql
SELECT COUNT(*) FROM public.favorites;
\`\`\`

If you get an error saying the table doesn't exist, run the script in `scripts/01-create-tables.sql` first.

### Step 2: Check if Favorites Are Being Saved

1. After liking a recipe, go back to Supabase SQL Editor
2. Run this query to see your favorites:

\`\`\`sql
SELECT * FROM public.favorites ORDER BY created_at DESC LIMIT 10;
\`\`\`

You should see your recently favorited recipes. If not, there's an issue with saving.

### Step 3: Verify You're Logged In

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Check for any authentication errors
4. Verify you see your user ID in the logs

### Step 4: Clear Browser Cache

Sometimes cached data can cause issues:

1. Open your Favorites page
2. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to hard refresh
3. Or click the refresh button (circular arrow icon) in the Favorites header

### Step 5: Check Row Level Security (RLS)

Make sure RLS policies are properly configured:

1. Go to Supabase dashboard → **Authentication** → **Policies**
2. Check that the `favorites` table has policies for SELECT, INSERT, and DELETE
3. If not, run the script in `scripts/02-enable-rls.sql`

### Step 6: Verify Environment Variables

Ensure these environment variables are set in your project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Common Solutions

**Solution 1: Manual Refresh**
After adding a favorite, click the circular arrow refresh button in the Favorites page header.

**Solution 2: Re-sync Favorites**
1. Log out and log back in
2. Navigate to the Favorites page
3. It will reload all favorites from the database

**Solution 3: Check Browser Console**
Look for error messages in the browser console (F12) that might indicate what's failing.

### Still Not Working?

If favorites still don't show up:

1. Check if the user is properly authenticated
2. Verify the database connection is working
3. Use the Debug page at `/favorites/debug` to run diagnostics
4. Check that the `recipe_data` field in the database contains valid JSON

### Database Query to Manually Check Your Favorites

Run this in Supabase SQL Editor (replace YOUR_USER_ID with your actual user ID):

\`\`\`sql
SELECT 
  recipe_id,
  recipe_name,
  recipe_data,
  created_at
FROM public.favorites
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
\`\`\`

You can find your user ID by running:

\`\`\`sql
SELECT id, email FROM auth.users;
