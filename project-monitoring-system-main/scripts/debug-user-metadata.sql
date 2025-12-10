-- Debug script to check user metadata and profile creation

-- Check the raw user metadata for recent users
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check what's actually in the profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  district_id,
  phone,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- Check if the metadata contains the role field
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_from_metadata,
  raw_user_meta_data->>'full_name' as full_name_from_metadata,
  raw_user_meta_data->>'district_id' as district_id_from_metadata,
  raw_user_meta_data->>'phone' as phone_from_metadata
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Check the trigger function definition
SELECT pg_get_functiondef(p.oid) as trigger_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user' 
AND n.nspname = 'public';