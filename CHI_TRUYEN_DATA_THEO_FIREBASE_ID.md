# 🎯 Chỉ Truyền Data Của Record Có `id=firebase_id`

## 📋 Mục Tiêu

Chỉ gửi dữ liệu của **1 record cụ thể** có `firebase_id` nhất định từ AppSheet đến Supabase, thay vì gửi tất cả records.

---

## ✅ Cách 1: Filter Trong AppSheet Body (Khuyến nghị)

### Bước 1: Sửa Body Của Webhook

Trong AppSheet, sửa field **"Body"** của webhook để chỉ gửi record có `firebase_id` cụ thể.

#### Format Body (Chỉ 1 Record):

```json
{
  "firebase_id": "[firebase_id]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "status": "[TrangThai]",
  "source": "appsheet"
}
```

#### Dùng AppSheet Expression:

Nếu bạn muốn filter động, dùng expression trong Body:

**Cách A: Dùng IF để filter**

Trong AppSheet, tạo expression để chỉ gửi khi `[id] = [firebase_id]`:

```
IF([id] = [firebase_id], 
  {
    "firebase_id": [id],
    "badge_number": [SoPhuHieu],
    "plate_number": [BienSo],
    "badge_type": [LoaiPH],
    "status": [TrangThai],
    "source": "appsheet"
  },
  {}
)
```

**Cách B: Dùng WHERE trong Action**

Nếu AppSheet hỗ trợ, thêm điều kiện WHERE vào Action:
- **Condition:** `[id] = [firebase_id]`
- Chỉ chạy Action khi điều kiện này đúng

---

## ✅ Cách 2: Dùng Supabase API Filter (Nếu Cần Update)

Nếu bạn muốn **update** record có `firebase_id` cụ thể trong Supabase:

### URL Với Filter:

```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI&firebase_id=eq.[firebase_id]
```

**Format:** `?apikey=...&firebase_id=eq.[value]`

### Hoặc Dùng PATCH Method:

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI&firebase_id=eq.[firebase_id]
```

**Method:** `PATCH` (thay vì POST)

**Body:**
```json
{
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "status": "[TrangThai]"
}
```

---

## ✅ Cách 3: Dùng Supabase Upsert Với firebase_id

Nếu bạn muốn **upsert** (insert hoặc update) record có `firebase_id` cụ thể:

### URL Với Prefer Header:

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

**Method:** `POST`

**Headers:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

**Body:**
```json
{
  "firebase_id": "[firebase_id]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "status": "[TrangThai]",
  "source": "appsheet"
}
```

**Lưu ý:** Header `Prefer: resolution=merge-duplicates` sẽ upsert dựa trên unique constraint (thường là `firebase_id`).

---

## 📋 Cấu Hình Trong AppSheet

### Option A: Filter Trong Action Condition

1. **Mở Action/Task "gọi webhook"**
2. **Thêm điều kiện:**
   - **Condition:** `[id] = [firebase_id]`
   - Chỉ chạy khi điều kiện này đúng

3. **Body:**
```json
{
  "firebase_id": [id],
  "badge_number": [SoPhuHieu],
  "plate_number": [BienSo],
  "badge_type": [LoaiPH],
  "status": [TrangThai],
  "source": "appsheet"
}
```

### Option B: Dùng Expression Trong Body

**Body với expression:**

```
IF([id] = [firebase_id], 
  CONCATENATE('{"firebase_id":"', [id], '","badge_number":"', [SoPhuHieu], '","plate_number":"', [BienSo], '","badge_type":"', [LoaiPH], '","status":"', [TrangThai], '","source":"appsheet"}'),
  '{}'
)
```

⚠️ **Lưu ý:** Format này phức tạp, nên dùng Option A nếu có thể.

---

## 🧪 Test

### Test Với PowerShell:

```powershell
# Test chỉ gửi 1 record có firebase_id cụ thể
$url = "https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI"
$body = @{
    firebase_id = "TEST-FIREBASE-ID-001"  # Chỉ record này
    badge_number = "PH-001"
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
    Write-Host "✅ Đã gửi thành công chỉ 1 record với firebase_id cụ thể!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📊 So Sánh Các Cách

| Cách | Ưu Điểm | Nhược Điểm | Khi Nào Dùng |
|------|---------|------------|--------------|
| **Filter trong AppSheet** | ✅ Đơn giản, kiểm soát tốt | ⚠️ Cần cấu hình AppSheet | Khi muốn filter trước khi gửi |
| **Supabase API Filter** | ✅ Filter ở phía server | ⚠️ Cần biết firebase_id trước | Khi muốn query/update record cụ thể |
| **Upsert với firebase_id** | ✅ Tự động insert/update | ⚠️ Cần unique constraint | Khi muốn đảm bảo chỉ 1 record |

---

## ✅ Checklist

- [ ] Đã xác định `firebase_id` cụ thể cần gửi
- [ ] Đã thêm điều kiện filter trong AppSheet Action (nếu cần)
- [ ] Đã sửa Body để chỉ gửi 1 record
- [ ] Đã test và xác nhận chỉ record đó được gửi
- [ ] Đã kiểm tra Supabase xem chỉ record đó được insert/update

---

## 🆘 Vẫn Gặp Vấn Đề?

1. **Kiểm tra firebase_id:** Xem có đúng format không
2. **Kiểm tra Body:** Xem có gửi đúng 1 record không
3. **Xem logs:** Supabase Dashboard → Logs để xem request thực tế
4. **Test thủ công:** Dùng PowerShell/Postman để test trước

---

## 📝 Tóm Tắt

**Cách đơn giản nhất:**
1. **Thêm điều kiện** trong AppSheet Action: `[id] = [firebase_id]`
2. **Body** chỉ gửi 1 record với `firebase_id` đó
3. **Test** và xác nhận chỉ record đó được gửi

**Nếu cần update record cụ thể:**
- Dùng **PATCH** method với filter `?firebase_id=eq.[value]`
- Hoặc dùng **upsert** với `Prefer: resolution=merge-duplicates`
