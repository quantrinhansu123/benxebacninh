-- =====================================================
-- CREATE TABLE: vehicle_badges
-- =====================================================
-- Mục đích: Tạo bảng vehicle_badges trong Supabase đích
-- Chạy script này TRƯỚC KHI chạy test-copy-to-another-supabase.sql
-- =====================================================

-- Kiểm tra và xóa bảng nếu đã tồn tại (CẨN THẬN!)
-- DROP TABLE IF EXISTS vehicle_badges CASCADE;

-- Tạo bảng vehicle_badges
CREATE TABLE IF NOT EXISTS vehicle_badges (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Firebase ID (unique)
  firebase_id VARCHAR(100) UNIQUE,
  
  -- Core fields
  badge_number VARCHAR(50),
  plate_number VARCHAR(20) NOT NULL,
  
  -- Foreign keys (nullable - may reference legacy data)
  vehicle_id UUID,
  operator_id UUID,
  route_id UUID,
  
  -- Badge details
  badge_type VARCHAR(50),
  route_code VARCHAR(50),
  route_name VARCHAR(255),
  
  -- Validity (stored as YYYY-MM-DD strings)
  issue_date VARCHAR(10),
  expiry_date VARCHAR(10),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Denormalized fields
  operator_name VARCHAR(255),
  operator_code VARCHAR(50),
  
  -- Metadata (JSONB)
  metadata JSONB,
  
  -- Sync info
  synced_at TIMESTAMPTZ,
  source VARCHAR(50) DEFAULT 'manual',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tạo indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS badges_plate_idx ON vehicle_badges(plate_number);
CREATE INDEX IF NOT EXISTS badges_operator_idx ON vehicle_badges(operator_id);
CREATE INDEX IF NOT EXISTS badges_route_code_idx ON vehicle_badges(route_code);
CREATE INDEX IF NOT EXISTS badges_expiry_idx ON vehicle_badges(expiry_date);
CREATE INDEX IF NOT EXISTS badges_firebase_id_idx ON vehicle_badges(firebase_id);
CREATE INDEX IF NOT EXISTS badges_status_idx ON vehicle_badges(status);

-- Tạo trigger để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_badges_updated_at
  BEFORE UPDATE ON vehicle_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Kiểm tra bảng đã được tạo thành công
SELECT 
  'Bảng vehicle_badges đã được tạo thành công!' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'vehicle_badges';

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
