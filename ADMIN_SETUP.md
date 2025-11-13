# Admin Dashboard Setup Guide

## How to Grant Admin Access

The admin dashboard is protected and only accessible to users with admin privileges. Follow these steps to grant admin access:

### Step 1: Run the Database Scripts

1. Make sure you've run the database migration scripts in order:
   - `001_create_tables.sql`
   - `002_enable_rls.sql`
   - `003_create_profile_trigger.sql`
   - `004_create_activity_tables.sql`
   - `005_enable_activity_rls.sql`
   - `006_create_admin_system.sql`

### Step 2: Add Admin Users

To grant admin access to a user, you need to add their email to the `admin_users` table. There are two ways to do this:

#### Option A: Using the SQL Script (Recommended)

1. Open `scripts/007_add_initial_admin.sql`
2. Uncomment the line with `select public.add_admin_by_email('your-email@example.com');`
3. Replace `'your-email@example.com'` with the actual email address of the user you want to make an admin
4. Run the script in your Supabase SQL editor or through v0

Example:
\`\`\`sql
select public.add_admin_by_email('john@example.com');
\`\`\`

#### Option B: Using Supabase SQL Editor Directly

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run this command:

\`\`\`sql
select public.add_admin_by_email('your-email@example.com');
\`\`\`

Replace `'your-email@example.com'` with the email of the user you want to grant admin access.

### Step 3: Verify Admin Access

1. The user must first sign up and verify their email
2. After signing in, they should see an "Admin" link in the navigation bar
3. Clicking the Admin link will take them to the admin dashboard at `/admin`

## Adding Multiple Admins

You can add multiple admin users by running the function multiple times:

\`\`\`sql
select public.add_admin_by_email('admin1@example.com');
select public.add_admin_by_email('admin2@example.com');
select public.add_admin_by_email('admin3@example.com');
\`\`\`

## Removing Admin Access

To remove admin access from a user, run:

\`\`\`sql
delete from public.admin_users where email = 'user-email@example.com';
\`\`\`

## Security Notes

- Only users listed in the `admin_users` table can access the admin dashboard
- The admin dashboard checks authorization on every page load
- Row Level Security (RLS) is enabled to ensure only admins can view the admin_users table
- Non-admin users will see an "Access Denied" message if they try to access `/admin`

## Where to Find the Admin Link

Once you're logged in as an admin user:
1. Look at the top navigation bar
2. You'll see: Search | Camera | Favorites | **Admin** | [Your Email] | Logout
3. The Admin link appears in purple/violet color
4. Click it to access the admin dashboard

## Troubleshooting

**Q: I don't see the Admin link after adding my email**
- Make sure you've run all the database scripts
- Verify your email is correctly added to the `admin_users` table
- Try logging out and logging back in
- Check the browser console for any errors

**Q: I get "Access Denied" when clicking the Admin link**
- Verify your email is in the `admin_users` table
- Make sure you're logged in with the correct email address
- Check that RLS policies are properly set up

**Q: The dashboard shows no data**
- The dashboard tracks activity over time
- Use the app (search recipes, view recipes, add favorites) to generate data
- Activity tracking was added when you integrated the admin dashboard
