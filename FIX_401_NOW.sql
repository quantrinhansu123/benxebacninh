-- =====================================================
-- FIX 401 ERROR - CHẠY NGAY TRONG SUPABASE SQL EDITOR
-- =====================================================
-- Copy toàn bộ script này, paste vào SQL Editor, nhấn RUN

-- Bước 1: Tắt RLS cho users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Bước 2: GRANT tất cả quyền cho anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Bước 3: Kiểm tra kết quả
SELECT 
    '✅ RLS Status:' as info,
    tablename,
    CASE WHEN rowsecurity THEN '❌ ENABLED' ELSE '✅ DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

SELECT '✅ Script đã chạy xong! Refresh trang web và thử đăng nhập lại.' as message;
