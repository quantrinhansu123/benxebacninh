-- =====================================================
-- RECREATE USERS TABLE FROM SCRATCH
-- Chạy script này trong Supabase Dashboard → SQL Editor
-- =====================================================

-- Step 1: Drop all foreign key constraints that reference users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%user%'
    AND table_schema = 'public'
  ) LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

-- Step 2: Drop users table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create users table from scratch
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  firebase_id VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(500),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  ben_phu_trach UUID REFERENCES locations(id),
  last_login_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_ben_phu_trach_idx ON users(ben_phu_trach);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);

-- Step 5: Insert sample users data
INSERT INTO users 
  (id, firebase_id, email, password_hash, name, phone, role, is_active, email_verified, last_login_at, metadata, created_at, updated_at, ben_phu_trach) 
VALUES 
  ('579832fc-3df1-4100-85b4-a4e6622635c7', null, 'upedu2024@gmail.com', '123456', 'Admin', null, 'admin', true, true, null, null, '2026-01-11 04:51:38.931069+00', '2026-03-08 23:36:32.641+00', null),
  ('6d6ad516-b740-4438-b4ad-e5f7f9461f5c', null, 'admin@benxe.local', '$2a$10$fnGQAv4DbGqhCNClvNM59e2xbKRvPN6vK5ucGhtRShNP7N27hlFA6', 'Administrator', null, 'admin', true, true, null, null, '2026-03-05 09:02:33.597121+00', '2026-03-05 09:02:33.597121+00', null),
  ('f5285c83-ca40-46c8-9ed3-1fca8632b136', null, 'benxehiephoa@gmail.com', '$2a$10$Q02gMHsB3X598KMbr.p3J.iyRUIndZSpyY8T0pdeyPRPZ.QbxNm/m', 'Bến xe Hiệp Hoà', '0965310233', 'user', true, false, null, null, '2026-03-08 23:54:16.96164+00', '2026-03-08 23:54:16.96164+00', 'ac1b1f44-53c8-4cbd-b151-290ec6132089');

-- Step 6: Re-add foreign key constraints
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_entry_by_fkey 
  FOREIGN KEY (entry_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_passenger_drop_by_fkey 
  FOREIGN KEY (passenger_drop_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_boarding_permit_by_fkey 
  FOREIGN KEY (boarding_permit_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_payment_by_fkey 
  FOREIGN KEY (payment_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_departure_order_by_fkey 
  FOREIGN KEY (departure_order_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_exit_by_fkey 
  FOREIGN KEY (exit_by) REFERENCES users(id);
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

-- Step 7: Disable RLS temporarily for migration
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Done!
SELECT '✅ Users table recreated successfully!' AS result;
SELECT COUNT(*) as total_users FROM users;
SELECT id, email, name, role, is_active FROM users;
