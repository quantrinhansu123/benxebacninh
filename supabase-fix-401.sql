-- =====================================================
-- Fix 401 Unauthorized Error - Quick Fix Script
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Grant SELECT permission to anon role on users table
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- 2. Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies on users table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 4. Create simple policy: Allow anon to SELECT users (for login)
CREATE POLICY "anon_select_users"
ON users
FOR SELECT
TO anon
USING (true);

-- 5. Create policy: Allow authenticated users to SELECT users
CREATE POLICY "authenticated_select_users"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 6. Create policy: Allow service_role full access
CREATE POLICY "service_role_all_users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Grant permissions for other tables
-- =====================================================

-- Vehicles
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicles TO authenticated;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drivers
GRANT SELECT, INSERT, UPDATE, DELETE ON drivers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON drivers TO authenticated;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Operators
GRANT SELECT, INSERT, UPDATE, DELETE ON operators TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON operators TO authenticated;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Routes
GRANT SELECT, INSERT, UPDATE, DELETE ON routes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON routes TO authenticated;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Schedules
GRANT SELECT, INSERT, UPDATE, DELETE ON schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedules TO authenticated;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Locations
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO authenticated;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Vehicle Badges
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_badges TO authenticated;
ALTER TABLE vehicle_badges ENABLE ROW LEVEL SECURITY;

-- Dispatch Records
GRANT SELECT, INSERT, UPDATE, DELETE ON dispatch_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON dispatch_records TO authenticated;
ALTER TABLE dispatch_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create simple policies for all tables (allow all for anon)
-- =====================================================

-- Vehicles policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_vehicles" ON vehicles;
    CREATE POLICY "anon_all_vehicles" ON vehicles FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Drivers policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_drivers" ON drivers;
    CREATE POLICY "anon_all_drivers" ON drivers FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Operators policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_operators" ON operators;
    CREATE POLICY "anon_all_operators" ON operators FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Routes policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_routes" ON routes;
    CREATE POLICY "anon_all_routes" ON routes FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Schedules policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_schedules" ON schedules;
    CREATE POLICY "anon_all_schedules" ON schedules FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Locations policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_locations" ON locations;
    CREATE POLICY "anon_all_locations" ON locations FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Vehicle Badges policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_vehicle_badges" ON vehicle_badges;
    CREATE POLICY "anon_all_vehicle_badges" ON vehicle_badges FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Dispatch Records policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "anon_all_dispatch_records" ON dispatch_records;
    CREATE POLICY "anon_all_dispatch_records" ON dispatch_records FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- =====================================================
-- Verify setup
-- =====================================================
SELECT 
    'Users table policies:' as info,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

SELECT 'Setup completed! If you still see 401, check:' as message
UNION ALL
SELECT '1. RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''users'';'
UNION ALL
SELECT '2. Permissions granted: SELECT * FROM information_schema.table_privileges WHERE table_name = ''users'';'
UNION ALL
SELECT '3. Policies exist: SELECT * FROM pg_policies WHERE tablename = ''users'';';
