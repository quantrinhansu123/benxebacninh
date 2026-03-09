# 🔐 Hướng dẫn chuyển sang Supabase Auth

## Tổng quan

Chuyển từ custom authentication (bcrypt + users table) sang **Supabase Auth** (built-in authentication).

## Lợi ích

✅ **Tự động quản lý sessions** - Không cần tự quản lý tokens  
✅ **Token refresh tự động** - Tokens được refresh tự động  
✅ **Bảo mật tốt hơn** - Supabase xử lý password hashing  
✅ **Email verification** - Hỗ trợ xác nhận email  
✅ **Password reset** - Hỗ trợ đặt lại mật khẩu  
✅ **OAuth support** - Có thể thêm Google, GitHub login sau  

## Các bước thực hiện

### Bước 1: Enable Supabase Auth

1. Vào Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Enable **Email confirmation** nếu muốn

### Bước 2: Migrate existing users

Có 2 cách:

#### Cách 1: Migrate users sang Supabase Auth (Khuyến nghị)

Chạy script migration:

```sql
-- Trong Supabase SQL Editor
-- Migrate users từ custom table sang Supabase Auth

-- 1. Tạo function để migrate users
CREATE OR REPLACE FUNCTION migrate_users_to_auth()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, password_hash, name, role, phone, is_active
    FROM users
    WHERE password_hash IS NOT NULL
  LOOP
    -- Insert into auth.users (Supabase Auth table)
    -- Note: Password hash cần được convert từ bcrypt sang format Supabase
    -- Supabase sử dụng bcrypt nhưng format có thể khác
    
    -- Tạm thời, users cần reset password
    -- Hoặc dùng Supabase Admin API để migrate
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

**Lưu ý**: Password hashes không thể migrate trực tiếp. Có 2 options:
- **Option A**: Users reset password lần đầu
- **Option B**: Dùng Supabase Admin API để migrate (phức tạp hơn)

#### Cách 2: Giữ cả 2 hệ thống (Backward compatible)

Giữ custom auth cho users cũ, dùng Supabase Auth cho users mới.

### Bước 3: Update code

#### 3.1. Backup file hiện tại

```bash
cp client/src/features/auth/api/authApi.ts client/src/features/auth/api/authApi.old.ts
```

#### 3.2. Thay thế authApi

```bash
# Copy file mới
cp client/src/features/auth/api/authApi.supabase-auth.ts client/src/features/auth/api/authApi.ts
```

Hoặc rename file:

```bash
mv client/src/features/auth/api/authApi.supabase-auth.ts client/src/features/auth/api/authApi.ts
```

### Bước 4: Update Supabase client config

File `client/src/lib/supabase.ts` đã có cấu hình đúng:

```typescript
supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // ✅ Đã có
    autoRefreshToken: true,    // ✅ Đã có
    detectSessionInUrl: true,  // ✅ Đã có
  },
})
```

### Bước 5: Test

1. **Test đăng ký mới**:
   - Tạo user mới
   - Kiểm tra email verification (nếu enabled)

2. **Test đăng nhập**:
   - Đăng nhập với user mới
   - Kiểm tra session được lưu

3. **Test logout**:
   - Logout
   - Kiểm tra session được clear

## Migration cho existing users

### Option 1: Users tự reset password (Đơn giản nhất)

1. Users vào trang login
2. Click "Quên mật khẩu"
3. Nhận email reset password
4. Đặt lại mật khẩu mới

### Option 2: Admin tạo users mới

1. Admin tạo users mới trong Supabase Dashboard
2. Gửi credentials cho users
3. Users đăng nhập và đổi password

### Option 3: Migrate bằng script (Phức tạp)

Cần dùng Supabase Admin API để migrate password hashes. Xem: https://supabase.com/docs/reference/javascript/auth-admin-api

## Cấu hình Supabase Auth

### Email Templates

1. Vào **Authentication** → **Email Templates**
2. Customize templates:
   - Confirm signup
   - Reset password
   - Magic link

### Rate Limiting

1. Vào **Authentication** → **Settings**
2. Configure rate limits để tránh abuse

### Password Requirements

1. Vào **Authentication** → **Settings**
2. Set password requirements:
   - Min length: 8
   - Require uppercase, lowercase, numbers

## So sánh

| Feature | Custom Auth (Hiện tại) | Supabase Auth (Mới) |
|---------|----------------------|---------------------|
| Password hashing | Manual (bcrypt) | Automatic |
| Session management | Manual (localStorage) | Automatic |
| Token refresh | Manual | Automatic |
| Email verification | ❌ | ✅ |
| Password reset | ❌ | ✅ |
| OAuth support | ❌ | ✅ |
| Security | Good | Better |

## Troubleshooting

### Lỗi: "User already registered"
- User đã tồn tại trong Supabase Auth
- Giải pháp: Dùng email khác hoặc reset password

### Lỗi: "Email not confirmed"
- Email verification được enable
- Giải pháp: Check email và click confirmation link

### Session không persist
- Kiểm tra `persistSession: true` trong supabase client config
- Kiểm tra browser localStorage permissions

## Rollback

Nếu cần rollback:

```bash
# Restore file cũ
cp client/src/features/auth/api/authApi.old.ts client/src/features/auth/api/authApi.ts
```

## Next Steps

Sau khi migrate thành công:

1. ✅ Test tất cả authentication flows
2. ✅ Migrate existing users (hoặc để họ reset password)
3. ✅ Enable email verification (optional)
4. ✅ Add password reset flow
5. ✅ (Optional) Add OAuth providers (Google, GitHub)

## Support

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Migration Guide: https://supabase.com/docs/guides/auth/migrations
