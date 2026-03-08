# 🔧 Sửa Lỗi: "Unexpected " (double quote)" trong AppSheet Webhook Expression

## ❌ Lỗi Hiện Tại

```
Task 'gọi webhook' field 'Webhook' expression 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
contains an invalid expression 'Unexpected " (double quote). 
Did you mean to quote (') the entire string?'
```

## ✅ Nguyên Nhân

1. **API key được đặt SAI CHỖ** - Bạn đang đặt API key vào field "Webhook" (URL field) thay vì Headers
2. **Cú pháp expression sai** - AppSheet dùng **single quotes (')** không phải double quotes (")

## 🔧 Cách Sửa

### Bước 1: Xác Định Field Đúng

**Field "Webhook" (URL) phải là URL Supabase endpoint:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

**KHÔNG phải API key!**

### Bước 2: Cấu Hình Đúng Trong AppSheet

#### Cách 1: Dùng Action với HTTP Request (Khuyến nghị)

1. **Vào AppSheet Editor → Actions**
2. **Tạo Action mới** (ví dụ: "Sync to Supabase")
3. **Chọn "HTTP Request"**
4. **Cấu hình các fields:**

   **a) Field "URL" hoặc "Webhook URL":**
   ```
   https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
   ```
   
   **Nếu dùng expression (single quotes!):**
   ```
   'https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges'
   ```

   **b) Field "Method":**
   ```
   POST
   ```

   **c) Field "Headers" (nếu có):**
   Thêm từng header:
   - Key: `apikey`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

   - Key: `Content-Type`
   - Value: `application/json`

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

#### Cách 2: Sửa Webhook Task Hiện Tại

1. **Vào AppSheet Editor → Data → Webhooks** (hoặc nơi bạn tạo Task)
2. **Tìm Task "gọi webhook"**
3. **Field "Webhook" (URL):**
   - **XÓA** API key hiện tại
   - **THAY BẰNG** URL Supabase:
     ```
     https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
     ```
4. **Nếu có field "Headers" hoặc "Custom Headers":**
   - Thêm headers như hướng dẫn ở trên
5. **Nếu KHÔNG có field Headers:**
   - Phải dùng **Action với HTTP Request** (Cách 1)

### Bước 3: AppSheet Expression Syntax

**✅ ĐÚNG (single quotes):**
```
'https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges'
```

**❌ SAI (double quotes):**
```
"https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges"
```

**✅ ĐÚNG (expression với CONCATENATE):**
```
CONCATENATE('https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges')
```

**❌ SAI (đặt API key vào URL field):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Checklist Sửa Lỗi

- [ ] Đã xóa API key khỏi field "Webhook" (URL)
- [ ] Đã đặt URL Supabase endpoint vào field "Webhook"
- [ ] Đã thêm headers `apikey` và `Authorization` vào Headers field
- [ ] Đã dùng single quotes (') trong expression, không phải double quotes (")
- [ ] Đã test action/webhook

## 🎯 Ví Dụ Cấu Hình Hoàn Chỉnh

### Trong AppSheet Action "HTTP Request":

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

**Method:**
```
POST
```

**Headers (3 headers):**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
```

**Body:**
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

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra lại field "Webhook"** - Phải là URL, không phải API key
2. **Kiểm tra Headers** - API key phải ở trong Headers, không phải URL
3. **Kiểm tra expression syntax** - Dùng single quotes (')
4. **Thử dùng Action với HTTP Request** thay vì Webhook task nếu AppSheet không hỗ trợ headers trong Webhook
