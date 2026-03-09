-- =====================================================
-- FIX 401 ERROR - CHẠY SCRIPT NÀY TRONG SUPABASE SQL EDITOR
-- =====================================================

-- Bước 1: Tắt RLS cho users table (đơn giản nhất)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Bước 2: GRANT permissions cho anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Bước 3: Kiểm tra (sẽ hiển thị rowsecurity = false nếu thành công)
SELECT 
    'RLS Status:' as info,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Bước 4: Kiểm tra permissions
SELECT 
    'Permissions:' as info,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

SELECT '✅ Script đã chạy xong! Refresh trang web và thử đăng nhập lại.' as message;
