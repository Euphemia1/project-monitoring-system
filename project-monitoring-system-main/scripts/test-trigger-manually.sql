-- Test the trigger function manually with sample data

-- First, let's create a test user in a temporary table to simulate what happens
-- Note: This is just for testing, we won't actually insert into auth.users

-- Check what the trigger would do with sample metadata
SELECT 
  'test@example.com' as email,
  jsonb_build_object(
    'role', 'director',
    'full_name', 'Test User',
    'district_id', 'e1975625-3a97-4328-be73-041505616100',
    'phone', '+1234567890'
  ) as sample_metadata,
  CASE 
    WHEN 'director' ILIKE 'director' THEN 'director'::user_role
    WHEN 'director' ILIKE 'project_engineer' THEN 'project_engineer'::user_role
    WHEN 'director' ILIKE 'project_manager' THEN 'project_manager'::user_role
    ELSE 'viewer'::user_role
  END as calculated_role;

-- Test with different roles
WITH roles AS (
  SELECT 'director' as role
  UNION ALL SELECT 'project_engineer'
  UNION ALL SELECT 'project_manager'
  UNION ALL SELECT 'viewer'
  UNION ALL SELECT 'unknown_role'
)
SELECT 
  role,
  CASE 
    WHEN role ILIKE 'director' THEN 'director'::user_role
    WHEN role ILIKE 'project_engineer' THEN 'project_engineer'::user_role
    WHEN role ILIKE 'project_manager' THEN 'project_manager'::user_role
    ELSE 'viewer'::user_role
  END as calculated_role
FROM roles;