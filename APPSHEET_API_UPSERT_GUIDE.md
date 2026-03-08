# 🔧 Hướng Dẫn: Dùng API để Insert và Update (Upsert)

## 📋 Tổng Quan

Thay vì gọi trực tiếp Supabase từ AppSheet, bạn có thể dùng **Backend API** để xử lý cả **INSERT** và **UPDATE** (upsert) một cách tự động.

**Lợi ích:**
- ✅ Tự động xử lý insert hoặc update (không cần logic phức tạp trong AppSheet)
- ✅ Xử lý validation, error handling tập trung
- ✅ Có thể thêm business logic (audit log, cache invalidation, etc.)
- ✅ Bảo mật hơn (không expose Supabase credentials)

---

## 🎯 Giải Pháp 1: Dùng Endpoint Hiện Có (Khuyến nghị)

### Endpoint: `/api/webhooks/appsheet/badges`

Endpoint này đã có sẵn và xử lý upsert tự động.

#### Cấu hình trong AppSheet:

1. **HTTP Verb:** POST

2. **HTTP Headers:**
   ```
   Content-Type: application/json
   ```
   **Lưu ý:** Không cần Supabase API key (backend sẽ xử lý)

3. **Webhook URL:**
   ```
   http://your-backend-url/api/webhooks/appsheet/badges
   ```
   Hoặc nếu deploy:
   ```
   https://your-domain.com/api/webhooks/appsheet/badges
   ```

4. **Body (Expression):**
   ```
   "[{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}]"
   ```
   
   **Lưu ý:** Body phải là **array** (có dấu ngoặc vuông `[]`)

---

## 🎯 Giải Pháp 2: Tạo Endpoint Mới Đơn Giản Hơn

Nếu endpoint hiện có quá phức tạp, bạn có thể tạo endpoint mới đơn giản hơn.

### Tạo File: `server/src/controllers/appsheet-badge-upsert.controller.ts`

```typescript
import { Request, Response } from 'express'
import { vehicleBadges } from '../../db/schema/vehicle-badges.js'
import { db } from '../../db/drizzle.js'
import { eq } from 'drizzle-orm'

interface BadgePayload {
  firebase_id: string
  badge_number?: string
  plate_number?: string
  badge_type?: string
  route_code?: string
  route_name?: string
  issue_date?: string
  expiry_date?: string
  status?: string
  source?: string
}

/**
 * POST /api/appsheet/badges/upsert
 * Upsert badge từ AppSheet (tự động insert hoặc update)
 */
export async function upsertBadgeFromAppSheet(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const payload = req.body as BadgePayload | BadgePayload[]
    const badges = Array.isArray(payload) ? payload : [payload]

    if (badges.length === 0) {
      return res.status(400).json({ error: 'Badge data required' })
    }

    const results = []
    const errors = []

    for (const badge of badges) {
      try {
        // Validate required field
        if (!badge.firebase_id) {
          errors.push('Missing firebase_id')
          continue
        }

        // Check if badge exists
        const [existing] = await db
          .select()
          .from(vehicleBadges)
          .where(eq(vehicleBadges.firebaseId, badge.firebase_id))
          .limit(1)

        if (existing) {
          // UPDATE existing badge
          const [updated] = await db
            .update(vehicleBadges)
            .set({
              badgeNumber: badge.badge_number || existing.badgeNumber,
              plateNumber: badge.plate_number || existing.plateNumber,
              badgeType: badge.badge_type || existing.badgeType,
              routeCode: badge.route_code || existing.routeCode,
              routeName: badge.route_name || existing.routeName,
              issueDate: badge.issue_date || existing.issueDate,
              expiryDate: badge.expiry_date || existing.expiryDate,
              status: badge.status || existing.status,
              source: badge.source || existing.source,
              updatedAt: new Date(),
            })
            .where(eq(vehicleBadges.firebaseId, badge.firebase_id))
            .returning()

          results.push({
            action: 'updated',
            firebase_id: badge.firebase_id,
            data: updated,
          })
        } else {
          // INSERT new badge
          const [inserted] = await db
            .insert(vehicleBadges)
            .values({
              firebaseId: badge.firebase_id,
              badgeNumber: badge.badge_number || null,
              plateNumber: badge.plate_number || null,
              badgeType: badge.badge_type || null,
              routeCode: badge.route_code || null,
              routeName: badge.route_name || null,
              issueDate: badge.issue_date || null,
              expiryDate: badge.expiry_date || null,
              status: badge.status || 'active',
              source: badge.source || 'appsheet',
            })
            .returning()

          results.push({
            action: 'inserted',
            firebase_id: badge.firebase_id,
            data: inserted,
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Badge ${badge.firebase_id}: ${msg}`)
      }
    }

    return res.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    })
  } catch (error) {
    console.error('[appsheet-badge-upsert] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
```

### Thêm Route: `server/src/routes/appsheet.routes.ts`

```typescript
import { Router } from 'express'
import { upsertBadgeFromAppSheet } from '../controllers/appsheet-badge-upsert.controller.js'

const router = Router()

// Upsert badge từ AppSheet (tự động insert hoặc update)
router.post('/badges/upsert', upsertBadgeFromAppSheet)

export default router
```

### Đăng ký Route: `server/src/app.ts` hoặc `server/src/index.ts`

```typescript
import appsheetRoutes from './routes/appsheet.routes.js'

// ... existing code ...

app.use('/api/appsheet', appsheetRoutes)
```

---

## 🔧 Cấu Hình Trong AppSheet

### Option A: Dùng Endpoint Hiện Có (`/api/webhooks/appsheet/badges`)

1. **HTTP Verb:** POST
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   Content-Type: application/json
   ```
4. **Webhook URL:**
   ```
   http://localhost:3000/api/webhooks/appsheet/badges
   ```
   Hoặc nếu deploy:
   ```
   https://your-domain.com/api/webhooks/appsheet/badges
   ```
5. **Body (Expression - Array):**
   ```
   "[{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}]"
   ```

### Option B: Dùng Endpoint Mới (`/api/appsheet/badges/upsert`)

1. **HTTP Verb:** POST
2. **HTTP Content Type:** JSON
3. **HTTP Headers:**
   ```
   Content-Type: application/json
   ```
4. **Webhook URL:**
   ```
   http://localhost:3000/api/appsheet/badges/upsert
   ```
   Hoặc nếu deploy:
   ```
   https://your-domain.com/api/appsheet/badges/upsert
   ```
5. **Body (Expression - Single Object hoặc Array):**
   
   **Single Object:**
   ```
   "{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}"
   ```
   
   **Array (nếu muốn gửi nhiều records):**
   ```
   "[{""firebase_id"": """ & [ID_PhuHieu] & """, ""badge_number"": """ & [SoPhuHieu] & """, ""plate_number"": """ & [BienSo] & """, ""source"": ""appsheet""}]"
   ```

---

## 📋 So Sánh 2 Cách

| | Endpoint Hiện Có | Endpoint Mới |
|---|---|---|
| **URL** | `/api/webhooks/appsheet/badges` | `/api/appsheet/badges/upsert` |
| **Body Format** | Array (bắt buộc) | Object hoặc Array |
| **Validation** | Nhiều (normalize, FK resolution) | Đơn giản (chỉ required fields) |
| **Performance** | Batch processing (1000 records/chunk) | Single hoặc small batch |
| **Use Case** | Sync nhiều records từ AppSheet | Single record hoặc vài records |

---

## ✅ Checklist

- [ ] Đã chọn endpoint (hiện có hoặc mới)
- [ ] Đã cấu hình webhook URL trong AppSheet
- [ ] Đã test với record mới (insert)
- [ ] Đã test với record cũ (update)
- [ ] Đã xác nhận không có duplicate records

---

## 🧪 Test

### Test 1: Insert Record Mới

```bash
curl -X POST http://localhost:3000/api/appsheet/badges/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_id": "TEST-API-001",
    "badge_number": "PH-API-001",
    "plate_number": "99A99999",
    "source": "appsheet"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "processed": 1,
  "results": [
    {
      "action": "inserted",
      "firebase_id": "TEST-API-001",
      "data": { ... }
    }
  ]
}
```

### Test 2: Update Record Cũ

```bash
curl -X POST http://localhost:3000/api/appsheet/badges/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_id": "TEST-API-001",
    "badge_number": "PH-API-001-UPDATED",
    "plate_number": "99A99999",
    "source": "appsheet"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "processed": 1,
  "results": [
    {
      "action": "updated",
      "firebase_id": "TEST-API-001",
      "data": { ... }
    }
  ]
}
```

---

## 🆘 Troubleshooting

1. **Lỗi 404 Not Found:**
   - Kiểm tra URL endpoint có đúng không
   - Kiểm tra route đã được đăng ký chưa

2. **Lỗi 400 Bad Request:**
   - Kiểm tra Body format (phải là JSON)
   - Kiểm tra required fields (`firebase_id`)

3. **Lỗi 500 Internal Server Error:**
   - Kiểm tra database connection
   - Kiểm tra server logs

---

## 📝 Tóm Tắt

**Giải pháp:**
- **Option 1:** Dùng endpoint hiện có `/api/webhooks/appsheet/badges` (phức tạp hơn, nhưng đã có sẵn)
- **Option 2:** Tạo endpoint mới `/api/appsheet/badges/upsert` (đơn giản hơn, dễ customize)

**Khuyến nghị:** 
- Nếu chỉ cần upsert đơn giản → Dùng Option 2
- Nếu cần normalize data, FK resolution → Dùng Option 1

**Lợi ích:**
- ✅ Tự động xử lý insert hoặc update
- ✅ Không cần logic phức tạp trong AppSheet
- ✅ Bảo mật hơn (không expose Supabase credentials)
