-- =====================================================
-- Supabase RLS Policies cho Frontend Access
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Enable RLS on users table (nếu chưa enable)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies nếu có (để tránh conflict)
-- Note: Có thể có nhiều policies với cùng tên, nên cần drop tất cả
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on users table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
END $$;

-- 3. Policy: Allow anon users to SELECT users table (cần cho login)
CREATE POLICY "Allow anon users to read users for login"
ON users
FOR SELECT
TO anon
USING (true);

-- 4. Policy: Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- 5. Policy: Allow service_role full access (backend)
CREATE POLICY "Backend service role access"
ON users
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Policies cho các bảng khác (vehicles, drivers, etc.)
-- =====================================================

-- Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'vehicles'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vehicles';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read vehicles"
ON vehicles
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify vehicles"
ON vehicles
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'drivers'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON drivers';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read drivers"
ON drivers
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify drivers"
ON drivers
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Operators
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'operators'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON operators';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read operators"
ON operators
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify operators"
ON operators
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'routes'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON routes';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read routes"
ON routes
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify routes"
ON routes
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'schedules'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON schedules';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read schedules"
ON schedules
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify schedules"
ON schedules
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'locations'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON locations';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read locations"
ON locations
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify locations"
ON locations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Vehicle Badges
ALTER TABLE vehicle_badges ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'vehicle_badges'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vehicle_badges';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read vehicle_badges"
ON vehicle_badges
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify vehicle_badges"
ON vehicle_badges
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Dispatch Records
ALTER TABLE dispatch_records ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'dispatch_records'
        AND (policyname LIKE '%anon%' OR policyname LIKE '%service_role%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON dispatch_records';
    END LOOP;
END $$;

CREATE POLICY "Allow anon users to read dispatch_records"
ON dispatch_records
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to modify dispatch_records"
ON dispatch_records
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- =====================================================
-- Hoàn thành!
-- =====================================================
SELECT 'RLS policies đã được tạo thành công!' as message;
