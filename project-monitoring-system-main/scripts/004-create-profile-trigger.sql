-- More robust trigger to create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
  full_name_value TEXT;
  district_id_value UUID;
  phone_value TEXT;
BEGIN
  -- Add a small delay to ensure auth user is fully created
  PERFORM pg_sleep(0.1);
  
  -- Extract and validate full name
  full_name_value := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1), 'User');
  
  -- Determine the role with more robust logic
  CASE 
    WHEN NEW.raw_user_meta_data->>'role' ILIKE 'director' THEN
      user_role_value := 'director'::user_role;
    WHEN NEW.raw_user_meta_data->>'role' ILIKE 'project_engineer' THEN
      user_role_value := 'project_engineer'::user_role;
    WHEN NEW.raw_user_meta_data->>'role' ILIKE 'project_manager' THEN
      user_role_value := 'project_manager'::user_role;
    ELSE
      user_role_value := 'viewer'::user_role;
  END CASE;
  
  -- Safely extract district_id
  BEGIN
    district_id_value := NULLIF(NEW.raw_user_meta_data->>'district_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    district_id_value := NULL;
  END;
  
  -- Extract phone
  phone_value := NEW.raw_user_meta_data->>'phone';
  
  -- Log for debugging (remove in production)
  RAISE NOTICE 'Creating profile for user % with role %, district_id %, phone %', 
    NEW.email, user_role_value, district_id_value, phone_value;
  
  -- Try to insert with all fields first
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, district_id, phone)
    VALUES (
      NEW.id,
      NEW.email,
      full_name_value,
      user_role_value,
      district_id_value,
      phone_value
    );
    RAISE NOTICE 'Successfully created full profile for user %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try with fewer fields
    RAISE NOTICE 'Failed to create full profile for user %. Error: %', NEW.email, SQLERRM;
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role, district_id)
      VALUES (
        NEW.id,
        NEW.email,
        full_name_value,
        user_role_value,
        district_id_value
      );
      RAISE NOTICE 'Successfully created profile without phone for user %', NEW.email;
    EXCEPTION WHEN OTHERS THEN
      -- If that fails too, try with minimal fields
      RAISE NOTICE 'Failed to create profile without phone for user %. Error: %', NEW.email, SQLERRM;
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          full_name_value,
          user_role_value
        );
        RAISE NOTICE 'Successfully created minimal profile for user %', NEW.email;
      EXCEPTION WHEN OTHERS THEN
        -- Final fallback
        RAISE NOTICE 'Failed to create minimal profile for user %. Final error: %', NEW.email, SQLERRM;
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          'User',
          'viewer'::user_role
        );
        RAISE NOTICE 'Created fallback viewer profile for user %', NEW.email;
      END;
    END;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();