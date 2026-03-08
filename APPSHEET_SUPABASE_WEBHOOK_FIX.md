# 🔧 Sửa Lỗi: "No API key found in request" khi đấu Webhook AppSheet → Supabase

## ❌ Lỗi Hiện Tại

```
Failed: Webhook HTTP request failed with exception 
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}  
Status code: Unauthorized
```

## ✅ Nguyên Nhân

Supabase PostgREST API **BẮT BUỘC** phải có 2 headers:
1. `apikey` - Supabase anon key hoặc service role key
2. `Authorization` - Bearer token với cùng key

## 🔧 Cách Sửa Trong AppSheet

### Bước 1: Lấy Supabase Credentials

**Supabase Project URL:**
```
https://xweufelzukfucqqtknzs.supabase.co
```

**Supabase Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

> 💡 **Lưu ý:** Để lấy key mới, vào Supabase Dashboard → Settings → API → `anon` `public` key

### Bước 2: Cấu Hình Webhook trong AppSheet

#### 2.1. Vào AppSheet Editor → Data → Webhooks

#### 2.2. Tạo Webhook mới hoặc Edit webhook hiện tại

#### 2.3. Cấu Hình URL

**Cho table `vehicle_badges` (phù hiệu xe):**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

**Cho table `vehicles` (xe):**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicles
```

**Cho table `routes` (tuyến):**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/routes
```

**Cho table `operators` (đơn vị vận tải):**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/operators
```

#### 2.4. Cấu Hình HTTP Method

- **POST** - Cho insert mới
- **PATCH** - Cho update (cần thêm query param `?id=eq.[id]`)

#### 2.5. ⚠️ QUAN TRỌNG: Thêm HTTP Headers

Trong AppSheet, bạn **PHẢI** thêm các headers sau:

**Header 1: `apikey`**
```
    apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

**Header 2: `Authorization`**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

**Header 3: `Content-Type`**
```
Content-Type: application/json
```

**Header 4: `Prefer` (tùy chọn - cho upsert)**
```
Prefer: return=representation,resolution=merge-duplicates
```

### Bước 3: Cách Thêm Headers trong AppSheet

#### Option A: AppSheet Webhook Settings (Nếu có)

1. Vào **Data** → **Webhooks**
2. Chọn webhook của bạn
3. Tìm phần **HTTP Headers** hoặc **Custom Headers**
4. Thêm từng header:
   - Key: `apikey`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key)

   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key với prefix "Bearer ")

   - Key: `Content-Type`
   - Value: `application/json`

#### Option B: Sử dụng AppSheet Action với HTTP Request

Nếu webhook settings không có phần headers, dùng **Action** với **HTTP Request**:

1. Tạo **Action** mới
2. Chọn **HTTP Request**
3. Cấu hình:
   - **URL**: `https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges`
   - **Method**: `POST`
   - **Headers**: Thêm như sau:
     ```
     apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
     Content-Type: application/json
     ```
   - **Body**: JSON với data từ AppSheet

### Bước 4: Body Format

**Cho table `vehicle_badges`:**

```json
{
  "firebase_id": "[id]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "issue_date": "[NgayCap]",
  "expiry_date": "[NgayHetHan]",
  "status": "[TrangThai]",
  "source": "appsheet"
}
```

**Cho nhiều records (array):**

```json
[
  {
    "firebase_id": "[id1]",
    "badge_number": "[SoPhuHieu1]",
    "plate_number": "[BienSo1]",
    ...
  },
  {
    "firebase_id": "[id2]",
    "badge_number": "[SoPhuHieu2]",
    "plate_number": "[BienSo2]",
    ...
  }
]
```

### Bước 5: Test Webhook

#### Test bằng PowerShell:

```powershell
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$body = @{
    firebase_id = "TEST-001"
    badge_number = "PH-001"
    plate_number = "99H01234"
    badge_type = "Buýt"
    status = "active"
    source = "appsheet"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ($_.ErrorDetails.Message)
}
```

#### Test bằng cURL:

```bash
curl -X POST "https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "firebase_id": "TEST-001",
    "badge_number": "PH-001",
    "plate_number": "99H01234",
    "badge_type": "Buýt",
    "status": "active",
    "source": "appsheet"
  }'
```

## 🔒 Row Level Security (RLS)

**QUAN TRỌNG:** Nếu vẫn gặp lỗi sau khi thêm headers, có thể do RLS (Row Level Security) đang chặn.

### Option 1: Tắt RLS (Chỉ cho development/test)

```sql
-- ⚠️ CHỈ DÙNG CHO TEST!
ALTER TABLE vehicle_badges DISABLE ROW LEVEL SECURITY;
```

### Option 2: Tạo RLS Policy cho AppSheet

```sql
-- Cho phép insert từ bất kỳ đâu (nếu có anon key)
CREATE POLICY "Allow AppSheet inserts"
ON vehicle_badges
FOR INSERT
TO anon
WITH CHECK (true);

-- Cho phép update từ bất kỳ đâu
CREATE POLICY "Allow AppSheet updates"
ON vehicle_badges
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

### Option 3: Dùng Service Role Key (Bypass RLS)

Nếu cần bypass RLS hoàn toàn:
1. Vào Supabase Dashboard → Settings → API
2. Copy **`service_role`** key (KHÔNG phải `anon` key)
3. Dùng key này trong headers (thay vì anon key)

⚠️ **Cảnh báo:** Service role key có quyền cao, chỉ dùng trong môi trường an toàn!

## 📋 Checklist

- [ ] Đã thêm header `apikey` với Supabase anon key
- [ ] Đã thêm header `Authorization` với format `Bearer <key>`
- [ ] Đã thêm header `Content-Type: application/json`
- [ ] URL đúng format: `https://<project>.supabase.co/rest/v1/<table_name>`
- [ ] Body format đúng với schema Supabase
- [ ] Đã test bằng PowerShell/cURL
- [ ] Đã cấu hình RLS policy (nếu cần)

## 🆘 Vẫn Gặp Lỗi?

1. **Kiểm tra Supabase Dashboard → Logs** để xem lỗi chi tiết
2. **Kiểm tra table name** có đúng không (snake_case: `vehicle_badges`)
3. **Kiểm tra column names** có khớp với schema không
4. **Test với Postman/Insomnia** để verify headers đúng
5. **Kiểm tra RLS policies** trong Supabase Dashboard → Authentication → Policies
