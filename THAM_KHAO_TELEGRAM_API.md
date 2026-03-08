# 📱 Tham Khảo: Telegram Bot API - Áp Dụng Cho Supabase

## 🔍 Phân Tích Link Telegram Thành Công

### Link Mẫu:
```
https://api.telegram.org/bot7265946266:AAEtzL0o-D5bkfJFbMerK7rkfDsELPIZuuI/sendMessage?chat_id=-4762901369&parse_mode=HTML&Json=
```

### Cấu Trúc:
1. **Base URL:** `https://api.telegram.org`
2. **API Key trong Path:** `/bot{TOKEN}` (token được đặt trực tiếp trong URL path)
3. **Endpoint:** `/sendMessage`
4. **Query Parameters:** `?chat_id=...&parse_mode=...&Json=`

---

## 🔄 So Sánh: Telegram vs Supabase

| | Telegram Bot API | Supabase PostgREST API |
|---|---|---|
| **API Key Location** | Trong URL path: `/bot{TOKEN}` | Header `apikey` hoặc query param `?apikey=...` |
| **Format** | `https://api.telegram.org/bot{TOKEN}/endpoint` | `https://{project}.supabase.co/rest/v1/table?apikey={KEY}` |
| **Query Params** | `?chat_id=...&parse_mode=...` | `?apikey=...&select=...&filter=...` |
| **Headers** | Không bắt buộc | Cần `apikey` header hoặc query param |

---

## ✅ Áp Dụng Cho Supabase

### Cách 1: Query Parameter (Tương Tự Telegram)

**Format Supabase:**
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

**Tương tự Telegram:**
- Telegram: `?chat_id=...&parse_mode=...`
- Supabase: `?apikey=...&select=...` (nếu cần)

### Cách 2: Thêm Parameters Khác (Nếu Cần)

**Ví dụ với nhiều parameters:**
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&select=*&order=created_at.desc
```

**Format:** `?apikey=...&param1=...&param2=...`

---

## 📋 Cấu Hình Trong AppSheet (Tương Tự Telegram)

### Bước 1: Webhook URL

**Đặt URL đầy đủ với API key trong query parameter:**

```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

**Tương tự như Telegram:**
- Telegram: `https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id=...`
- Supabase: `https://{project}.supabase.co/rest/v1/{table}?apikey=...`

### Bước 2: HTTP Headers (Có Thể Bỏ Qua)

Nếu AppSheet gửi query parameters đúng cách (như Telegram), **không cần Headers**.

**Hoặc chỉ cần:**
```
Content-Type: application/json
```

### Bước 3: Body (Nếu POST)

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

## 🔍 Tại Sao Telegram Work Mà Supabase Không?

### Telegram Bot API:
- ✅ **Được thiết kế** để nhận token trong URL path
- ✅ **Hỗ trợ tốt** query parameters
- ✅ **Đơn giản** cho webhook/HTTP requests

### Supabase PostgREST:
- ⚠️ **Ưu tiên** nhận API key qua **Headers** (an toàn hơn)
- ⚠️ **Hỗ trợ** query parameter `?apikey=...` nhưng có thể bị một số client không gửi đúng
- ⚠️ **AppSheet có thể** không gửi query parameters đúng cách

---

## ✅ Giải Pháp: Kết Hợp Cả 2 Cách

### Nếu AppSheet Gửi Query Parameters Đúng (Như Telegram):

**Chỉ cần URL:**
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

### Nếu AppSheet Không Gửi Query Parameters Đúng:

**Dùng Headers (An toàn hơn):**
- URL: `https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges`
- Headers: `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🧪 Test So Sánh

### Test Telegram (Đã Thành Công):
```powershell
$url = "https://api.telegram.org/bot7265946266:AAEtzL0o-D5bkfJFbMerK7rkfDsELPIZuuI/sendMessage?chat_id=-4762901369&parse_mode=HTML&text=Test"
Invoke-RestMethod -Uri $url -Method GET
```

### Test Supabase (Tương Tự):
```powershell
$url = "https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
$body = @{ firebase_id = "TEST-001"; badge_number = "PH-001"; plate_number = "99H99999"; badge_type = "Test"; status = "active"; source = "appsheet" } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json" }
Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

---

## 📝 Tóm Tắt

**Telegram thành công vì:**
- ✅ Token trong URL path (thiết kế sẵn)
- ✅ Query parameters được gửi đúng
- ✅ AppSheet hỗ trợ tốt format này

**Supabase có thể không work vì:**
- ⚠️ AppSheet có thể không gửi query parameters đúng cách
- ⚠️ Supabase ưu tiên Headers hơn query params

**Giải pháp:**
1. **Thử URL với query parameter** (như Telegram) - Nếu AppSheet hỗ trợ
2. **Nếu không work, dùng Headers** (an toàn hơn)

---

## ✅ Checklist

- [ ] Đã thử URL với `?apikey=...` (tương tự Telegram)
- [ ] Nếu không work, đã thử Headers
- [ ] Đã test và xác nhận format nào work với AppSheet
