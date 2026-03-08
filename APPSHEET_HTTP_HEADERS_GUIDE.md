# 📋 Hướng Dẫn Điền HTTP Headers trong AppSheet

## 📍 Vị Trí Field

Trong AppSheet, bạn sẽ thấy field:
```
HTTP Headers
Optional HTTP headers. (Expressions that yield HTTP header names or values are supported.)
```

## ✅ Cách Điền HTTP Headers

### Cách 1: Format Key-Value Pairs (Khuyến nghị)

AppSheet thường hỗ trợ format **Key: Value** hoặc **Key=Value**. Thử các format sau:

#### Format A: Mỗi header một dòng (Key: Value)

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
```

#### Format B: JSON Format (Nếu AppSheet hỗ trợ)

```json
{
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI",
  "Content-Type": "application/json"
}
```

#### Format C: Semicolon Separated

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI; Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI; Content-Type: application/json
```

### Cách 2: Dùng Expression (Nếu cần dynamic)

Nếu AppSheet hỗ trợ expressions, bạn có thể dùng:

#### Expression cho Header Value:

```
CONCATENATE('Bearer ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI')
```

**Lưu ý:** AppSheet expression dùng **single quotes (')** không phải double quotes (")

#### Expression cho Multiple Headers:

Nếu AppSheet yêu cầu format đặc biệt, thử:

```
CONCATENATE('apikey: ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI', CHAR(10), 'Authorization: Bearer ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI', CHAR(10), 'Content-Type: application/json')
```

### Cách 3: Nếu AppSheet Có UI Cho Từng Header

Một số AppSheet có giao diện cho phép thêm từng header riêng:

1. Click **"+"** hoặc **"Add Header"**
2. Thêm từng header:

   **Header 1:**
   - Name: `apikey`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

   **Header 2:**
   - Name: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`
   - ⚠️ **Lưu ý:** Phải có prefix "Bearer " (có dấu cách)

   **Header 3:**
   - Name: `Content-Type`
   - Value: `application/json`

## 📝 3 Headers Cần Thiết Cho Supabase

### 1. Header `apikey`
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### 2. Header `Authorization`
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```
⚠️ **QUAN TRỌNG:** Phải có prefix "Bearer " (có dấu cách sau Bearer)

### 3. Header `Content-Type`
```
Content-Type: application/json
```

## 🧪 Cách Test

Sau khi điền headers, test bằng cách:

1. **Lưu cấu hình**
2. **Chạy Task/Action**
3. **Kiểm tra response:**
   - ✅ Thành công: Nhận được data từ Supabase hoặc status 200/201
   - ❌ Lỗi 401: Thiếu hoặc sai API key → Kiểm tra lại headers
   - ❌ Lỗi 400: Body format sai → Kiểm tra Body field

## ⚠️ Lưu Ý Quan Trọng

1. **Không đặt API key vào URL field** - Chỉ đặt vào Headers
2. **Authorization header phải có prefix "Bearer "** - Có dấu cách sau Bearer
3. **Dùng single quotes (') trong expressions** - Không dùng double quotes (")
4. **Không có khoảng trắng thừa** - Sau dấu ":" trong Key: Value

## 📋 Checklist

- [ ] Đã thêm header `apikey` với Supabase anon key
- [ ] Đã thêm header `Authorization` với format `Bearer <key>`
- [ ] Đã thêm header `Content-Type: application/json`
- [ ] Field "Webhook" (URL) là Supabase endpoint, không phải API key
- [ ] Đã test và không còn lỗi 401

## 🆘 Vẫn Gặp Lỗi?

1. **Thử format khác:** Nếu format hiện tại không work, thử format khác (JSON, semicolon, etc.)
2. **Kiểm tra UI:** Xem AppSheet có UI riêng cho từng header không
3. **Xem documentation:** AppSheet có thể có format đặc biệt cho headers
4. **Test từng header:** Thử chỉ thêm 1 header để xem format nào work
