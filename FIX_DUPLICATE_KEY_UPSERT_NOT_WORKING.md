# 🔧 Sửa Lỗi: Duplicate Key - Upsert Không Hoạt Động

## ❌ Lỗi

```
{"code":"23505","details":"Key (firebase_id)=(f126a64f) already exists.","hint":null,"message":"duplicate key value violates unique constraint \"vehicle_badges_firebase_id_key\""}
Status code: Conflict
```

---

## 🔍 Phân Tích

**Tình trạng:**
- ✅ Expression trong Body đã hoạt động (giá trị `f126a64f` đã được gửi đúng)
- ✅ Unique constraint đã tồn tại (lỗi 23505 chứng tỏ constraint hoạt động)
- ❌ Upsert không hoạt động - vẫn đang **INSERT** thay vì **UPDATE**

**Nguyên nhân:**
- Header `Prefer: resolution=merge-duplicates` có thể không được gửi đúng hoặc không được Supabase nhận
- `on_conflict` parameter có thể không hoạt động với Supabase PostgREST version hiện tại
- AppSheet có thể không gửi header `Prefer` đúng cách

---

## ✅ Giải Pháp

### Cách 1: Dùng PATCH với Filter (Chắc chắn nhất - Khuyến nghị)

PATCH với filter **chắc chắn** sẽ update record cũ, không tạo duplicate.

#### HTTP Verb: **PATCH**

#### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
```

#### Webhook URL (Có filter với eq.):
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&firebase_id=eq.[ID_PhuHieu]
```

**⚠️ QUAN TRỌNG:** 
- ✅ Phải có `&firebase_id=eq.[ID_PhuHieu]` trong URL
- ✅ Phải có `eq.` trước `[ID_PhuHieu]`
- ✅ `[ID_PhuHieu]` sẽ được thay thế bằng giá trị thực tế (ví dụ: `f126a64f`)

#### Body (Expression, không có firebase_id):
```
"{""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
```

**Lưu ý:**
- ⚠️ Chỉ UPDATE nếu record tồn tại (không INSERT mới)
- ⚠️ Nếu record chưa tồn tại, sẽ trả về 204 No Content (không có lỗi, nhưng không update gì)

---

### Cách 2: Kiểm Tra Header Prefer (Nếu muốn dùng POST)

Nếu bạn muốn dùng POST với upsert, cần đảm bảo header `Prefer` được gửi đúng:

#### HTTP Verb: **POST**

#### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

**⚠️ QUAN TRỌNG:** 
- Header `Prefer` phải chính xác: `resolution=merge-duplicates`
- Không có dấu ngoặc kép
- Không có khoảng trắng thừa
- Trong AppSheet, nhập chính xác: `Prefer: resolution=merge-duplicates`

#### Webhook URL (Có on_conflict):
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&on_conflict=firebase_id
```

#### Body (Expression):
```
"{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
```

---

## 🔧 Cấu Hình Trong AppSheet

### Option A: PATCH với Filter (Khuyến nghị - Chắc chắn nhất)

1. **HTTP Verb:** PATCH
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Content-Type: application/json
   ```
4. **Webhook URL (Có filter với eq.):**
   ```
   https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&firebase_id=eq.[ID_PhuHieu]
   ```
   **⚠️ QUAN TRỌNG:** Phải có `&firebase_id=eq.[ID_PhuHieu]` trong URL
5. **Body (Expression, không có firebase_id):**
   ```
   "{""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
   ```

### Option B: POST với Prefer Header (Nếu muốn Insert hoặc Update)

1. **HTTP Verb:** POST
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Content-Type: application/json
   Prefer: resolution=merge-duplicates
   ```
   **⚠️ QUAN TRỌNG:** Header `Prefer` phải chính xác, không có dấu ngoặc kép
4. **Webhook URL (Có on_conflict):**
   ```
   https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&on_conflict=firebase_id
   ```
5. **Body (Expression):**
   ```
   "{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
   ```

---

## 📋 So Sánh 2 Cách

| | PATCH + Filter | POST + Prefer |
|---|---|---|
| **HTTP Verb** | PATCH | POST |
| **URL Filter** | ✅ Cần `&firebase_id=eq.[ID_PhuHieu]` | ❌ Không cần |
| **Header Prefer** | ❌ Không cần | ✅ Cần `resolution=merge-duplicates` |
| **Body firebase_id** | ❌ Không cần | ✅ Cần |
| **Insert mới** | ❌ Không insert (204 No Content) | ✅ Tự động insert |
| **Update** | ✅ Chắc chắn update | ✅ Tự động update (nếu header đúng) |
| **Lỗi Duplicate** | ❌ Không có (chỉ update) | ⚠️ Có thể có nếu header sai |
| **Độ tin cậy** | ⭐⭐⭐ Rất cao | ⭐⭐ Trung bình (phụ thuộc header) |

---

## 🎯 Khuyến Nghị

### Dùng PATCH với Filter (Cách 1)

**Lý do:**
- ✅ **Chắc chắn** sẽ update record cũ (không tạo duplicate)
- ✅ Không phụ thuộc vào header `Prefer` (có thể AppSheet không gửi đúng)
- ✅ Không cần `on_conflict` parameter
- ✅ Đơn giản và dễ debug

**Lưu ý:**
- ⚠️ Chỉ UPDATE, không INSERT mới
- ⚠️ Nếu record chưa tồn tại, sẽ trả về 204 No Content (không có lỗi)

---

## ✅ Checklist

- [ ] Đã chọn **PATCH** method (khuyến nghị) hoặc **POST** với Prefer header
- [ ] Nếu dùng PATCH: Đã thêm filter `&firebase_id=eq.[ID_PhuHieu]` trong URL
- [ ] Nếu dùng POST: Đã thêm header `Prefer: resolution=merge-duplicates` (chính xác)
- [ ] Đã test và không còn lỗi duplicate key
- [ ] Đã xác nhận record được update (không tạo record mới)

---

## 🧪 Test

### Test với PATCH:

1. Gửi webhook với `firebase_id = "f126a64f"` (đã tồn tại)
2. Kiểm tra response:
   - ✅ 200 OK hoặc 204 No Content = Update thành công
   - ❌ 404 Not Found = Record không tồn tại (không có lỗi, nhưng không update)
3. Kiểm tra Supabase: Record với `firebase_id = "f126a64f"` đã được update

---

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra URL Filter:**
   - Phải có `&firebase_id=eq.[ID_PhuHieu]` trong URL
   - Phải có `eq.` trước `[ID_PhuHieu]`

2. **Kiểm tra Expression:**
   - `[ID_PhuHieu]` phải là tên cột chính xác trong AppSheet
   - Giá trị phải đúng (ví dụ: `f126a64f`)

3. **Kiểm tra Record:**
   - Vào Supabase Dashboard → Table Editor → `vehicle_badges`
   - Kiểm tra xem record với `firebase_id = "f126a64f"` có tồn tại không

4. **Test thủ công:**
   - Dùng Postman/curl để test PATCH request
   - Xem response có đúng không

---

## 📝 Tóm Tắt

**Vấn đề:**
- Duplicate key error - upsert không hoạt động với POST + Prefer header

**Giải pháp:**
- **Cách 1 (Khuyến nghị):** Dùng **PATCH** với filter `&firebase_id=eq.[ID_PhuHieu]` trong URL
- **Cách 2:** Dùng **POST** với header `Prefer: resolution=merge-duplicates` (đảm bảo header chính xác)

**Khuyến nghị:** Dùng **PATCH với filter** vì chắc chắn và không phụ thuộc vào header.
