-- =====================================================
-- QUICK FIX: Tắt RLS tạm thời để test (CHỈ DÙNG CHO DEVELOPMENT!)
-- =====================================================
-- ⚠️ CẢNH BÁO: Script này tắt RLS - KHÔNG AN TOÀN cho production!
-- Chỉ dùng để test và development

-- Option 1: Tắt RLS hoàn toàn (đơn giản nhất để test)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_records DISABLE ROW LEVEL SECURITY;

-- Option 2: Nếu muốn giữ RLS, chạy các dòng sau thay vì Option 1
-- GRANT USAGE ON SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
-- 
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
--
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "anon_all_users" ON users;
-- CREATE POLICY "anon_all_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

SELECT 'RLS đã được tắt. Bây giờ thử refresh trang và đăng nhập lại!' as message;
