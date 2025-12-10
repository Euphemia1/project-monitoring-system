-- Quick check of current user and profile status
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as role_in_metadata,
  p.role as role_in_profile,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Check if email confirmation is enabled
SELECT 
  key,
  value 
FROM auth.config 
WHERE key = 'enable_confirmations';