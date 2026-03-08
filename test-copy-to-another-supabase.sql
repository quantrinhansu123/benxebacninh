-- =====================================================
-- SQL Script: Copy vehicle_badges từ Supabase này sang Supabase khác
-- =====================================================
-- Mục đích: Test copy dữ liệu bảng vehicle_badges
-- Sử dụng: Chạy trong Supabase SQL Editor hoặc psql
-- =====================================================
-- 
-- ⚠️ QUAN TRỌNG: Chạy script create-vehicle-badges-table.sql TRƯỚC!
-- Nếu bảng chưa tồn tại, bạn sẽ gặp lỗi "relation does not exist"
-- =====================================================

-- =====================================================
-- OPTION 1: EXPORT DATA (Chạy trong Supabase Nguồn)
-- =====================================================
-- Bước 1: Export dữ liệu ra CSV hoặc JSON
-- =====================================================

-- Export tất cả records
SELECT 
  id,
  firebase_id,
  badge_number,
  plate_number,
  vehicle_id,
  operator_id,
  route_id,
  badge_type,
  route_code,
  route_name,
  issue_date,
  expiry_date,
  status,
  is_active,
  operator_name,
  operator_code,
  metadata,
  synced_at,
  source,
  created_at,
  updated_at
FROM vehicle_badges
ORDER BY created_at DESC;

-- Export chỉ records có firebase_id cụ thể
SELECT 
  id,
  firebase_id,
  badge_number,
  plate_number,
  vehicle_id,
  operator_id,
  route_id,
  badge_type,
  route_code,
  route_name,
  issue_date,
  expiry_date,
  status,
  is_active,
  operator_name,
  operator_code,
  metadata,
  synced_at,
  source,
  created_at,
  updated_at
FROM vehicle_badges
WHERE firebase_id = 'YOUR_FIREBASE_ID_HERE'  -- Thay bằng firebase_id cụ thể
ORDER BY created_at DESC;

-- Export chỉ records gần đây (ví dụ: 100 records mới nhất)
SELECT 
  id,
  firebase_id,
  badge_number,
  plate_number,
  vehicle_id,
  operator_id,
  route_id,
  badge_type,
  route_code,
  route_name,
  issue_date,
  expiry_date,
  status,
  is_active,
  operator_name,
  operator_code,
  metadata,
  synced_at,
  source,
  created_at,
  updated_at
FROM vehicle_badges
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- OPTION 2: INSERT VÀO SUPABASE ĐÍCH (Chạy trong Supabase Đích)
-- =====================================================
-- Bước 2: Insert dữ liệu vào Supabase đích
-- Lưu ý: Cần thay thế các giá trị bằng dữ liệu thực tế
-- =====================================================

-- Insert 1 record test
INSERT INTO vehicle_badges (
  firebase_id,
  badge_number,
  plate_number,
  vehicle_id,
  operator_id,
  route_id,
  badge_type,
  route_code,
  route_name,
  issue_date,
  expiry_date,
  status,
  is_active,
  operator_name,
  operator_code,
  metadata,
  synced_at,
  source,
  created_at,
  updated_at
) VALUES (
  'TEST-FIREBASE-ID-001',           -- firebase_id
  'PH-TEST-001',                    -- badge_number
  '99H99999',                       -- plate_number
  NULL,                             -- vehicle_id (UUID hoặc NULL)
  NULL,                             -- operator_id (UUID hoặc NULL)
  NULL,                             -- route_id (UUID hoặc NULL)
  'Test',                           -- badge_type
  'TEST-ROUTE-001',                 -- route_code
  'Test Route',                     -- route_name
  '2024-01-01',                     -- issue_date (YYYY-MM-DD)
  '2024-12-31',                     -- expiry_date (YYYY-MM-DD)
  'active',                         -- status
  true,                             -- is_active
  'Test Operator',                  -- operator_name
  'TEST-OP-001',                    -- operator_code
  '{"test": "data"}'::jsonb,        -- metadata (JSONB)
  NOW(),                            -- synced_at
  'test',                           -- source
  NOW(),                            -- created_at
  NOW()                             -- updated_at
)
ON CONFLICT (firebase_id) DO UPDATE SET
  badge_number = EXCLUDED.badge_number,
  plate_number = EXCLUDED.plate_number,
  badge_type = EXCLUDED.badge_type,
  route_code = EXCLUDED.route_code,
  route_name = EXCLUDED.route_name,
  issue_date = EXCLUDED.issue_date,
  expiry_date = EXCLUDED.expiry_date,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  operator_name = EXCLUDED.operator_name,
  operator_code = EXCLUDED.operator_code,
  metadata = EXCLUDED.metadata,
  synced_at = EXCLUDED.synced_at,
  source = EXCLUDED.source,
  updated_at = NOW();

-- =====================================================
-- OPTION 3: COPY NHIỀU RECORDS (Bulk Insert)
-- =====================================================

-- Insert nhiều records cùng lúc
INSERT INTO vehicle_badges (
  firebase_id,
  badge_number,
  plate_number,
  badge_type,
  route_code,
  route_name,
  issue_date,
  expiry_date,
  status,
  is_active,
  operator_name,
  operator_code,
  metadata,
  synced_at,
  source
) VALUES
  ('TEST-001', 'PH-001', '99H99999', 'Test', 'RT-001', 'Route 1', '2024-01-01', '2024-12-31', 'active', true, 'Operator 1', 'OP-001', '{}'::jsonb, NOW(), 'test'),
  ('TEST-002', 'PH-002', '99H88888', 'Test', 'RT-002', 'Route 2', '2024-01-01', '2024-12-31', 'active', true, 'Operator 2', 'OP-002', '{}'::jsonb, NOW(), 'test'),
  ('TEST-003', 'PH-003', '99H77777', 'Test', 'RT-003', 'Route 3', '2024-01-01', '2024-12-31', 'active', true, 'Operator 3', 'OP-003', '{}'::jsonb, NOW(), 'test')
ON CONFLICT (firebase_id) DO UPDATE SET
  badge_number = EXCLUDED.badge_number,
  plate_number = EXCLUDED.plate_number,
  badge_type = EXCLUDED.badge_type,
  route_code = EXCLUDED.route_code,
  route_name = EXCLUDED.route_name,
  issue_date = EXCLUDED.issue_date,
  expiry_date = EXCLUDED.expiry_date,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  operator_name = EXCLUDED.operator_name,
  operator_code = EXCLUDED.operator_code,
  metadata = EXCLUDED.metadata,
  synced_at = EXCLUDED.synced_at,
  source = EXCLUDED.source,
  updated_at = NOW();

-- =====================================================
-- OPTION 4: DÙNG DB_LINK (Nếu cả 2 Supabase cùng network)
-- =====================================================
-- Lưu ý: Cần cấu hình dblink extension trước
-- =====================================================

-- Bước 1: Enable extension (chạy 1 lần)
-- CREATE EXTENSION IF NOT EXISTS dblink;

-- Bước 2: Copy từ Supabase nguồn sang đích
-- INSERT INTO vehicle_badges (
--   firebase_id,
--   badge_number,
--   plate_number,
--   badge_type,
--   route_code,
--   route_name,
--   issue_date,
--   expiry_date,
--   status,
--   is_active,
--   operator_name,
--   operator_code,
--   metadata,
--   synced_at,
--   source
-- )
-- SELECT 
--   firebase_id,
--   badge_number,
--   plate_number,
--   badge_type,
--   route_code,
--   route_name,
--   issue_date,
--   expiry_date,
--   status,
--   is_active,
--   operator_name,
--   operator_code,
--   metadata,
--   synced_at,
--   source
-- FROM dblink(
--   'host=db.xxxxx.supabase.co port=5432 dbname=postgres user=postgres password=YOUR_PASSWORD',
--   'SELECT firebase_id, badge_number, plate_number, badge_type, route_code, route_name, issue_date, expiry_date, status, is_active, operator_name, operator_code, metadata, synced_at, source FROM vehicle_badges WHERE firebase_id = ''YOUR_FIREBASE_ID_HERE'''
-- ) AS t(
--   firebase_id VARCHAR(100),
--   badge_number VARCHAR(50),
--   plate_number VARCHAR(20),
--   badge_type VARCHAR(50),
--   route_code VARCHAR(50),
--   route_name VARCHAR(255),
--   issue_date VARCHAR(10),
--   expiry_date VARCHAR(10),
--   status VARCHAR(50),
--   is_active BOOLEAN,
--   operator_name VARCHAR(255),
--   operator_code VARCHAR(50),
--   metadata JSONB,
--   synced_at TIMESTAMPTZ,
--   source VARCHAR(50)
-- )
-- ON CONFLICT (firebase_id) DO UPDATE SET
--   badge_number = EXCLUDED.badge_number,
--   plate_number = EXCLUDED.plate_number,
--   badge_type = EXCLUDED.badge_type,
--   route_code = EXCLUDED.route_code,
--   route_name = EXCLUDED.route_name,
--   issue_date = EXCLUDED.issue_date,
--   expiry_date = EXCLUDED.expiry_date,
--   status = EXCLUDED.status,
--   is_active = EXCLUDED.is_active,
--   operator_name = EXCLUDED.operator_name,
--   operator_code = EXCLUDED.operator_code,
--   metadata = EXCLUDED.metadata,
--   synced_at = EXCLUDED.synced_at,
--   source = EXCLUDED.source,
--   updated_at = NOW();

-- =====================================================
-- OPTION 5: EXPORT/IMPORT QUA CSV (Khuyến nghị)
-- =====================================================
-- Bước 1: Export từ Supabase nguồn ra CSV
-- Bước 2: Import CSV vào Supabase đích
-- =====================================================

-- Export ra CSV (chạy trong Supabase nguồn)
-- COPY (
--   SELECT 
--     firebase_id,
--     badge_number,
--     plate_number,
--     badge_type,
--     route_code,
--     route_name,
--     issue_date,
--     expiry_date,
--     status,
--     is_active,
--     operator_name,
--     operator_code,
--     metadata::text,
--     synced_at,
--     source
--   FROM vehicle_badges
--   WHERE firebase_id = 'YOUR_FIREBASE_ID_HERE'  -- Hoặc bỏ WHERE để export tất cả
-- ) TO STDOUT WITH CSV HEADER;

-- Import từ CSV (chạy trong Supabase đích)
-- COPY vehicle_badges (
--   firebase_id,
--   badge_number,
--   plate_number,
--   badge_type,
--   route_code,
--   route_name,
--   issue_date,
--   expiry_date,
--   status,
--   is_active,
--   operator_name,
--   operator_code,
--   metadata,
--   synced_at,
--   source
-- )
-- FROM '/path/to/exported_data.csv' WITH CSV HEADER;

-- =====================================================
-- OPTION 6: DÙNG REST API (Qua HTTP Request)
-- =====================================================
-- Có thể dùng Postman, curl, hoặc script để gọi Supabase REST API
-- =====================================================

-- Ví dụ với curl:
-- curl -X POST 'https://YOUR_DEST_SUPABASE.supabase.co/rest/v1/vehicle_badges' \
--   -H 'apikey: YOUR_API_KEY' \
--   -H 'Authorization: Bearer YOUR_API_KEY' \
--   -H 'Content-Type: application/json' \
--   -H 'Prefer: resolution=merge-duplicates' \
--   -d '{
--     "firebase_id": "TEST-001",
--     "badge_number": "PH-001",
--     "plate_number": "99H99999",
--     "badge_type": "Test",
--     "route_code": "RT-001",
--     "route_name": "Route 1",
--     "issue_date": "2024-01-01",
--     "expiry_date": "2024-12-31",
--     "status": "active",
--     "is_active": true,
--     "operator_name": "Test Operator",
--     "operator_code": "OP-001",
--     "metadata": {},
--     "source": "test"
--   }'

-- =====================================================
-- UTILITY QUERIES (Kiểm tra dữ liệu)
-- =====================================================

-- Đếm số records
SELECT COUNT(*) as total_records FROM vehicle_badges;

-- Kiểm tra record có firebase_id cụ thể
SELECT * FROM vehicle_badges WHERE firebase_id = 'YOUR_FIREBASE_ID_HERE';

-- Xem cấu trúc bảng
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicle_badges'
ORDER BY ordinal_position;

-- Xóa record test (nếu cần)
-- DELETE FROM vehicle_badges WHERE firebase_id LIKE 'TEST-%';

-- =====================================================
-- HƯỚNG DẪN SỬ DỤNG
-- =====================================================
-- 1. Chọn OPTION phù hợp (khuyến nghị: OPTION 5 - CSV)
-- 2. Thay thế 'YOUR_FIREBASE_ID_HERE' bằng firebase_id thực tế
-- 3. Thay thế các giá trị test bằng dữ liệu thực tế
-- 4. Chạy từng bước một và kiểm tra kết quả
-- 5. Backup dữ liệu trước khi chạy script
-- =====================================================
