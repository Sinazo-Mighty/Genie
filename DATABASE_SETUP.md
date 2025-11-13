# Database Setup Instructions

The database tables haven't been created yet. Follow these steps to set up your Supabase database:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

## Step 2: Run the Initialization Script

1. Click **New Query** button
2. Copy the entire contents of `scripts/init_database.sql`
3. Paste it into the SQL Editor
4. Click **Run** button (or press Ctrl/Cmd + Enter)

## Step 3: Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - `profiles` - User profile information
   - `favorites` - User's favorite recipes
   - `scanned_ingredients` - History of scanned ingredients
   - `user_preferences` - User dietary preferences and settings

## Step 4: Test the Connection

Once the tables are created, the app will automatically connect to the database and:
- Store user favorites in the database instead of local storage
- Save scanned ingredient history
- Enable user authentication and profiles

## What the Database Includes

### Tables Created:
- **profiles**: User information (auto-created when users sign up)
- **favorites**: Saved recipes with recipe details
- **scanned_ingredients**: History of AI-scanned ingredients with images
- **user_preferences**: Dietary restrictions, favorite cuisines, skill level

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic profile creation on user signup

### Performance:
- Indexes on frequently queried columns
- Optimized for fast lookups and inserts

## Troubleshooting

If you encounter errors:
1. Make sure you're running the script in your Supabase project (not locally)
2. Check that you have the correct permissions
3. If tables already exist, the script will skip creating them
4. Contact support if you need help: [Supabase Support](https://supabase.com/support)
