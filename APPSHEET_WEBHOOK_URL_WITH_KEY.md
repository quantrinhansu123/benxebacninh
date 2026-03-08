# 🔗 Hướng Dẫn: Thêm API Key Vào Webhook URL (Không Dùng Headers)

## ✅ Cách Thêm API Key Vào URL

Supabase PostgREST API hỗ trợ nhận API key qua **query parameter** trong URL, không cần dùng Headers.

---

## 📝 Format URL Với API Key

### Format Cơ Bản

```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=YOUR_API_KEY
```

### Thay Thế YOUR_API_KEY

**URL đầy đủ:**

```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

---

## 🎯 Các Endpoint Với API Key

### 1. Vehicle Badges
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### 2. Vehicles
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicles?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### 3. Routes
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/routes?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### 4. Operators
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/operators?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

---

## 📋 Cấu Hình Trong AppSheet

### Bước 1: Mở Task "gọi webhook"

1. Vào **AppSheet Editor**
2. Tìm **Task "gọi webhook"**
3. Click để edit

### Bước 2: Điền Webhook URL (Text)

**Trong field "Webhook" hoặc "Webhook URL":**

Dán URL đầy đủ với API key:

```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### Bước 3: Xóa Headers (Nếu Có)

Nếu field **HTTP Headers** có nội dung, bạn có thể:
- **Xóa hết** (không cần headers nữa)
- Hoặc **để trống**

### Bước 4: Cấu Hình Body (Nếu Cần)

Nếu là POST request, cấu hình Body với JSON:

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

---

## ⚠️ Lưu Ý Quan Trọng

### 1. API Key Trong URL

- ✅ Supabase hỗ trợ nhận API key qua query parameter `?apikey=...`
- ✅ Không cần header `apikey` nữa
- ⚠️ **Bảo mật:** API key sẽ hiển thị trong URL (có thể bị log), nhưng với anon key thì OK

### 2. Authorization Header (Tùy Chọn)

Nếu vẫn muốn dùng Authorization header (không bắt buộc nếu đã có `apikey` trong URL):

- Có thể thêm header `Authorization: Bearer <key>` nếu muốn
- Hoặc chỉ dùng `apikey` trong URL là đủ

### 3. Content-Type Header

Nếu AppSheet tự động thêm `Content-Type: application/json`, tốt.
Nếu không, có thể thêm header này (hoặc để AppSheet tự xử lý).

---

## 🧪 Test

### Test Bằng PowerShell (Windows)

```powershell
$url = "https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI"
$body = @{
    firebase_id = "TEST-URL-001"
    badge_number = "PH-TEST-001"
    plate_number = "99H99999"
    badge_type = "Test"
    status = "active"
    source = "appsheet"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Test thành công! API key trong URL hoạt động." -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Chi tiết: $($_.ErrorDetails.Message)"
    }
}
```

---

## 📊 So Sánh 2 Cách

| | Dùng Headers | Dùng URL Query Parameter |
|---|---|---|
| **Format** | Header: `apikey: <key>` | URL: `?apikey=<key>` |
| **Bảo mật** | ✅ Tốt hơn (không hiển thị trong URL) | ⚠️ Key hiển thị trong URL (có thể bị log) |
| **Độ dài URL** | URL ngắn | URL dài (có API key) |
| **AppSheet** | Cần field Headers | Chỉ cần field URL |
| **Hỗ trợ** | ✅ Cả 2 cách đều được Supabase hỗ trợ |

---

## ✅ Checklist

- [ ] Đã thêm `?apikey=<your_key>` vào cuối URL
- [ ] URL đầy đủ và không có lỗi format
- [ ] Đã xóa hoặc để trống field HTTP Headers (nếu không cần)
- [ ] Đã cấu hình Body (nếu là POST request)
- [ ] Đã test và thành công

---

## 🆘 Vẫn Gặp Lỗi?

### Lỗi 401: Unauthorized
- ✅ Kiểm tra API key trong URL đúng chưa
- ✅ Kiểm tra có dấu `?` trước `apikey` chưa
- ✅ Kiểm tra API key không bị cắt hoặc thiếu ký tự

### Lỗi 400: Bad Request
- ✅ Kiểm tra Body format JSON đúng chưa
- ✅ Kiểm tra tên cột trong Body có khớp với Supabase không

### Lỗi URL quá dài
- ⚠️ Nếu AppSheet giới hạn độ dài URL, quay lại dùng Headers
- Hoặc dùng URL shortener (không khuyến nghị vì mất API key)

---

## 📝 Tóm Tắt

**Cách đơn giản nhất:**
1. Thêm `?apikey=<your_key>` vào cuối URL Supabase
2. Đặt URL này vào field "Webhook URL" trong AppSheet
3. Xóa hoặc để trống field HTTP Headers
4. Test và hoàn thành!
