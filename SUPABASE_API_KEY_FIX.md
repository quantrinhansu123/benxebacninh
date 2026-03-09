# 🔑 Hướng dẫn sửa lỗi "Invalid API key"

## Nguyên nhân
Lỗi "Invalid API key" xảy ra khi Supabase API key không đúng hoặc đã thay đổi.

## Cách sửa

### Bước 1: Lấy API key mới từ Supabase Dashboard

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Tìm phần **Project API keys**
5. Copy **anon/public** key (không phải service_role key)

### Bước 2: Cập nhật file `.env`

Tạo hoặc cập nhật file `client/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://gsjhsmxyxjyiqovauyrp.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý:**
- Thay `your-anon-key-here` bằng anon key bạn vừa copy
- Key thường bắt đầu bằng `eyJ...` hoặc `sb_publishable_...`

### Bước 3: Cập nhật trên Vercel (nếu deploy)

1. Vào Vercel Dashboard
2. Chọn project
3. Vào **Settings** → **Environment Variables**
4. Thêm hoặc cập nhật:
   - `VITE_SUPABASE_URL` = `https://gsjhsmxyxjyiqovauyrp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (anon key từ Supabase)

### Bước 4: Restart dev server

```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại
npm run dev:client
```

## Kiểm tra

Sau khi cập nhật, mở browser console và kiểm tra:
- Không còn lỗi "Invalid API key"
- Có thể kết nối đến Supabase

## Lưu ý bảo mật

- ⚠️ **KHÔNG** commit file `.env` lên git
- ⚠️ **KHÔNG** chia sẻ service_role key
- ✅ Chỉ dùng anon/public key cho frontend
- ✅ Service_role key chỉ dùng cho backend/server-side
