-- =====================================================
-- CREATE COMPLETE SCHEMA FOR NEW SUPABASE PROJECT
-- Chạy script này trong Supabase Dashboard → SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. VEHICLE_TYPES (Loại xe)
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SHIFTS (Ca làm việc)
-- =====================================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SERVICES (Dịch vụ)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. LOCATIONS (Địa điểm)
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  province VARCHAR(100),
  district VARCHAR(100),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. OPERATORS (Đơn vị vận tải)
-- =====================================================
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id VARCHAR(100) UNIQUE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_code VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operators_code_idx ON operators(code);
CREATE INDEX IF NOT EXISTS operators_active_idx ON operators(is_active);

-- =====================================================
-- 6. USERS (Người dùng)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  ben_phu_trach UUID REFERENCES locations(id),
  last_login_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_ben_phu_trach_idx ON users(ben_phu_trach);

-- =====================================================
-- 7. VEHICLES (Xe)
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id VARCHAR(100) UNIQUE,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  operator_id UUID REFERENCES operators(id),
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  seat_count INTEGER,
  bed_capacity INTEGER,
  brand VARCHAR(100),
  model VARCHAR(100),
  year_of_manufacture INTEGER,
  color VARCHAR(50),
  chassis_number VARCHAR(50),
  engine_number VARCHAR(50),
  image_url VARCHAR(500),
  registration_expiry VARCHAR(10),
  insurance_expiry VARCHAR(10),
  road_worthiness_expiry VARCHAR(10),
  cargo_length INTEGER,
  cargo_width INTEGER,
  cargo_height INTEGER,
  gps_provider VARCHAR(100),
  gps_username VARCHAR(100),
  gps_password VARCHAR(100),
  gps_url VARCHAR(500),
  province VARCHAR(100),
  notes VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  operational_status VARCHAR(50) DEFAULT 'active',
  operator_name VARCHAR(255),
  operator_code VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicles_plate_number_idx ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS vehicles_operator_id_idx ON vehicles(operator_id);
CREATE INDEX IF NOT EXISTS vehicles_active_idx ON vehicles(is_active);

-- =====================================================
-- 8. DRIVERS (Lái xe)
-- =====================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id VARCHAR(100) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  id_number VARCHAR(20),
  operator_id UUID REFERENCES operators(id),
  license_number VARCHAR(50),
  license_class VARCHAR(10),
  license_expiry_date VARCHAR(10),
  date_of_birth VARCHAR(10),
  address VARCHAR(500),
  province VARCHAR(100),
  district VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  operator_name VARCHAR(255),
  operator_code VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS drivers_operator_id_idx ON drivers(operator_id);
CREATE INDEX IF NOT EXISTS drivers_active_idx ON drivers(is_active);
CREATE INDEX IF NOT EXISTS drivers_name_idx ON drivers(full_name);

-- =====================================================
-- 9. DRIVER_OPERATORS (Quan hệ lái xe - đơn vị)
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, operator_id)
);

CREATE INDEX IF NOT EXISTS driver_operators_driver_id_idx ON driver_operators(driver_id);
CREATE INDEX IF NOT EXISTS driver_operators_operator_id_idx ON driver_operators(operator_id);

-- =====================================================
-- 10. ROUTES (Tuyến đường)
-- =====================================================
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  departure_location_id UUID REFERENCES locations(id),
  arrival_location_id UUID REFERENCES locations(id),
  distance_km NUMERIC(10,2),
  estimated_duration_minutes INTEGER,
  total_trips_per_month INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS routes_code_idx ON routes(code);
CREATE INDEX IF NOT EXISTS routes_active_idx ON routes(is_active);

-- =====================================================
-- 11. SCHEDULES (Lịch trình)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id),
  operator_id UUID REFERENCES operators(id),
  departure_time TIME NOT NULL,
  arrival_time TIME,
  direction VARCHAR(50),
  frequency_type VARCHAR(50),
  calendar_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedules_route_id_idx ON schedules(route_id);
CREATE INDEX IF NOT EXISTS schedules_operator_id_idx ON schedules(operator_id);

-- =====================================================
-- 12. VEHICLE_BADGES (Phù hiệu xe)
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id VARCHAR(100) UNIQUE,
  badge_number VARCHAR(50),
  plate_number VARCHAR(20) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  operator_id UUID REFERENCES operators(id),
  route_id UUID REFERENCES routes(id),
  badge_type VARCHAR(50),
  route_code VARCHAR(50),
  route_name VARCHAR(255),
  issue_date VARCHAR(10),
  expiry_date VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  operator_name VARCHAR(255),
  operator_code VARCHAR(50),
  metadata JSONB,
  synced_at TIMESTAMPTZ,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicle_badges_vehicle_id_idx ON vehicle_badges(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_badges_route_id_idx ON vehicle_badges(route_id);
CREATE INDEX IF NOT EXISTS badges_plate_idx ON vehicle_badges(plate_number);
CREATE INDEX IF NOT EXISTS badges_operator_idx ON vehicle_badges(operator_id);
CREATE INDEX IF NOT EXISTS badges_route_code_idx ON vehicle_badges(route_code);
CREATE INDEX IF NOT EXISTS badges_expiry_idx ON vehicle_badges(expiry_date);

-- =====================================================
-- 13. VEHICLE_DOCUMENTS (Tài liệu xe)
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  document_type VARCHAR(50),
  document_url TEXT,
  expiry_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicle_documents_vehicle_id_idx ON vehicle_documents(vehicle_id);

-- =====================================================
-- 14. DISPATCH_RECORDS (Bản ghi xuất bến)
-- =====================================================
CREATE TABLE IF NOT EXISTS dispatch_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  route_id UUID REFERENCES routes(id),
  operator_id UUID REFERENCES operators(id),
  user_id UUID REFERENCES users(id),
  shift_id UUID REFERENCES shifts(id),
  dispatch_date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  transport_order_code VARCHAR(100),
  departure_order_code VARCHAR(100),
  seat_count INTEGER,
  passenger_count INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dispatch_records_vehicle_id_idx ON dispatch_records(vehicle_id);
CREATE INDEX IF NOT EXISTS dispatch_records_driver_id_idx ON dispatch_records(driver_id);
CREATE INDEX IF NOT EXISTS dispatch_records_route_id_idx ON dispatch_records(route_id);
CREATE INDEX IF NOT EXISTS dispatch_records_dispatch_date_idx ON dispatch_records(dispatch_date);
CREATE INDEX IF NOT EXISTS dispatch_records_status_idx ON dispatch_records(status);

-- =====================================================
-- 15. INVOICES (Hóa đơn)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_record_id UUID REFERENCES dispatch_records(id),
  invoice_number VARCHAR(100) UNIQUE,
  amount NUMERIC(10,2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  payment_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_dispatch_record_id_idx ON invoices(dispatch_record_id);

-- =====================================================
-- 16. VIOLATIONS (Vi phạm)
-- =====================================================
CREATE TABLE IF NOT EXISTS violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  violation_type VARCHAR(100),
  violation_date DATE,
  fine_amount NUMERIC(10,2),
  status VARCHAR(50),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS violations_vehicle_id_idx ON violations(vehicle_id);
CREATE INDEX IF NOT EXISTS violations_driver_id_idx ON violations(driver_id);

-- =====================================================
-- 17. OPERATION_NOTICES (Thông báo vận hành)
-- =====================================================
CREATE TABLE IF NOT EXISTS operation_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  content TEXT,
  notice_type VARCHAR(50),
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 18. AUDIT_LOGS (Nhật ký audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  table_name VARCHAR(100),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS (After all tables created)
-- =====================================================
-- Note: Some foreign keys are already defined inline above
-- This section is for any additional constraints needed

-- =====================================================
-- DISABLE RLS TEMPORARILY FOR MIGRATION
-- =====================================================
DO $$
BEGIN
  -- Disable RLS on all tables (if they exist)
  ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS operators DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS vehicles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS drivers DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS routes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS schedules DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS vehicle_badges DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS dispatch_records DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if tables don't exist yet
    NULL;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ Schema created successfully! Ready for data migration.' AS result;
