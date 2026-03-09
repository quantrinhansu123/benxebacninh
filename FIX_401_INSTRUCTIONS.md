# Hướng Dẫn Sửa Lỗi 401 Unauthorized

## Lỗi
```
GET https://gsjhsmxyxjyiqovauyrp.supabase.co/rest/v1/users?... 401 (Unauthorized)
```

## Nguyên nhân
Row Level Security (RLS) đang chặn truy cập vào bảng `users` từ frontend.

## Cách sửa (3 bước)

### Bước 1: Mở Supabase Dashboard
1. Vào https://app.supabase.com
2. Chọn project của bạn (gsjhsmxyxjyiqovauyrp)
3. Vào **SQL Editor** (menu bên trái)

### Bước 2: Chạy Script SQL
Copy và paste script sau vào SQL Editor, sau đó nhấn **RUN**:

```sql
-- Tắt RLS cho users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- GRANT permissions cho anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Kiểm tra kết quả
SELECT 
    '✅ RLS Status:' as info,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✅' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
```

### Bước 3: Refresh và Test
1. Refresh trang web (F5)
2. Thử đăng nhập lại
3. Lỗi 401 sẽ biến mất

## Nếu vẫn lỗi 401

### Kiểm tra 1: RLS có tắt không?
Chạy query này trong SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
```
**Kết quả mong đợi:** `rowsecurity = false`

### Kiểm tra 2: Permissions có đúng không?
Chạy query này:
```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee = 'anon';
```
**Kết quả mong đợi:** Phải có `SELECT` privilege

### Kiểm tra 3: Anon Key có đúng không?
1. Vào Supabase Dashboard → **Settings** → **API**
2. Copy **anon/public key**
3. So sánh với key trong code (fallback key: `sb_publishable_vXBSa3eP8cvjIK2qLWI6Ug_FoYm4CNy`)
4. Nếu khác, cập nhật trong `client/.env`:
   ```
   VITE_SUPABASE_URL=https://gsjhsmxyxjyiqovauyrp.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-actual-anon-key>
   ```

## Script cho tất cả các bảng

Nếu muốn tắt RLS cho tất cả các bảng (để test nhanh):

```sql
-- Tắt RLS cho tất cả tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_records DISABLE ROW LEVEL SECURITY;

-- GRANT permissions cho tất cả tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
```

## Lưu ý bảo mật

⚠️ **Tắt RLS chỉ dùng cho development/testing!**

Cho production, bạn nên:
1. Bật lại RLS: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
2. Tạo policies phù hợp
3. Chỉ GRANT quyền cần thiết (ví dụ: chỉ SELECT, không INSERT/UPDATE/DELETE)
