# 📝 Hướng Dẫn Từng Bước: Sửa Task "gọi webhook" trong AppSheet

## ❌ Lỗi Hiện Tại

Bạn đang đặt **API key** vào field "Webhook" (URL field), nhưng field này cần **URL Supabase endpoint**.

## ✅ Giải Pháp: Sửa Task "gọi webhook"

### Bước 1: Mở Task "gọi webhook"

1. Vào **AppSheet Editor**
2. Tìm **Task "gọi webhook"** (có thể ở Data → Webhooks hoặc Actions → Tasks)
3. Click để edit

### Bước 2: Sửa Field "Webhook" (URL)

**Hiện tại (SAI):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

**Sửa thành (ĐÚNG):**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

**Hoặc nếu bạn muốn dùng cho table khác:**
- Vehicles: `https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicles`
- Routes: `https://xweufelzukfucqqtknzs.supabase.co/rest/v1/routes`
- Operators: `https://xweufelzukfucqqtknzs.supabase.co/rest/v1/operators`

### Bước 3: Thêm Headers (Nếu AppSheet Hỗ Trợ)

Nếu Task "gọi webhook" có phần **"Headers"** hoặc **"Custom Headers"**, thêm:

**Header 1:**
- Key: `apikey`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

**Header 2:**
- Key: `Authorization`
- Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`
- ⚠️ **Lưu ý:** Phải có prefix "Bearer " (có dấu cách sau Bearer)

**Header 3:**
- Key: `Content-Type`
- Value: `application/json`

### Bước 4: Nếu KHÔNG Có Field Headers

Nếu Task "gọi webhook" **KHÔNG có** field Headers, bạn **PHẢI** dùng **Action với HTTP Request** thay vì Webhook task.

**Cách làm:**

1. **Tạo Action mới:**
   - Vào **AppSheet Editor → Actions**
   - Click **"+"** để tạo Action mới
   - Đặt tên: "Sync to Supabase" hoặc "Gọi Supabase API"

2. **Chọn "HTTP Request":**
   - Trong Action settings, chọn type: **"HTTP Request"**

3. **Cấu hình HTTP Request:**

   **a) Field "URL" hoặc "Webhook URL":**
   ```
   https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
   ```
   ⚠️ **KHÔNG đặt API key vào đây!**

   **b) Field "Method":**
   ```
   POST
   ```

   **c) Field "Headers" (nếu có):**
   Thêm 3 headers như Bước 3

   **d) Field "Body" (JSON):**
   ```json
   {
     "firebase_id": "[id]",
     "badge_number": "[SoPhuHieu]",
     "plate_number": "[BienSo]",
     "badge_type": "[LoaiPH]",
     "status": "[TrangThai]",
     "source": "appsheet"
   }
   ```
   Thay `[id]`, `[SoPhuHieu]`, etc. bằng tên cột thực tế trong AppSheet của bạn.

4. **Lưu Action**

5. **Gọi Action này** thay vì Task "gọi webhook"

## 📋 Tóm Tắt

| Field | Giá Trị Đúng | Giá Trị Sai |
|-------|-------------|-------------|
| **Webhook URL** | `https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (API key) |
| **Headers → apikey** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | (Không đặt vào URL) |
| **Headers → Authorization** | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | (Không đặt vào URL) |

## ✅ Checklist

- [ ] Đã xóa API key khỏi field "Webhook" (URL)
- [ ] Đã đặt URL Supabase endpoint vào field "Webhook"
- [ ] Đã thêm headers `apikey` và `Authorization` (nếu có field Headers)
- [ ] Hoặc đã tạo Action với HTTP Request nếu không có Headers
- [ ] Đã test và không còn lỗi expression

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra lại field "Webhook":** Phải là URL, không phải API key
2. **Xóa hết expression:** Nếu field có expression, xóa và nhập URL trực tiếp
3. **Dùng Action thay vì Webhook:** Nếu AppSheet không hỗ trợ headers trong Webhook task
