# 🔧 Sửa Lỗi: "UPDATE requires a WHERE clause"

## ❌ Lỗi

```
{"code":"21000","details":null,"hint":null,"message":"UPDATE requires a WHERE clause"}
Status code: BadRequest
```

---

## 🔍 Nguyên Nhân

Lỗi này xảy ra khi bạn dùng **PATCH** hoặc **PUT** method nhưng **không có filter** trong URL.

**Vấn đề:**
- PATCH/PUT cần **WHERE clause** (filter) để biết update record nào
- Bạn đang dùng PATCH/PUT nhưng không có filter trong URL
- Supabase không cho phép UPDATE tất cả records (cần filter để bảo vệ dữ liệu)

---

## ✅ Giải Pháp

### Cách 1: Dùng POST với Prefer Header (Khuyến nghị - Đơn giản nhất)

**Không cần filter**, Supabase tự động upsert dựa trên unique constraint.

#### HTTP Verb: **POST**

#### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6cvLLMs9YFvAQ
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

#### Webhook URL:
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

#### Body:
```json
{
  "firebase_id": "[ID_PhuHieu]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "source": "appsheet"
}
```

**Lưu ý:** 
- ✅ Không cần filter trong URL
- ✅ Supabase tự động upsert dựa trên `firebase_id` (unique constraint)

---

### Cách 2: Dùng PATCH với Filter trong URL

**Nếu bạn muốn dùng PATCH**, cần thêm filter trong URL.

#### HTTP Verb: **PATCH**

#### Webhook URL (Có filter):
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&firebase_id=eq.[ID_PhuHieu]
```

**Lưu ý:** 
- ✅ Phải có `&firebase_id=eq.[ID_PhuHieu]` trong URL
- ✅ Format: `?apikey=...&firebase_id=eq.[value]`

#### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
```

#### Body (Không cần firebase_id):
```json
{
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "source": "appsheet"
}
```

**Lưu ý:**
- ⚠️ Không cần gửi `firebase_id` trong Body (đã có trong URL filter)
- ⚠️ Chỉ update các field cần thay đổi
- ⚠️ Lỗi nếu record chưa tồn tại

---

## 📋 So Sánh 2 Cách

| | POST với Prefer | PATCH với Filter |
|---|---|---|
| **HTTP Verb** | POST | PATCH |
| **URL Filter** | ❌ Không cần | ✅ Cần `&firebase_id=eq.[value]` |
| **Header Prefer** | ✅ Cần `resolution=merge-duplicates` | ❌ Không cần |
| **Body firebase_id** | ✅ Cần | ❌ Không cần (đã có trong URL) |
| **Insert mới** | ✅ Tự động insert | ❌ Lỗi nếu chưa tồn tại |
| **Update** | ✅ Tự động update | ✅ Update nếu tồn tại |
| **Độ phức tạp** | ⭐ Đơn giản | ⭐⭐ Phức tạp hơn |

---

## 🎯 Khuyến Nghị

### Dùng POST với Prefer Header (Cách 1)

**Lý do:**
- ✅ Đơn giản hơn (không cần filter trong URL)
- ✅ Tự động INSERT hoặc UPDATE
- ✅ Không lỗi nếu record chưa tồn tại
- ✅ Dễ cấu hình trong AppSheet

---

## 🔧 Cấu Hình Trong AppSheet

### Option A: POST với Prefer (Khuyến nghị)

1. **HTTP Verb:** POST
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Content-Type: application/json
   Prefer: resolution=merge-duplicates
   ```
4. **Webhook URL:**
   ```
   https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   ```
5. **Body:**
   ```json
   {
     "firebase_id": "[ID_PhuHieu]",
     "badge_number": "[SoPhuHieu]",
     "plate_number": "[BienSo]",
     "source": "appsheet"
   }
   ```

### Option B: PATCH với Filter

1. **HTTP Verb:** PATCH
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Content-Type: application/json
   ```
4. **Webhook URL (Có filter):**
   ```
   https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&firebase_id=eq.[ID_PhuHieu]
   ```
5. **Body (Không có firebase_id):**
   ```json
   {
     "badge_number": "[SoPhuHieu]",
     "plate_number": "[BienSo]",
     "source": "appsheet"
   }
   ```

---

## ✅ Checklist

- [ ] Đã chọn **POST** (khuyến nghị) hoặc **PATCH** với filter
- [ ] Nếu dùng POST: Đã thêm header `Prefer: resolution=merge-duplicates`
- [ ] Nếu dùng PATCH: Đã thêm filter `&firebase_id=eq.[ID_PhuHieu]` trong URL
- [ ] Đã test và không còn lỗi "UPDATE requires a WHERE clause"

---

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra HTTP Verb:** Đảm bảo chọn POST hoặc PATCH với filter
2. **Kiểm tra URL:** Nếu dùng PATCH, phải có `&firebase_id=eq.[value]`
3. **Kiểm tra Headers:** Nếu dùng POST, phải có `Prefer: resolution=merge-duplicates`
4. **Test thủ công:** Dùng PowerShell/Postman để test

---

## 📝 Tóm Tắt

**Nguyên nhân:**
- Dùng PATCH/PUT nhưng không có filter trong URL

**Giải pháp:**
- **Cách 1 (Khuyến nghị):** Dùng **POST** với header `Prefer: resolution=merge-duplicates`
- **Cách 2:** Dùng **PATCH** với filter `&firebase_id=eq.[ID_PhuHieu]` trong URL

**Khuyến nghị:** Dùng **POST** với Prefer header vì đơn giản và linh hoạt hơn.
