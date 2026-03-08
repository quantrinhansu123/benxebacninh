# 🔧 Sửa Lỗi: "No API key found in request"

## ❌ Lỗi

```
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}
Status code: Unauthorized
```

Lỗi này xảy ra khi Supabase không nhận được API key, dù bạn đã thêm vào URL.

---

## 🔍 Nguyên Nhân Có Thể

1. **AppSheet không gửi query parameters** từ URL đúng cách
2. **Format URL sai** (thiếu `?` hoặc `&`)
3. **AppSheet cần dùng HTTP Parameters field** thay vì đặt trong URL
4. **Vẫn cần dùng Headers** (AppSheet không hỗ trợ query params)

---

## ✅ Giải Pháp 1: Dùng HTTP Parameters Field (Khuyến nghị)

Nếu AppSheet có field **"HTTP Parameters"** hoặc **"URL Parameters"**, dùng field này thay vì đặt trong URL.

### Bước 1: Sửa Webhook URL (Xóa API key)

**URL đúng (KHÔNG có API key):**
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges
```

### Bước 2: Thêm HTTP Parameters

Trong field **"HTTP Parameters"** hoặc **"URL Parameters"**, thêm:

**Parameter 1:**
- **Name:** `apikey`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ`

AppSheet sẽ tự động thêm `?apikey=...` vào URL khi gửi request.

---

## ✅ Giải Pháp 2: Dùng Headers (Nếu Không Có Parameters Field)

Nếu AppSheet **KHÔNG có** field HTTP Parameters, quay lại dùng **Headers** với format đúng.

### Bước 1: Sửa Webhook URL (Xóa API key)

**URL đúng:**
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges
```

### Bước 2: Thêm HTTP Headers

Trong field **"HTTP Headers"**, nhập (mỗi header một dòng, **KHÔNG có JSON format**):

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
```

**Lưu ý:**
- ✅ Không có dấu `{` hoặc `}`
- ✅ Không có dấu `"` (ngoặc kép)
- ✅ Mỗi header một dòng
- ✅ Format: `Key: Value`

---

## ✅ Giải Pháp 3: Dùng Expression Trong URL (Nếu AppSheet Hỗ Trợ)

Nếu AppSheet hỗ trợ expressions trong URL field, thử:

```
CONCATENATE('https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ')
```

**Lưu ý:** Dùng **single quotes (')** không phải double quotes (")

---

## 🧪 Test Từng Cách

### Test 1: URL với Query Parameter (Trực tiếp)

```powershell
$url = "https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
$body = @{ firebase_id = "TEST-001"; badge_number = "PH-001"; plate_number = "99H99999"; badge_type = "Test"; status = "active"; source = "appsheet" } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json"; "Prefer" = "return=representation" }
try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Test thành công với query parameter!" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Test 2: Headers (Không có query parameter)

```powershell
$url = "https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges"
$body = @{ firebase_id = "TEST-002"; badge_number = "PH-002"; plate_number = "99H99999"; badge_type = "Test"; status = "active"; source = "appsheet" } | ConvertTo-Json
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}
try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Test thành công với headers!" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📊 So Sánh Các Cách

| Cách | Ưu Điểm | Nhược Điểm | Khuyến Nghị |
|------|---------|------------|-------------|
| **HTTP Parameters Field** | ✅ AppSheet tự xử lý | ⚠️ Cần AppSheet hỗ trợ | ⭐⭐⭐⭐⭐ |
| **Headers** | ✅ Luôn hoạt động | ⚠️ Cần format đúng | ⭐⭐⭐⭐ |
| **URL với Query Param** | ✅ Đơn giản | ❌ AppSheet có thể không gửi | ⭐⭐ |
| **Expression trong URL** | ✅ Linh hoạt | ⚠️ Phức tạp hơn | ⭐⭐⭐ |

---

## ✅ Checklist

- [ ] Đã thử dùng **HTTP Parameters field** (nếu có)
- [ ] Hoặc đã thử dùng **Headers** với format đúng (không có JSON)
- [ ] Đã xóa API key khỏi URL (nếu dùng Parameters hoặc Headers)
- [ ] Đã test và không còn lỗi 401

---

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra AppSheet version:** Một số version có thể không hỗ trợ query parameters
2. **Xem logs:** Kiểm tra AppSheet logs để xem URL thực tế được gửi
3. **Dùng Headers:** Nếu không chắc, dùng Headers (cách an toàn nhất)
4. **Liên hệ AppSheet support:** Nếu vẫn không work, có thể là bug của AppSheet

---

## 📝 Tóm Tắt

**Cách tốt nhất:**
1. **Nếu có HTTP Parameters field:** Dùng field này, URL không có API key
2. **Nếu không có:** Dùng Headers với format `Key: Value` (mỗi dòng một header)
3. **Không dùng:** URL với query parameter (AppSheet có thể không gửi đúng)
