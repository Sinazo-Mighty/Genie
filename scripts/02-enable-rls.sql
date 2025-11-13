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

-- Recipe searches policies (allow anyone to insert, admins to view all)
CREATE POLICY "Anyone can insert searches"
  ON public.recipe_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own searches"
  ON public.recipe_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all searches"
  ON public.recipe_searches FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'ngobenimohau4@gmail.com',
      'tmashabela100@gmail.com',
      'masekosnazo@gmail.com'
    )
  );

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

CREATE POLICY "Admins can view all favorites"
  ON public.favorites FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'ngobenimohau4@gmail.com',
      'tmashabela100@gmail.com',
      'masekosnazo@gmail.com'
    )
  );

-- Recipe views policies (allow anyone to insert, admins to view all)
CREATE POLICY "Anyone can insert views"
  ON public.recipe_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own views"
  ON public.recipe_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all views"
  ON public.recipe_views FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'ngobenimohau4@gmail.com',
      'tmashabela100@gmail.com',
      'masekosnazo@gmail.com'
    )
  );
