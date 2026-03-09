-- =====================================================
-- Supabase RLS Policies cho Frontend Access
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Enable RLS on users table (nếu chưa enable)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies nếu có (để tránh conflict)
DROP POLICY IF EXISTS "Allow anon users to read users for login" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Backend service role access" ON users;

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
DROP POLICY IF EXISTS "Allow anon users to read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow anon users to modify vehicles" ON vehicles;

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
DROP POLICY IF EXISTS "Allow anon users to read drivers" ON drivers;
DROP POLICY IF EXISTS "Allow anon users to modify drivers" ON drivers;

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
DROP POLICY IF EXISTS "Allow anon users to read operators" ON operators;
DROP POLICY IF EXISTS "Allow anon users to modify operators" ON operators;

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
DROP POLICY IF EXISTS "Allow anon users to read routes" ON routes;
DROP POLICY IF EXISTS "Allow anon users to modify routes" ON routes;

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
DROP POLICY IF EXISTS "Allow anon users to read schedules" ON schedules;
DROP POLICY IF EXISTS "Allow anon users to modify schedules" ON schedules;

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
DROP POLICY IF EXISTS "Allow anon users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow anon users to modify locations" ON locations;

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
DROP POLICY IF EXISTS "Allow anon users to read vehicle_badges" ON vehicle_badges;
DROP POLICY IF EXISTS "Allow anon users to modify vehicle_badges" ON vehicle_badges;

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
DROP POLICY IF EXISTS "Allow anon users to read dispatch_records" ON dispatch_records;
DROP POLICY IF EXISTS "Allow anon users to modify dispatch_records" ON dispatch_records;

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
