# 🔧 Sửa Lỗi: Data Không Nhảy - AppSheet Expression Trong Body

## ❌ Vấn Đề

Webhook báo **thành công** nhưng **data không được cập nhật** vào Supabase.

**Triệu chứng:**
- ✅ Webhook trả về 200 OK
- ❌ Data trong Supabase vẫn là literal string `[ID_PhuHieu]`, `[SoPhuHieu]`, `[BienSo]`
- ❌ Không có giá trị thực tế từ AppSheet

**Nguyên nhân:**
- Trong **Body** của webhook, bạn đang nhập **literal string** `[ID_PhuHieu]` thay vì dùng **AppSheet expression**

---

## 🔍 Phân Tích

### ❌ SAI - Literal String (Text)

Trong AppSheet, nếu bạn nhập trong Body field:
```json
{
  "firebase_id": "[ID_PhuHieu]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]"
}
```

**Kết quả:** Supabase nhận được literal string `"[ID_PhuHieu]"` thay vì giá trị thực tế.

### ✅ ĐÚNG - AppSheet Expression

Trong AppSheet, bạn cần dùng **expression** để build JSON string:

**Option 1: Dùng Expression trong Body Field**
```
CONCATENATE("{", """firebase_id"": """, [ID_PhuHieu], """, ""badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
```

**Option 2: Dùng JSON Expression (Nếu AppSheet hỗ trợ)**
```
{
  "firebase_id": "[ID_PhuHieu]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "source": "appsheet"
}
```
**Lưu ý:** Trong AppSheet, khi nhập trong Body field, bạn cần đảm bảo field đó là **Expression** type, không phải **Text** type.

---

## ✅ Giải Pháp

### Cách 1: Dùng CONCATENATE Expression (Khuyến nghị)

Trong AppSheet, trong field **Body** (hoặc **HTTP Body**), chọn **Expression** và nhập:

```
CONCATENATE("{", """firebase_id"": """, IF(ISBLANK([ID_PhuHieu]), """"", [ID_PhuHieu]), """, ""badge_number"": """, IF(ISBLANK([SoPhuHieu]), """"", [SoPhuHieu]), """, ""plate_number"": """, IF(ISBLANK([BienSo]), """"", [BienSo]), """, ""source"": ""appsheet""}")
```

**Giải thích:**
- `CONCATENATE()`: Nối các chuỗi lại với nhau
- `"""` : Escape double quote trong AppSheet expression
- `IF(ISBLANK([Column]), """"", [Column])`: Xử lý giá trị rỗng (trả về `""` nếu blank)

**Kết quả:** JSON string hợp lệ với giá trị thực tế từ AppSheet.

---

### Cách 2: Dùng Expression với JSON Format (Đơn giản hơn)

Nếu AppSheet hỗ trợ expression trong Body field, bạn có thể dùng:

```
"{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
```

**Giải thích:**
- `&`: Toán tử nối chuỗi trong AppSheet
- `""`: Escape double quote
- `[Column]`: Lấy giá trị từ cột

---

### Cách 3: Dùng Expression Builder (Nếu có)

Một số version của AppSheet có **Expression Builder** cho JSON Body:

1. Chọn field **Body**
2. Chọn **Expression** (không phải **Text**)
3. Dùng Expression Builder để map:
   - `firebase_id` → `[ID_PhuHieu]`
   - `badge_number` → `[SoPhuHieu]`
   - `plate_number` → `[BienSo]`
   - `source` → `"appsheet"`

---

## 🔧 Cấu Hình Trong AppSheet

### Bước 1: Kiểm Tra Body Field Type

1. Vào **Automation** → **Webhook** (hoặc **HTTP Request**)
2. Tìm field **Body** (hoặc **HTTP Body**)
3. **QUAN TRỌNG:** Đảm bảo field này là **Expression** type, không phải **Text** type

### Bước 2: Nhập Expression

**Option A: CONCATENATE (Khuyến nghị)**

Trong field **Body**, chọn **Expression** và nhập:

```
CONCATENATE("{", """firebase_id"": """, [ID_PhuHieu], """, ""badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
```

**Option B: Dùng & Operator**

```
"{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
```

### Bước 3: Test

1. Chạy webhook với một record
2. Kiểm tra Supabase xem có nhận được giá trị thực tế không
3. Nếu vẫn thấy `[ID_PhuHieu]`, kiểm tra lại field type (phải là Expression)

---

## 📋 Full Configuration

### HTTP Verb: **POST**

### HTTP Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
Content-Type: application/json
Prefer: resolution=merge-duplicates
```

### Webhook URL:
```
https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ
```

### Body (Expression - QUAN TRỌNG):
```
CONCATENATE("{", """firebase_id"": """, [ID_PhuHieu], """, ""badge_number"": """, [SoPhuHieu], """, ""plate_number"": """, [BienSo], """, ""source"": ""appsheet""}")
```

**Hoặc:**
```
"{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
```

---

## ✅ Checklist

- [ ] Đã kiểm tra Body field là **Expression** type (không phải Text)
- [ ] Đã nhập expression đúng format (CONCATENATE hoặc & operator)
- [ ] Đã test và xác nhận Supabase nhận được giá trị thực tế (không phải `[ID_PhuHieu]`)
- [ ] Đã xóa record test với `firebase_id = "[ID_PhuHieu]"` trong Supabase

---

## 🆘 Vẫn Gặp Vấn Đề?

1. **Kiểm tra Field Type:**
   - Body field phải là **Expression**, không phải **Text**
   - Nếu không thấy option Expression, thử dùng **Formula** hoặc **Computed Value**

2. **Kiểm tra Column Names:**
   - Đảm bảo `[ID_PhuHieu]`, `[SoPhuHieu]`, `[BienSo]` là tên cột chính xác trong AppSheet
   - Kiểm tra case-sensitive (chữ hoa/thường)

3. **Test Expression:**
   - Tạo một column test trong AppSheet với expression `[ID_PhuHieu]`
   - Xem giá trị có đúng không
   - Nếu đúng, copy expression đó vào Body

4. **Kiểm tra JSON Format:**
   - Test expression trong AppSheet trước
   - Copy output và paste vào JSON validator để kiểm tra

---

## 📝 Tóm Tắt

**Vấn đề:**
- Body field đang dùng **Text** type thay vì **Expression** type
- AppSheet gửi literal string `[ID_PhuHieu]` thay vì giá trị thực tế

**Giải pháp:**
- Chuyển Body field sang **Expression** type
- Dùng expression `CONCATENATE()` hoặc `&` operator để build JSON string
- Đảm bảo expression trả về JSON hợp lệ với giá trị thực tế

**Khuyến nghị:** Dùng **CONCATENATE** expression vì dễ đọc và xử lý giá trị rỗng.
