-- Verify that all necessary database objects exist

-- Check if user_role enum exists
SELECT typname, typtype FROM pg_type WHERE typname = 'user_role';

-- Check if districts exist
SELECT COUNT(*) as district_count FROM districts;

-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if the trigger function exists
SELECT proname, provolatile 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger is active
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check existing users and profiles
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as profile_count FROM profiles;