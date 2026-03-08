# Logic Đăng Nhập - Hệ Thống Quản Lý Bến Xe

## Flow Đăng Nhập

### 1. Frontend gửi request
- **Endpoint**: `POST /api/auth/login`
- **Body**: 
  ```json
  {
    "usernameOrEmail": "admin@benxe.com",
    "password": "password123"
  }
  ```

### 2. Backend xử lý (auth.controller.ts)

#### Bước 1: Validate Input
- Kiểm tra `usernameOrEmail` và `password` không rỗng
- Sử dụng Zod schema validation

#### Bước 2: Normalize Email
- Chuyển email thành lowercase: `admin@benxe.com` → `admin@benxe.com`
- Trim whitespace

#### Bước 3: Query User
```sql
SELECT * FROM users 
WHERE lower(email) = 'admin@benxe.com'
LIMIT 1
```

#### Bước 4: Kiểm tra User tồn tại
- ❌ Nếu không tìm thấy → **401 "Invalid credentials"**

#### Bước 5: Kiểm tra Account Active
- ❌ Nếu `isActive = false` → **403 "Account is disabled"**

#### Bước 6: Kiểm tra Password Hash
- ❌ Nếu không có `passwordHash` → **401 "Invalid credentials"**

#### Bước 7: Verify Password
- So sánh password với `bcrypt.compare(password, user.passwordHash)`
- ❌ Nếu không match → **401 "Invalid credentials"**

#### Bước 8: Generate JWT Token
- Tạo token với:
  - `id`: user.id
  - `username`: user.email
  - `role`: user.role
  - `expiresIn`: 7 days (mặc định)

#### Bước 9: Return Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@benxe.com",
    "fullName": "Administrator",
    "role": "admin",
    "isActive": true
  }
}
```

## Debug Lỗi 401

### Các nguyên nhân có thể:

1. **User không tồn tại**
   - Kiểm tra email có đúng không
   - Email phải match case-insensitive

2. **Password sai**
   - Password phải match với hash trong database
   - Sử dụng bcrypt để so sánh

3. **Không có password hash**
   - User chưa được set password
   - Cần reset password

4. **Account bị disabled**
   - `isActive = false`
   - Sẽ trả về 403, không phải 401

### Cách kiểm tra:

#### 1. Xem log server
Server sẽ log chi tiết:
```
📥 Login request received
📝 Login attempt: admin@benxe.com
🔍 Querying users table WHERE lower(email) = 'admin@benxe.com'
✅ User found: admin@benxe.com
🔐 Comparing password with password_hash (bcrypt)...
❌ Invalid password: admin@benxe.com
```

#### 2. Test login bằng script
```bash
cd server
npm run test-login admin@benxe.com password123
```

#### 3. Reset password
```bash
cd server
npm run create-admin admin@benxe.com newpassword "Administrator"
```

#### 4. Xem danh sách users
```bash
cd server
npm run list-users
```

## Tài khoản mặc định

- `admin@benxe.com` - System Administrator (admin)
- `admin@benxe.local` - Administrator (admin)
- `admin@admin.com` - admin (admin)
- `dieudo@benxe.com` - Nguyễn Văn Điều Độ (dispatcher)
- `ketoan@benxe.com` - Trần Thị Kế Toán (accountant)
- `baocao@benxe.com` - Lê Văn Báo Cáo (reporter)

## Lưu ý

- Email matching là **case-insensitive**
- Password được hash bằng **bcrypt** với 10 salt rounds
- Token có thời hạn **7 ngày** (có thể config bằng `JWT_EXPIRES_IN`)
- Tất cả lỗi đều trả về **401 "Invalid credentials"** để bảo mật (không tiết lộ user có tồn tại hay không)
