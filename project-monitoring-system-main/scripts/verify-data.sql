-- Detailed verification of data integrity

-- Check user_role enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype;

-- Check districts data
SELECT id, name, code FROM districts ORDER BY name;

-- Check the single profile that exists
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  district_id, 
  phone,
  created_at
FROM profiles;

-- Check auth user data (limited for privacy)
SELECT 
  id,
  email,
  created_at
FROM auth.users;

-- Check if the trigger function exists and is valid
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if RLS is enabled on profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';