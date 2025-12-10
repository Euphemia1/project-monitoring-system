-- Verify current state of users and profiles

-- Check all users and their metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_in_metadata,
  raw_user_meta_data->>'full_name' as full_name_in_metadata,
  created_at
FROM auth.users
ORDER BY created_at;

-- Check all profiles and their actual roles
SELECT 
  id,
  email,
  full_name,
  role as actual_role,
  district_id,
  phone,
  created_at
FROM profiles
ORDER BY created_at;

-- Check if there are any discrepancies
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as role_in_metadata,
  p.role as role_in_profile,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = p.role THEN 'MATCH'
    ELSE 'MISMATCH'
  END as role_status
FROM auth.users u
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at;