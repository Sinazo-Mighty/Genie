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
