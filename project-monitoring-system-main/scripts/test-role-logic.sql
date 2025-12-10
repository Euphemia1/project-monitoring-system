-- Test script to verify role assignment logic

-- Test the role extraction logic with sample data
WITH test_data AS (
  SELECT '{"role": "director"}'::jsonb as raw_user_meta_data
  UNION ALL
  SELECT '{"role": "project_engineer"}'::jsonb
  UNION ALL
  SELECT '{"role": "project_manager"}'::jsonb
  UNION ALL
  SELECT '{"role": "viewer"}'::jsonb
  UNION ALL
  SELECT '{"role": "DIRECTOR"}'::jsonb  -- Test case sensitivity
  UNION ALL
  SELECT '{"role": "unknown_role"}'::jsonb
  UNION ALL
  SELECT '{}'::jsonb  -- Test empty metadata
)
SELECT 
  raw_user_meta_data->>'role' as input_role,
  CASE 
    WHEN raw_user_meta_data->>'role' ILIKE 'director' THEN 'director'::user_role
    WHEN raw_user_meta_data->>'role' ILIKE 'project_engineer' THEN 'project_engineer'::user_role
    WHEN raw_user_meta_data->>'role' ILIKE 'project_manager' THEN 'project_manager'::user_role
    ELSE 'viewer'::user_role
  END as assigned_role
FROM test_data;

-- Test with actual user data
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_from_metadata,
  CASE 
    WHEN raw_user_meta_data->>'role' ILIKE 'director' THEN 'director'::user_role
    WHEN raw_user_meta_data->>'role' ILIKE 'project_engineer' THEN 'project_engineer'::user_role
    WHEN raw_user_meta_data->>'role' ILIKE 'project_manager' THEN 'project_manager'::user_role
    ELSE 'viewer'::user_role
  END as calculated_role
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;