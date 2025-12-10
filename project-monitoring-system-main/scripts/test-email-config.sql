-- Test email configuration and recent signup issues

-- Check recent auth users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  is_confirmed
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check if email confirmation is enabled
SELECT 
  key,
  value 
FROM auth.config 
WHERE key = 'enable_confirmations';

-- Check recent audit log entries for signup errors
SELECT 
  id,
  event,
  created_at,
  payload::json->>'error' as error_message,
  payload::json->>'user_id' as user_id
FROM auth.audit_log_entries 
WHERE event IN ('signup', 'user_added')
ORDER BY created_at DESC
LIMIT 10;

-- Check if SMTP is properly configured
SELECT 
  key,
  value 
FROM auth.config 
WHERE key LIKE '%smtp%';