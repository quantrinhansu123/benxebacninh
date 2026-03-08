# Kết Nối Trực Tiếp Frontend → Supabase

## Tổng Quan

Hiện tại ứng dụng đang dùng kiến trúc:
- **Frontend** → **Backend API** → **Supabase PostgreSQL**

Bạn có thể chuyển sang:
- **Frontend** → **Supabase** (trực tiếp)

## So Sánh: Backend API vs Direct Supabase

### Kiến Trúc Hiện Tại (Backend API)

**Ưu điểm:**
- ✅ Bảo mật tốt hơn (business logic ở backend)
- ✅ Kiểm soát quyền truy cập tốt hơn
- ✅ Validation và xử lý dữ liệu tập trung
- ✅ Có thể cache, rate limiting, logging
- ✅ Không cần Row Level Security (RLS) phức tạp

**Nhược điểm:**
- ❌ Cần maintain backend server
- ❌ Thêm một layer (có thể chậm hơn)
- ❌ Chi phí server (Render.com)

### Kiến Trúc Direct Supabase

**Ưu điểm:**
- ✅ Nhanh hơn (không qua backend)
- ✅ Giảm chi phí (không cần backend server)
- ✅ Real-time subscriptions tự động
- ✅ Supabase tự động generate REST API
- ✅ Có sẵn authentication

**Nhược điểm:**
- ❌ Cần cấu hình Row Level Security (RLS) phức tạp
- ❌ Business logic phải ở frontend (không an toàn)
- ❌ Khó kiểm soát quyền truy cập chi tiết
- ❌ Validation phải làm ở frontend (có thể bị bypass)

## Cài Đặt Supabase Client cho Frontend

### Bước 1: Cài đặt package

```bash
cd client
npm install @supabase/supabase-js
```

### Bước 2: Tạo Supabase Client

Tạo file `client/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Bước 3: Thêm Environment Variables

Thêm vào `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý:** Dùng **Anon Key**, KHÔNG dùng Service Role Key (key này chỉ dùng ở backend).

### Bước 4: Lấy Supabase Credentials

1. Vào Supabase Dashboard
2. Vào **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Ví Dụ Sử Dụng

### Query Data (SELECT)

```typescript
import { supabase } from '@/lib/supabase'

// Lấy danh sách vehicles
const { data: vehicles, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('is_active', true)

// Lấy vehicle theo ID
const { data: vehicle, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .single()

// Join với bảng khác
const { data: badges, error } = await supabase
  .from('vehicle_badges')
  .select(`
    *,
    vehicles:vehicle_id (
      plate_number,
      seat_count
    ),
    operators:operator_id (
      name,
      code
    )
  `)
```

### Insert Data

```typescript
const { data, error } = await supabase
  .from('vehicles')
  .insert({
    plate_number: '99H01234',
    seat_count: 45,
    is_active: true
  })
  .select()
```

### Update Data

```typescript
const { data, error } = await supabase
  .from('vehicles')
  .update({ seat_count: 50 })
  .eq('id', vehicleId)
  .select()
```

### Delete Data

```typescript
const { error } = await supabase
  .from('vehicles')
  .delete()
  .eq('id', vehicleId)
```

### Real-time Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('vehicles-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'vehicles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
channel.unsubscribe()
```

## Cấu Hình Row Level Security (RLS)

**QUAN TRỌNG:** Phải cấu hình RLS để bảo mật dữ liệu!

### Ví dụ RLS Policy

```sql
-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Users chỉ xem vehicles của mình (nếu có user_id)
CREATE POLICY "Users can view own vehicles"
ON vehicles
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admin có thể xem tất cả
CREATE POLICY "Admins can view all vehicles"
ON vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Chỉ admin mới được insert
CREATE POLICY "Only admins can insert vehicles"
ON vehicles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

## Migration từ Backend API sang Direct Supabase

### Ví dụ: Vehicle Service

**Trước (Backend API):**
```typescript
import api from '@/lib/api'

export const vehicleService = {
  getAll: async () => {
    const response = await api.get('/vehicles')
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/vehicles/${id}`)
    return response.data
  },
  
  create: async (data: CreateVehicleInput) => {
    const response = await api.post('/vehicles', data)
    return response.data
  }
}
```

**Sau (Direct Supabase):**
```typescript
import { supabase } from '@/lib/supabase'

export const vehicleService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    return data
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },
  
  create: async (input: CreateVehicleInput) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
```

## Authentication với Supabase

### Đăng nhập

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

if (error) {
  console.error('Login error:', error)
} else {
  // Lưu session
  localStorage.setItem('supabase_session', JSON.stringify(data.session))
}
```

### Lấy user hiện tại

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Đăng xuất

```typescript
await supabase.auth.signOut()
```

## Lưu Ý Quan Trọng

### 1. **Bảo Mật**

- ⚠️ **KHÔNG bao giờ** expose Service Role Key ở frontend
- ✅ Chỉ dùng Anon Key ở frontend
- ✅ Bật RLS cho tất cả tables
- ✅ Tạo policies phù hợp với business logic

### 2. **Performance**

- Supabase có rate limiting (free tier: 500 requests/second)
- Sử dụng `.select()` để chỉ lấy columns cần thiết
- Sử dụng pagination cho large datasets

### 3. **Error Handling**

```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')

if (error) {
  // Handle error
  console.error('Supabase error:', error)
  throw new Error(error.message)
}

return data
```

## Hybrid Approach (Khuyến Nghị)

Có thể kết hợp cả hai:

- **Public data** (read-only) → Direct Supabase
- **Sensitive operations** (write, admin) → Backend API

Ví dụ:
```typescript
// Public read → Supabase (nhanh)
const vehicles = await supabase.from('vehicles').select('*')

// Admin write → Backend API (an toàn)
await api.post('/admin/vehicles', vehicleData)
```

## Kết Luận

**Có thể** kết nối trực tiếp vào Supabase từ frontend, nhưng cần:

1. ✅ Cài đặt `@supabase/supabase-js`
2. ✅ Cấu hình RLS policies
3. ✅ Sử dụng Anon Key (không phải Service Role Key)
4. ✅ Xử lý authentication
5. ✅ Error handling đúng cách

**Khuyến nghị:** Giữ backend API cho các operations quan trọng, chỉ dùng direct Supabase cho read-only public data.
