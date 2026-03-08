# 🔧 Sửa Lỗi: "value too long for type character varying(10)"

## ❌ Lỗi

```
{"code":"22001","details":null,"hint":null,"message":"value too long for type character varying(10)"}
Status code: BadRequest
```

---

## 🔍 Nguyên Nhân

Lỗi này xảy ra khi bạn gửi dữ liệu có **độ dài > 10 ký tự** vào một cột có giới hạn **VARCHAR(10)**.

Trong bảng `vehicle_badges`, có **2 cột** có giới hạn 10 ký tự:
- `issue_date VARCHAR(10)` - Ngày cấp phép
- `expiry_date VARCHAR(10)` - Ngày hết hạn

---

## ✅ Giải Pháp

### Vấn Đề: Format Date Sai

Các cột `issue_date` và `expiry_date` chỉ chấp nhận format: **YYYY-MM-DD** (10 ký tự)

**Format ĐÚNG:**
```
2024-01-15  ✅ (10 ký tự)
2024-12-31  ✅ (10 ký tự)
```

**Format SAI (gây lỗi):**
```
15/01/2024        ❌ (10 ký tự nhưng format sai)
2024-01-15 10:30  ❌ (17 ký tự - quá dài)
15-01-2024        ❌ (10 ký tự nhưng format sai)
2024/01/15        ❌ (10 ký tự nhưng format sai)
20240115          ❌ (8 ký tự nhưng format sai)
```

---

## 🔧 Cách Sửa Trong AppSheet

### Bước 1: Kiểm Tra Format Date Trong AppSheet

Trong AppSheet, các cột date có thể có format khác nhau:
- `DD/MM/YYYY` (ví dụ: 15/01/2024)
- `MM/DD/YYYY` (ví dụ: 01/15/2024)
- `YYYY-MM-DD` (ví dụ: 2024-01-15) ✅ **ĐÚNG**

### Bước 2: Convert Date Format Trong Body

#### Cách A: Dùng Expression Trong AppSheet

Nếu cột date trong AppSheet là `[NgayCap]` với format `DD/MM/YYYY`:

**Body với expression:**
```json
{
  "firebase_id": [id],
  "badge_number": [SoPhuHieu],
  "plate_number": [BienSo],
  "issue_date": SUBSTITUTE(SUBSTITUTE([NgayCap], "/", "-"), "([0-9]{2})-([0-9]{2})-([0-9]{4})", "$3-$2-$1"),
  "expiry_date": SUBSTITUTE(SUBSTITUTE([NgayHetHan], "/", "-"), "([0-9]{2})-([0-9]{2})-([0-9]{4})", "$3-$2-$1"),
  "source": "appsheet"
}
```

**Hoặc dùng function DATE:**
```
DATE(YEAR([NgayCap]), MONTH([NgayCap]), DAY([NgayCap]))
```

#### Cách B: Format Trong Expression (Đơn giản hơn)

Nếu AppSheet có function format date:

```
FORMAT([NgayCap], "YYYY-MM-DD")
```

#### Cách C: Chỉ Gửi Nếu Date Đúng Format

Nếu không chắc format, có thể bỏ qua date fields:

```json
{
  "firebase_id": [id],
  "badge_number": [SoPhuHieu],
  "plate_number": [BienSo],
  "source": "appsheet"
}
```

**Lưu ý:** `issue_date` và `expiry_date` là **optional** (nullable), có thể bỏ qua.

---

## 📋 Format Đúng Cho Từng Trường

### issue_date và expiry_date

**Format:** `YYYY-MM-DD` (10 ký tự)

**Ví dụ:**
- ✅ `2024-01-15`
- ✅ `2024-12-31`
- ✅ `2025-06-30`

**Không được:**
- ❌ `15/01/2024` (format sai)
- ❌ `2024-01-15 10:30` (quá dài)
- ❌ `15-01-2024` (format sai)

---

## 🧪 Test Format Date

### Test Với PowerShell:

```powershell
# Test với date đúng format
$url = "https://ofdpkojsuuydkhyoeywj.supabase.co/rest/v1/vehicle_badges?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ"
$body = @{
    firebase_id = "TEST-001"
    badge_number = "PH-001"
    plate_number = "99H99999"
    issue_date = "2024-01-15"      # ✅ Đúng format (10 ký tự)
    expiry_date = "2024-12-31"    # ✅ Đúng format (10 ký tự)
    source = "appsheet"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Test thành công với date đúng format!" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Chi tiết: $($_.ErrorDetails.Message)"
    }
}
```

---

## 🔍 Kiểm Tra Dữ Liệu Trong AppSheet

### Xem Format Date Hiện Tại:

1. **Mở AppSheet Editor**
2. **Xem cột date** (ví dụ: `NgayCap`, `NgayHetHan`)
3. **Kiểm tra format:**
   - Nếu là `DD/MM/YYYY` → Cần convert
   - Nếu là `YYYY-MM-DD` → OK, không cần convert

### Convert DD/MM/YYYY → YYYY-MM-DD:

**Trong AppSheet expression:**
```
CONCATENATE(
  RIGHT([NgayCap], 4),           -- Năm (YYYY)
  "-",
  MID([NgayCap], 4, 2),          -- Tháng (MM)
  "-",
  LEFT([NgayCap], 2)             -- Ngày (DD)
)
```

**Ví dụ:**
- Input: `15/01/2024`
- Output: `2024-01-15` ✅

---

## ✅ Checklist

- [ ] Đã kiểm tra format date trong AppSheet
- [ ] Đã convert date từ `DD/MM/YYYY` sang `YYYY-MM-DD` (nếu cần)
- [ ] Đã đảm bảo date có đúng 10 ký tự
- [ ] Đã test và không còn lỗi "value too long"

---

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra lại format:** Đảm bảo là `YYYY-MM-DD` (10 ký tự)
2. **Bỏ qua date fields:** Nếu không chắc, có thể không gửi `issue_date` và `expiry_date`
3. **Xem logs:** Supabase Dashboard → Logs để xem giá trị thực tế được gửi
4. **Test thủ công:** Dùng PowerShell/Postman để test với date đúng format

---

## 📝 Tóm Tắt

**Nguyên nhân:**
- Date format sai hoặc quá dài (> 10 ký tự)

**Giải pháp:**
- Format date phải là `YYYY-MM-DD` (10 ký tự)
- Convert từ `DD/MM/YYYY` sang `YYYY-MM-DD` nếu cần
- Hoặc bỏ qua date fields nếu không chắc

**Format đúng:**
- ✅ `2024-01-15`
- ✅ `2024-12-31`
- ❌ `15/01/2024` (sai format)
- ❌ `2024-01-15 10:30` (quá dài)
