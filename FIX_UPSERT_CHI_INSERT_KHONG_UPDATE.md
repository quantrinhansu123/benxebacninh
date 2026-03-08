# 🔧 Sửa Lỗi: Upsert Chỉ Insert, Không Update

## ❌ Vấn Đề

Webhook **thêm mới** (insert) record nhưng **không update** record cũ khi `firebase_id` đã tồn tại.

**Triệu chứng:**
- ✅ Expression trong Body đã hoạt động (không còn literal string)
- ✅ Webhook trả về 200 OK
- ❌ Record mới được tạo thay vì update record cũ
- ❌ Có thể tạo duplicate records (nếu không có unique constraint)

---

## 🔍 Nguyên Nhân

Với Supabase PostgREST, để **upsert** (INSERT hoặc UPDATE), cần:

1. ✅ **POST** method
2. ✅ Header `Prefer: resolution=merge-duplicates`
3. ⚠️ **Có thể cần** `on_conflict` parameter trong URL
4. ✅ **Unique constraint** trên `firebase_id` column

**Vấn đề thường gặp:**
- Header `Prefer` không được gửi đúng format
- Thiếu `on_conflict` parameter trong URL
- Unique constraint không tồn tại hoặc không đúng

---

## ✅ Giải Pháp

### Cách 1: POST + Prefer Header + on_conflict Parameter (Khuyến nghị)

#### HTTP Verb: **POST**

#### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

**⚠️ QUAN TRỌNG:** Header `Prefer` phải chính xác: `resolution=merge-duplicates` (không có dấu ngoặc kép, không có khoảng trắng thừa)

#### Webhook URL (Có on_conflict):
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&on_conflict=firebase_id
```

**⚠️ QUAN TRỌNG:** 
- ✅ Thêm `&on_conflict=firebase_id` vào URL
- ✅ `firebase_id` là tên column có unique constraint

#### Body (Expression):
```
CONCATENATE("{", """firebase_id"": """, [ID_PhuHieu], """, ""badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
```

---

### Cách 2: Kiểm Tra Unique Constraint

Nếu Cách 1 không hoạt động, kiểm tra unique constraint:

1. Vào Supabase Dashboard → Table Editor → `vehicle_badges`
2. Kiểm tra xem `firebase_id` có unique constraint không
3. Nếu không có, tạo constraint:
   ```sql
   ALTER TABLE vehicle_badges 
   ADD CONSTRAINT vehicle_badges_firebase_id_key UNIQUE (firebase_id);
   ```

---

### Cách 3: Dùng PATCH với Filter (Chỉ Update, Không Insert)

Nếu bạn **chỉ muốn update** (không insert mới), dùng PATCH:

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

#### Body (Expression, không có firebase_id):
```
CONCATENATE("{", """badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
```

**Lưu ý:**
- ⚠️ Chỉ UPDATE nếu record tồn tại (không INSERT mới)
- ⚠️ Lỗi nếu record chưa tồn tại

---

## 🔧 Cấu Hình Trong AppSheet

### Option A: POST + Prefer + on_conflict (Khuyến nghị)

1. **HTTP Verb:** POST
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
   Content-Type: application/json
   Prefer: resolution=merge-duplicates
   ```
   **⚠️ Lưu ý:** Header `Prefer` phải chính xác, không có dấu ngoặc kép
4. **Webhook URL (Có on_conflict):**
   ```
   https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&on_conflict=firebase_id
   ```
5. **Body (Expression):**
   ```
   CONCATENATE("{", """firebase_id"": """, [ID_PhuHieu], """, ""badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
   ```

### Option B: PATCH + Filter (Chỉ Update)

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
5. **Body (Expression, không có firebase_id):**
   ```
   CONCATENATE("{", """badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
   ```

---

## ✅ Checklist

- [ ] Đã chọn **POST** method (khuyến nghị) hoặc **PATCH** với filter
- [ ] Đã thêm header `Prefer: resolution=merge-duplicates` (chính xác, không có dấu ngoặc kép)
- [ ] Đã thêm `&on_conflict=firebase_id` vào URL (nếu dùng POST)
- [ ] Đã kiểm tra unique constraint trên `firebase_id` column
- [ ] Đã test với record đã tồn tại và xác nhận được update (không tạo record mới)

---

## 🧪 Test Thủ Công

### Test 1: Insert Record Mới

```powershell
$url = "https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ&on_conflict=firebase_id"
$body = @{
  firebase_id = "TEST-UPSERT-FINAL-001"
  badge_number = "PH-UPSERT-001"
  plate_number = "99U99999"
  source = "appsheet"
} | ConvertTo-Json
$headers = @{
  "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
  "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
  "Content-Type" = "application/json"
  "Prefer" = "resolution=merge-duplicates"
}
$response1 = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
Write-Host "✅ Insert thành công! badge_number: $($response1.badge_number)" -ForegroundColor Green
```

### Test 2: Update Record Cũ (Cùng firebase_id)

```powershell
# Gửi lại với cùng firebase_id nhưng badge_number khác
$body2 = @{
  firebase_id = "TEST-UPSERT-FINAL-001"
  badge_number = "PH-UPSERT-001-UPDATED"  # Thay đổi
  plate_number = "99U99999"
  source = "appsheet"
} | ConvertTo-Json
$response2 = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body2
Write-Host "✅ Update thành công! badge_number: $($response2.badge_number)" -ForegroundColor Green

# Kiểm tra: Nếu badge_number = "PH-UPSERT-001-UPDATED" thì upsert hoạt động
if ($response2.badge_number -eq "PH-UPSERT-001-UPDATED") {
  Write-Host "🎉 UPSERT HOẠT ĐỘNG ĐÚNG! Record đã được update." -ForegroundColor Green
} else {
  Write-Host "⚠️ Record không được update. badge_number vẫn là: $($response2.badge_number)" -ForegroundColor Yellow
}
```

---

## 🆘 Vẫn Không Update?

1. **Kiểm tra Header Prefer:**
   - Phải chính xác: `Prefer: resolution=merge-duplicates`
   - Không có dấu ngoặc kép
   - Không có khoảng trắng thừa

2. **Kiểm tra URL on_conflict:**
   - Phải có `&on_conflict=firebase_id` trong URL
   - `firebase_id` phải là tên column chính xác

3. **Kiểm tra Unique Constraint:**
   - Vào Supabase Dashboard → Table Editor → `vehicle_badges`
   - Kiểm tra xem `firebase_id` có unique constraint không
   - Nếu không có, tạo constraint

4. **Kiểm tra Response:**
   - Xem response từ Supabase có trả về record đã update không
   - Nếu trả về record mới (với id khác), có nghĩa là insert, không phải update

5. **Test với Postman/curl:**
   - Test thủ công để xác nhận cấu hình đúng

---

## 📝 Tóm Tắt

**Vấn đề:**
- Upsert chỉ insert, không update record cũ

**Giải pháp:**
- **Cách 1 (Khuyến nghị):** POST + Prefer header + `on_conflict` parameter trong URL
- **Cách 2:** Kiểm tra và tạo unique constraint trên `firebase_id`
- **Cách 3:** Dùng PATCH với filter (chỉ update, không insert)

**Khuyến nghị:** Dùng **POST + Prefer + on_conflict** vì đơn giản và linh hoạt (tự động insert hoặc update).
