-- ========================================================
-- RESET TABLES DATA (EXCEPT PROFILES)
-- ========================================================
-- Description: This script deletes all data from all tables in the 
-- public schema while preserving the 'profiles' and 'auth.users' tables.
-- ========================================================

DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Loop through all tables in the public schema except 'profiles'
  FOR r IN (SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND table_name != 'profiles') 
  LOOP
    -- Truncate with CASCADE to handle foreign key dependencies
    -- RESTART IDENTITY resets auto-incrementing IDs back to 1
    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.table_name) || ' RESTART IDENTITY CASCADE';
  END LOOP;
END $$;
