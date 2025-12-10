-- Check recent audit logs for signup activity
SELECT 
  *
FROM auth.audit_log_entries 
ORDER BY created_at DESC
LIMIT 10;
