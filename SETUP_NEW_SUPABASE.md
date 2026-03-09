# 🚀 Setup Supabase Mới - Hướng dẫn nhanh

## Bước 1: Tạo Schema trong Supabase mới

1. Vào Supabase Dashboard → Project mới
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung file `scripts/create-supabase-schema.sql`
4. Paste vào SQL Editor
5. Click **Run** hoặc nhấn `Ctrl+Enter`

Script sẽ tạo tất cả 18 bảng cần thiết.

## Bước 2: Chạy Migration Data

Sau khi schema đã được tạo, chạy migration script:

```powershell
# Set environment variables
$env:OLD_SUPABASE_URL="https://gsjhsmxyxjyiqovauyrp.supabase.co"
$env:OLD_SUPABASE_KEY="sb_publishable_vXBSa3eP8cvjIK2qLWI6Ug_FoYm4CNy"
$env:NEW_SUPABASE_URL="https://ofdpkojsuuydkhyoeywj.supabase.co"
$env:NEW_SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"

# Chạy migration
node scripts/migrate-supabase-data.js
```

## Bước 3: Cập nhật .env

Sau khi migration xong, cập nhật `client/.env`:

```env
VITE_SUPABASE_URL=https://ofdpkojsuuydkhyoeywj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

## Bước 4: Test

1. Restart dev server
2. Thử đăng nhập
3. Kiểm tra các chức năng

## Troubleshooting

### Lỗi: "Table does not exist"
- Đảm bảo đã chạy `create-supabase-schema.sql` trước
- Kiểm tra trong Supabase Dashboard → Table Editor

### Lỗi: "Permission denied"
- Script đã disable RLS và grant permissions
- Nếu vẫn lỗi, chạy lại phần GRANT trong SQL Editor
