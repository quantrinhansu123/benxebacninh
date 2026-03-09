# 🔧 Sửa lỗi CORS - Backend API không còn được sử dụng

## ❌ Lỗi hiện tại

```
Access to XMLHttpRequest at 'https://ben-xe-backend-gctv.onrender.com/api/auth/login' 
from origin 'https://quanlybenxe-client.vercel.app' has been blocked by CORS policy
```

## ✅ Giải pháp

### 1. Clear Browser Cache

Lỗi này thường do browser cache đang giữ lại code cũ. Hãy thử:

**Chrome/Edge:**
1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"

**Hoặc:**
1. Ctrl + Shift + Delete
2. Chọn "Cached images and files"
3. Chọn "All time"
4. Click "Clear data"

### 2. Kiểm tra Service Worker

1. Mở DevTools (F12)
2. Vào tab **Application** → **Service Workers**
3. Click **Unregister** cho tất cả service workers
4. Refresh trang

### 3. Cập nhật Environment Variables

Đảm bảo file `client/.env` có Supabase mới:

```env
VITE_SUPABASE_URL=https://ofdpkojsuuydkhyoeywj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

### 4. Rebuild và Deploy

Sau khi cập nhật `.env`:

```bash
# Local
npm run build --workspace=client

# Deploy lên Vercel
# Vercel sẽ tự động rebuild khi bạn push code
```

### 5. Kiểm tra Network Tab

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Thử đăng nhập lại
4. Kiểm tra xem có request nào đến `ben-xe-backend` không
5. Nếu có, đó là do cache - hãy clear cache lại

## 📝 Lưu ý

- **Backend API đã được DEPRECATED** - tất cả services đã chuyển sang Supabase
- File `client/src/lib/api.ts` đã được vô hiệu hóa - sẽ throw error nếu có code nào cố gắng sử dụng
- Nếu vẫn còn lỗi sau khi clear cache, có thể do một component nào đó vẫn đang import và sử dụng `api` từ `lib/api.ts`

## 🔍 Debug

Nếu vẫn còn lỗi, kiểm tra:

1. **Console logs**: Xem có error nào về "DEPRECATED" không
2. **Network tab**: Xem request nào đang gọi backend API
3. **Source tab**: Tìm file nào đang gọi `/api/auth/login`
