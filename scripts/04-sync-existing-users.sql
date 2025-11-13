-- Sync all existing users from auth.users to profiles table
-- This is a one-time script to import users that were created before the trigger was set up

INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the sync worked
SELECT 'Total users in profiles table:' as status, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Total users in auth.users table:' as status, COUNT(*) as count FROM auth.users;
</parameter>
