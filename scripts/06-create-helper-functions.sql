-- Create a helper function to count auth users (admin only)
CREATE OR REPLACE FUNCTION get_auth_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
END;
$$;

-- Grant execute permission to authenticated users (admin will check separately)
GRANT EXECUTE ON FUNCTION get_auth_user_count() TO authenticated;
