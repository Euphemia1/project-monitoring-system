-- Manual test of the trigger function logic
DO $$
DECLARE
  test_metadata JSONB := '{"role": "director", "full_name": "Test User", "district_id": "e1975625-3a97-4328-be73-041505616100", "phone": "+1234567890"}';
  user_role_value user_role;
  full_name_value TEXT;
  district_id_value UUID;
  phone_value TEXT;
BEGIN
  -- Extract and validate full name
  full_name_value := COALESCE(test_metadata->>'full_name', 'User');
  
  -- Determine the role with more robust logic
  CASE 2
    WHEN test_metadata->>'role' ILIKE 'director' THEN
      user_role_value := 'director'::user_role;
    WHEN test_metadata->>'role' ILIKE 'project_engineer' THEN
      user_role_value := 'project_engineer'::user_role;
    WHEN test_metadata->>'role' ILIKE 'project_manager' THEN
      user_role_value := 'project_manager'::user_role;
    ELSE
      user_role_value := 'viewer'::user_role;
  END CASE;
  
  -- Safely extract district_id
  BEGIN
    district_id_value := NULLIF(test_metadata->>'district_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    district_id_value := NULL;
  END;
  
  -- Extract phone
  phone_value := test_metadata->>'phone';
  
  -- Show what would be inserted
  RAISE NOTICE 'Would create profile with: role=%, district_id=%, phone=%', 
    user_role_value, district_id_value, phone_value;
    
  -- Test the insert (commented out to avoid actually inserting)
  -- INSERT INTO public.profiles (id, email, full_name, role, district_id, phone)
  -- VALUES ('test-id', 'test@example.com', full_name_value, user_role_value, district_id_value, phone_value);
  
END $$;