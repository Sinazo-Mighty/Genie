# Database Setup Guide for Admin Dashboard

## Step-by-Step Instructions

### Step 1: Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Log in with your account: **ngobenimohau4@gmail.com**
3. Select your project: **supabase-blue-ocean**

### Step 2: Create Database Tables

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **New Query** button
3. Copy and paste the SQL from `scripts/01-create-tables.sql` (see below)
4. Click **Run** to execute the script

### Step 3: Enable Row Level Security

1. Still in the SQL Editor, click **New Query** again
2. Copy and paste the SQL from `scripts/02-enable-rls.sql` (see below)
3. Click **Run** to execute the script

### Step 4: Set Up Automatic User Sync

1. Click **New Query** again
2. Copy and paste the SQL from `scripts/03-create-user-sync-trigger.sql`
3. Click **Run** to execute the script

This creates a trigger that automatically adds new users to the profiles table when they sign up.

### Step 5: Sync Existing Users

1. Click **New Query** again
2. Copy and paste the SQL from `scripts/04-sync-existing-users.sql`
3. Click **Run** to execute the script

This imports all your existing authenticated users into the profiles table. You should see a message showing how many users were synced.

### Step 6: Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - `profiles`
   - `recipe_searches`
   - `favorites`
   - `recipe_views`

### Step 7: Test the Dashboard

1. Go back to your app
2. Perform some actions:
   - Search for recipes
   - View recipe details
   - Add recipes to favorites
3. Refresh the admin dashboard
4. You should now see data appearing!

## Troubleshooting

### If you still see zeros:

1. **Check if tables exist**: Go to Table Editor and verify all 4 tables are there
2. **Check user count**: Run this query in SQL Editor to verify users were synced:
   \`\`\`sql
   SELECT COUNT(*) FROM auth.users;
   SELECT COUNT(*) FROM public.profiles;
   \`\`\`
   Both counts should match.
3. **Check RLS policies**: Go to Authentication > Policies and verify policies exist
4. **Check browser console**: Open Developer Tools (F12) and look for any error messages
5. **Verify environment variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

### Common Issues:

- **"relation does not exist" error**: Tables weren't created - run Step 2 again
- **"permission denied" error**: RLS policies not set up - run Step 3 again
- **User count showing 1 when you have more users**: Run Step 5 again to sync existing users

## SQL Scripts

**You need to run these 4 scripts in order:**

1. **01-create-tables.sql**: Creates all 4 database tables needed for tracking
2. **02-enable-rls.sql**: Sets up security policies so users can only see their own data (except admins)
3. **03-create-user-sync-trigger.sql**: Automatically creates a profile when new users sign up (for future signups)
4. **04-sync-existing-users.sql**: One-time import of existing users into profiles table

### Script 1: Create Tables (01-create-tables.sql)

\`\`\`sql
-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipe_searches table to track search activity
CREATE TABLE IF NOT EXISTS public.recipe_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorites table to track favorited recipes
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Create recipe_views table to track recipe page views
CREATE TABLE IF NOT EXISTS public.recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipe_id TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipe_searches_user_id ON public.recipe_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_searches_searched_at ON public.recipe_searches(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON public.favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_id ON public.recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_id ON public.recipe_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_viewed_at ON public.recipe_views(viewed_at DESC);
\`\`\`

### Script 2: Enable RLS (02-enable-rls.sql)

\`\`\`sql
-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recipe searches policies (allow anyone to insert, users can view their own)
CREATE POLICY "Anyone can insert searches"
  ON public.recipe_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own searches"
  ON public.recipe_searches FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe views policies (allow anyone to insert, users can view their own)
CREATE POLICY "Anyone can insert views"
  ON public.recipe_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own views"
  ON public.recipe_views FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin policies (allow admin to view all data)
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'ngobenimohau4@gmail.com'
    )
  );

CREATE POLICY "Admin can view all searches"
  ON public.recipe_searches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'ngobenimohau4@gmail.com'
    )
  );

CREATE POLICY "Admin can view all favorites"
  ON public.favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'ngobenimohau4@gmail.com'
    )
  );

CREATE POLICY "Admin can view all views"
  ON public.recipe_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'ngobenimohau4@gmail.com'
    )
  );

\`\`\`

### Script 3: Create User Sync Trigger (03-create-user-sync-trigger.sql)

\`\`\`sql
-- Create a trigger function to insert new users into profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function after a new user is inserted
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
\`\`\`

### Script 4: Sync Existing Users (04-sync-existing-users.sql)

\`\`\`sql
-- Insert existing users into profiles table
INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Output the number of users synced
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM public.profiles;
