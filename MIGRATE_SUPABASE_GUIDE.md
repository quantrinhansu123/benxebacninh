# 📦 Hướng dẫn Migrate Data từ Supabase cũ sang Supabase mới

## Tổng quan

Script này sẽ migrate toàn bộ data từ Supabase project cũ (đã bị restrict) sang Supabase project mới.

## Yêu cầu

1. **Node.js** (v16+)
2. **Supabase credentials**:
   - Old Supabase project URL và API key
   - New Supabase project URL và API key
3. **Schema đã được tạo** trong Supabase mới (các bảng phải tồn tại)

## Các bước thực hiện

### Bước 1: Tạo Supabase Project mới

1. Vào https://supabase.com/dashboard
2. Click **New Project**
3. Điền thông tin:
   - Project name
   - Database password
   - Region (chọn gần nhất)
4. Chờ project được tạo (2-3 phút)

### Bước 2: Tạo Schema trong Supabase mới

Chạy các migration SQL trong Supabase Dashboard → SQL Editor:

```sql
-- Tạo tất cả các bảng cần thiết
-- Xem các file migration trong server/src/db/migrations/
```

Hoặc import schema từ project cũ:
1. Vào Supabase Dashboard (project cũ)
2. Settings → Database → Connection string
3. Export schema và chạy trong project mới

### Bước 3: Lấy API Keys

#### Old Supabase:
1. Vào Dashboard project cũ
2. Settings → API
3. Copy:
   - **Project URL** → `OLD_SUPABASE_URL`
   - **anon/public key** → `OLD_SUPABASE_KEY`

#### New Supabase:
1. Vào Dashboard project mới
2. Settings → API
3. Copy:
   - **Project URL** → `NEW_SUPABASE_URL`
   - **anon/public key** → `NEW_SUPABASE_KEY`

**Lưu ý**: Nếu project cũ đã bị restrict (402), bạn có thể cần dùng **service_role key** thay vì anon key.

### Bước 4: Cài đặt dependencies

```bash
# Cài đặt @supabase/supabase-js nếu chưa có
npm install @supabase/supabase-js
```

### Bước 5: Chạy Migration Script

#### Cách 1: Sử dụng TypeScript (khuyến nghị)

```bash
# Compile TypeScript
npx tsx scripts/migrate-supabase-data.ts

# Hoặc với environment variables
OLD_SUPABASE_URL=https://xxx.supabase.co \
OLD_SUPABASE_KEY=eyJ... \
NEW_SUPABASE_URL=https://yyy.supabase.co \
NEW_SUPABASE_KEY=eyJ... \
npx tsx scripts/migrate-supabase-data.ts
```

#### Cách 2: Sử dụng JavaScript

```bash
OLD_SUPABASE_URL=https://xxx.supabase.co \
OLD_SUPABASE_KEY=eyJ... \
NEW_SUPABASE_URL=https://yyy.supabase.co \
NEW_SUPABASE_KEY=eyJ... \
node scripts/migrate-supabase-data.js
```

#### Cách 3: Tạo file `.env.migrate`

Tạo file `scripts/.env.migrate`:

```env
OLD_SUPABASE_URL=https://xxx.supabase.co
OLD_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEW_SUPABASE_URL=https://yyy.supabase.co
NEW_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sau đó chạy:

```bash
# Load .env và chạy script
source scripts/.env.migrate
npx tsx scripts/migrate-supabase-data.ts
```

### Bước 6: Kiểm tra kết quả

Script sẽ tự động:
1. ✅ Export data từ từng bảng
2. ✅ Import data vào Supabase mới
3. ✅ Verify số lượng records
4. ✅ Hiển thị summary report

## Thứ tự Migration

Script sẽ migrate theo thứ tự sau (đảm bảo foreign keys):

1. `vehicle_types` - Loại xe
2. `shifts` - Ca làm việc
3. `services` - Dịch vụ
4. `locations` - Địa điểm
5. `operators` - Đơn vị vận tải
6. `users` - Người dùng
7. `vehicles` - Xe
8. `drivers` - Lái xe
9. `driver_operators` - Quan hệ lái xe - đơn vị
10. `routes` - Tuyến đường
11. `schedules` - Lịch trình
12. `vehicle_badges` - Phù hiệu xe
13. `vehicle_documents` - Tài liệu xe
14. `dispatch_records` - Bản ghi xuất bến
15. `invoices` - Hóa đơn
16. `violations` - Vi phạm
17. `operation_notices` - Thông báo vận hành
18. `audit_logs` - Nhật ký audit

## Xử lý lỗi

### Lỗi: "Table does not exist"
- **Nguyên nhân**: Bảng chưa được tạo trong Supabase mới
- **Giải pháp**: Tạo bảng trước khi chạy migration

### Lỗi: "Foreign key constraint"
- **Nguyên nhân**: Thứ tự migration không đúng
- **Giải pháp**: Script đã xử lý, nhưng nếu vẫn lỗi, kiểm tra lại schema

### Lỗi: "402 Payment Required"
- **Nguyên nhân**: Project cũ đã bị restrict
- **Giải pháp**: Dùng **service_role key** thay vì anon key cho project cũ

### Lỗi: "Duplicate key"
- **Nguyên nhân**: Record đã tồn tại
- **Giải pháp**: Script sử dụng `upsert`, sẽ tự động update nếu record đã có

## Lưu ý quan trọng

### ⚠️ Password Hashes
- **Password hashes** trong bảng `users` sẽ được giữ nguyên
- Users có thể đăng nhập với password cũ
- **KHÔNG** cần reset password

### ⚠️ IDs và Timestamps
- Tất cả **IDs** sẽ được giữ nguyên
- **Timestamps** (created_at, updated_at) sẽ được giữ nguyên
- Đảm bảo tính nhất quán của data

### ⚠️ Foreign Keys
- Script migrate theo thứ tự để đảm bảo foreign keys
- Nếu có lỗi, kiểm tra lại schema và relationships

### ⚠️ Large Datasets
- Script xử lý data theo batch (1000 records/batch)
- Với datasets lớn (>100k records), có thể mất 30-60 phút
- Không tắt terminal trong quá trình migration

## Sau khi Migration

### 1. Cập nhật Environment Variables

Cập nhật `client/.env`:

```env
VITE_SUPABASE_URL=https://yyy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (key mới)
```

### 2. Test Application

1. Restart dev server
2. Thử đăng nhập
3. Kiểm tra các chức năng chính:
   - Xem danh sách xe
   - Xem danh sách lái xe
   - Xem dispatch records
   - Tạo mới records

### 3. Verify Data

Script đã tự động verify, nhưng bạn có thể kiểm tra thủ công:

```sql
-- Trong Supabase Dashboard → SQL Editor
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'dispatch_records', COUNT(*) FROM dispatch_records;
```

## Troubleshooting

### Migration bị gián đoạn
- Script có thể chạy lại an toàn (sử dụng upsert)
- Chỉ cần chạy lại script, nó sẽ skip các records đã có

### Một số bảng không migrate được
- Kiểm tra xem bảng có tồn tại trong Supabase mới không
- Kiểm tra RLS policies (có thể cần tắt tạm thời)
- Kiểm tra permissions

### Performance
- Với datasets lớn, có thể chạy migration vào giờ thấp điểm
- Có thể migrate từng bảng một nếu cần

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Verify schema trong Supabase mới
3. Kiểm tra API keys và permissions
4. Xem file `MIGRATE_SUPABASE_GUIDE.md` để biết thêm chi tiết
