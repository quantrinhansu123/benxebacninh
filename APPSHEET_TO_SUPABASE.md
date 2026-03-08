# Kết Nối Trực Tiếp AppSheet → Supabase

## Tổng Quan

Có thể kết nối AppSheet trực tiếp với Supabase mà không cần backend server. Có 2 cách chính:

1. **AppSheet → Supabase REST API (PostgREST)** - Đơn giản, nhanh
2. **AppSheet → Supabase Edge Functions** - Linh hoạt hơn, có thể xử lý logic

## Cách 1: AppSheet → Supabase REST API (PostgREST)

### Bước 1: Supabase Credentials

**Thông tin Supabase của bạn:**

- **Project URL**: `https://xweufelzukfucqqtknzs.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

> 💡 **Lưu ý:** Để lấy Service Role Key (nếu cần), vào Supabase Dashboard → Settings → API

### Bước 2: Cấu Hình Row Level Security (RLS)

**QUAN TRỌNG:** Phải cấu hình RLS để AppSheet có thể ghi dữ liệu!

#### Option A: Tắt RLS (Chỉ dùng cho development/test)

```sql
-- Tắt RLS cho table vehicle_badges (KHÔNG AN TOÀN!)
ALTER TABLE vehicle_badges DISABLE ROW LEVEL SECURITY;
```

⚠️ **Cảnh báo:** Chỉ dùng cho test! Production phải có RLS.

#### Option B: Tạo RLS Policy cho AppSheet (Khuyến nghị)

Tạo một service account hoặc API key riêng cho AppSheet:

```sql
-- Tạo service role cho AppSheet
-- (Supabase không có service accounts, dùng service_role key)

-- Policy: Cho phép insert từ bất kỳ đâu (nếu có secret key)
CREATE POLICY "AppSheet can insert badges"
ON vehicle_badges
FOR INSERT
WITH CHECK (true);

-- Policy: Cho phép update từ bất kỳ đâu
CREATE POLICY "AppSheet can update badges"
ON vehicle_badges
FOR UPDATE
USING (true)
WITH CHECK (true);
```

**Hoặc dùng Service Role Key** (bypass RLS):
- Service Role Key có thể bypass tất cả RLS
- Chỉ dùng trong môi trường an toàn
- Không expose trong frontend

### Bước 3: Cấu Hình Webhook trong AppSheet

#### URL Webhook:

```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

#### HTTP Verb:
```
POST (cho insert) hoặc PATCH (cho update)
```

#### HTTP Headers:

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
Prefer: return=representation,resolution=merge-duplicates
```

> 💡 **Lưu ý:** Header `Prefer: resolution=merge-duplicates` sẽ tự động upsert (insert hoặc update nếu đã tồn tại)

#### Body Format:

Supabase PostgREST yêu cầu format đặc biệt:

**Insert một record:**
```json
{
  "firebase_id": "[id]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "issue_date": "[NgayCap]",
  "expiry_date": "[NgayHetHan]",
  "status": "[TrangThai]"
}
```

**Insert nhiều records (upsert):**
```json
[
  {
    "firebase_id": "[id]",
    "badge_number": "[SoPhuHieu]",
    "plate_number": "[BienSo]",
    ...
  },
  {
    "firebase_id": "[id2]",
    "badge_number": "[SoPhuHieu2]",
    ...
  }
]
```

**Upsert (insert hoặc update nếu đã tồn tại):**
Thêm header:
```
Prefer: resolution=merge-duplicates
```

Và dùng `PATCH` method với unique column trong URL:
```
PATCH https://YOUR-PROJECT.supabase.co/rest/v1/vehicle_badges?firebase_id=eq.[id]
```

### Bước 4: Mapping AppSheet Columns → Supabase Columns

| AppSheet Column | Supabase Column | Type | Notes |
|----------------|-----------------|------|-------|
| `[id]` | `firebase_id` | varchar(100) | AppSheet ID |
| `[SoPhuHieu]` | `badge_number` | varchar(50) | Số phù hiệu |
| `[BienSo]` | `plate_number` | varchar(20) | Biển số (normalize) |
| `[LoaiPH]` | `badge_type` | varchar(50) | Loại phù hiệu |
| `[NgayCap]` | `issue_date` | varchar(10) | YYYY-MM-DD |
| `[NgayHetHan]` | `expiry_date` | varchar(10) | YYYY-MM-DD |
| `[TrangThai]` | `status` | varchar(50) | Trạng thái |

### Bước 5: Body Template trong AppSheet

```json
{
  "firebase_id": "[id]",
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  "badge_type": "[LoaiPH]",
  "issue_date": "[NgayCap]",
  "expiry_date": "[NgayHetHan]",
  "status": "[TrangThai]",
  "source": "appsheet",
  "synced_at": "{{NOW()}}"
}
```

## Cách 2: AppSheet → Supabase Edge Functions

Edge Functions cho phép xử lý logic phức tạp hơn.

### Bước 1: Tạo Edge Function

Tạo file `supabase/functions/appsheet-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook secret
    const webhookSecret = Deno.env.get('APPSHEET_WEBHOOK_SECRET')
    const receivedSecret = req.headers.get('x-appsheet-secret')
    
    if (webhookSecret && receivedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse body
    const payload = await req.json()
    const badges = Array.isArray(payload) ? payload : payload.badges || []

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Normalize and upsert badges
    const normalizedBadges = badges.map((b: any) => ({
      firebase_id: b.id,
      badge_number: b.badgeNumber || b.SoPhuHieu,
      plate_number: (b.plateNumber || b.BienSo || '').replace(/[\s.\-]/g, '').toUpperCase(),
      badge_type: b.badgeType || b.LoaiPH,
      issue_date: b.issueDate || b.NgayCap,
      expiry_date: b.expiryDate || b.NgayHetHan,
      status: b.status || b.TrangThai || 'active',
      source: 'appsheet',
      synced_at: new Date().toISOString(),
    }))

    // Upsert to database
    const { data, error } = await supabase
      .from('vehicle_badges')
      .upsert(normalizedBadges, {
        onConflict: 'firebase_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ upserted: data.length, badges: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Bước 2: Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy appsheet-webhook
```

### Bước 3: Cấu Hình Webhook trong AppSheet

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/functions/v1/appsheet-webhook
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
X-AppSheet-Secret: your-webhook-secret
```

**Body:**
```json
{
  "badges": [
    {
      "id": "[id]",
      "badgeNumber": "[SoPhuHieu]",
      "plateNumber": "[BienSo]",
      "badgeType": "[LoaiPH]",
      "issueDate": "[NgayCap]",
      "expiryDate": "[NgayHetHan]",
      "status": "[TrangThai]"
    }
  ]
}
```

## So Sánh 2 Cách

| Tiêu chí | PostgREST (Cách 1) | Edge Functions (Cách 2) |
|---------|-------------------|------------------------|
| **Độ phức tạp** | Đơn giản | Phức tạp hơn |
| **Tốc độ** | Rất nhanh | Nhanh |
| **Logic xử lý** | Không có | Có thể xử lý logic |
| **Validation** | Phải làm ở DB | Có thể validate trong function |
| **Normalization** | Phải làm ở AppSheet | Có thể normalize trong function |
| **Error handling** | Hạn chế | Linh hoạt |
| **Cost** | Free | Free (có giới hạn) |

## Khuyến Nghị

### Dùng PostgREST (Cách 1) nếu:
- ✅ Data format đơn giản
- ✅ Không cần xử lý logic phức tạp
- ✅ Muốn setup nhanh

### Dùng Edge Functions (Cách 2) nếu:
- ✅ Cần normalize data
- ✅ Cần validation phức tạp
- ✅ Cần xử lý business logic
- ✅ Cần error handling tốt hơn

## Ví Dụ Cấu Hình AppSheet Webhook (PostgREST)

### URL:
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

### Method:
```
POST
```

### Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
Content-Type: application/json
Prefer: return=representation,resolution=merge-duplicates
```

### Body:
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

## Upsert (Insert hoặc Update)

Để upsert (insert nếu chưa có, update nếu đã có), dùng:

### Method: PATCH với filter

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges?firebase_id=eq.[id]
```

**Headers:**
```
Prefer: resolution=merge-duplicates
```

**Body:**
```json
{
  "badge_number": "[SoPhuHieu]",
  "plate_number": "[BienSo]",
  ...
}
```

Hoặc dùng **UPSERT** với conflict target:

**URL:**
```
https://xweufelzukfucqqtknzs.supabase.co/rest/v1/vehicle_badges
```

**Headers:**
```
Prefer: resolution=merge-duplicates
```

**Body:**
```json
{
  "firebase_id": "[id]",
  "badge_number": "[SoPhuHieu]",
  ...
}
```

Supabase sẽ tự động upsert dựa trên unique constraint của `firebase_id`.

## Troubleshooting

### Lỗi: 401 Unauthorized

**Nguyên nhân:** Key không đúng hoặc RLS chặn

**Giải pháp:**
- Kiểm tra key có đúng không
- Kiểm tra RLS policies
- Thử dùng Service Role Key (chỉ cho test)

### Lỗi: 400 Bad Request

**Nguyên nhân:** Format body không đúng

**Giải pháp:**
- Kiểm tra column names có đúng không
- Kiểm tra data types
- Kiểm tra required fields

### Lỗi: 409 Conflict

**Nguyên nhân:** Unique constraint violation

**Giải pháp:**
- Dùng PATCH thay vì POST
- Hoặc dùng upsert với `Prefer: resolution=merge-duplicates`

## Lưu Ý Bảo Mật

1. **Service Role Key:**
   - ⚠️ Có thể bypass tất cả RLS
   - ⚠️ Chỉ dùng trong môi trường an toàn
   - ⚠️ Không expose trong frontend hoặc public

2. **Anon Key:**
   - ✅ An toàn hơn (phải có RLS)
   - ✅ Cần cấu hình RLS policies đúng
   - ✅ Có thể dùng cho public operations

3. **Webhook Secret:**
   - ✅ Luôn verify secret trong Edge Functions
   - ✅ Không verify trong PostgREST (phải dùng RLS)

## Kết Luận

Có thể kết nối AppSheet trực tiếp với Supabase qua:
1. **PostgREST API** - Đơn giản, nhanh
2. **Edge Functions** - Linh hoạt, có thể xử lý logic

Chọn cách phù hợp với nhu cầu của bạn!
