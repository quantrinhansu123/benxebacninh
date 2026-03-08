# Hướng Dẫn Đấu Webhook từ AppSheet

## 📋 Tổng Quan

Hệ thống đã có sẵn các webhook endpoints để nhận data từ AppSheet:
- ✅ `/api/webhooks/appsheet/badges` - Phù hiệu xe
- ✅ `/api/webhooks/appsheet/vehicles` - Xe
- ✅ `/api/webhooks/appsheet/routes` - Tuyến
- ✅ `/api/webhooks/appsheet/operators` - Đơn vị vận tải

## 🔧 Bước 1: Tạo Webhook Secret

### Tạo secret key mới:

```bash
# Tạo secret 32 bytes (64 ký tự hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Kết quả ví dụ:** `938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9`

### Thêm vào file `server/.env`:

```env
APPSHEET_WEBHOOK_SECRET=938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9
```

**⚠️ Lưu ý:** 
- Secret này dùng để **verify** webhook requests từ AppSheet
- **KHÔNG phải** AppSheet API key
- Giữ bí mật, không commit vào git

## 🌐 Bước 2: Cấu Hình Webhook URL

### Development (Local):
```
http://localhost:3000/api/webhooks/appsheet/badges
```

### Production:
```
https://your-domain.com/api/webhooks/appsheet/badges
```

**⚠️ Production bắt buộc dùng HTTPS!**

## 📱 Bước 3: Cấu Hình trong AppSheet

AppSheet có thể gửi webhook qua nhiều cách:

### Cách 1: AppSheet Automation (Nếu có)

1. Vào **AppSheet** → **Automation** → **New Automation**
2. **Trigger:** Chọn "When data changes" → Chọn table (ví dụ: PHUHIEUXE)
3. **Action:** Chọn "HTTP Request" hoặc "Webhook"
4. Cấu hình:

```
Method: POST
URL: https://your-domain.com/api/webhooks/appsheet/badges
Headers:
  Content-Type: application/json
  X-AppSheet-Secret: 938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9
Body Template:
{
  "badges": [{{ChangedRows}}]
}
```

### Cách 2: AppSheet Actions (Custom Code)

Nếu AppSheet hỗ trợ custom actions, tạo action:

```javascript
// AppSheet Action: OnSubmit hoặc OnChange
function OnSubmit() {
  var webhookUrl = "https://your-domain.com/api/webhooks/appsheet/badges";
  var secret = "938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9";
  
  // Lấy data từ current row hoặc changed rows
  var badgeData = {
    badgeNumber: [SoPhuHieu],
    plateNumber: [BienSo],
    badgeType: [LoaiPH],
    status: [TrangThai],
    issueDate: [NgayCap],
    expiryDate: [NgayHetHan]
  };
  
  var response = HTTPRequest(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AppSheet-Secret": secret
    },
    body: JSON.stringify({ badges: [badgeData] })
  });
  
  return response;
}
```

### Cách 3: Zapier/Make.com Integration

1. Tạo Zap/Scenario mới
2. **Trigger:** AppSheet → "New/Updated Row"
3. **Action:** Webhook → POST
4. Cấu hình URL và headers như trên

### Cách 4: AppSheet API với Scheduled Jobs

Nếu AppSheet không hỗ trợ webhook trực tiếp, có thể dùng scheduled job:

```javascript
// Chạy định kỳ (ví dụ: mỗi 5 phút)
// Lấy rows mới/changed và POST đến webhook
var changedRows = FILTER([PHUHIEUXE], [LastModified] > NOW() - 5);
HTTPRequest(webhookUrl, {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({ badges: changedRows })
});
```

## 📝 Bước 4: Format Data AppSheet Gửi

Webhook controller hỗ trợ **4 formats** khác nhau:

### Format 1: Array trực tiếp
```json
[
  {
    "badgeNumber": "001",
    "plateNumber": "99H01234",
    "badgeType": "Buýt",
    "status": "active"
  }
]
```

### Format 2: Object với key `badges`
```json
{
  "badges": [
    {
      "badgeNumber": "001",
      "plateNumber": "99H01234"
    }
  ]
}
```

### Format 3: Object với key `data`
```json
{
  "data": [
    {
      "badgeNumber": "001",
      "plateNumber": "99H01234"
    }
  ]
}
```

### Format 4: AppSheet API format
```json
{
  "Rows": [
    {
      "SoPhuHieu": "001",
      "BienSo": "99H01234",
      "LoaiPH": "Buýt"
    }
  ]
}
```

**Lưu ý:** Controller sẽ tự động detect và parse đúng format!

## 🧪 Bước 5: Test Webhook

### Test bằng script có sẵn:

```bash
cd server
npm run test-webhook
```

Hoặc:

```bash
cd server
npx tsx src/scripts/test-webhook.ts
```

### Test bằng curl:

```bash
curl -X POST http://localhost:3000/api/webhooks/appsheet/badges \
  -H "Content-Type: application/json" \
  -H "X-AppSheet-Secret: 938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9" \
  -d '{
    "badges": [
      {
        "badgeNumber": "TEST-001",
        "plateNumber": "99H01234",
        "badgeType": "Buýt",
        "status": "active",
        "issueDate": "2024-01-01",
        "expiryDate": "2025-12-31"
      }
    ]
  }'
```

### Test bằng PowerShell:

```powershell
$body = @{
    badges = @(
        @{
            badgeNumber = "TEST-001"
            plateNumber = "99H01234"
            badgeType = "Buýt"
            status = "active"
            issueDate = "2024-01-01"
            expiryDate = "2025-12-31"
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/appsheet/badges" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "X-AppSheet-Secret" = "938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9"
  } `
  -Body $body
```

### Test bằng Postman:

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/webhooks/appsheet/badges`
3. **Headers:**
   - `Content-Type: application/json`
   - `X-AppSheet-Secret: 938dad9ccb890bd954a3eccb63d00b29c3971babfeb9b0e47b314768c1573eb9`
4. **Body (raw JSON):**
```json
{
  "badges": [
    {
      "badgeNumber": "TEST-001",
      "plateNumber": "99H01234",
      "badgeType": "Buýt",
      "status": "active"
    }
  ]
}
```

## ✅ Bước 6: Xác Minh Webhook Hoạt Động

### 1. Kiểm tra Server Logs:

Khi webhook được gọi, bạn sẽ thấy logs:

```
[Webhook] Received badges webhook: { headers: {...}, bodyKeys: ['badges'] }
[Webhook] Processing 1 badges
[Webhook] Sync successful: { upserted: 1, errors: [] }
```

### 2. Kiểm tra Database:

```sql
-- Kiểm tra badge đã được tạo
SELECT * FROM vehicle_badges 
WHERE badge_number = 'TEST-001';
```

### 3. Kiểm tra Response:

Webhook sẽ trả về:

```json
{
  "upserted": 1,
  "errors": []
}
```

## 🔐 Bước 7: Bảo Mật Webhook

### 1. Verify Secret (Đã có sẵn)

Controller tự động verify secret:
```typescript
if (webhookSecret && receivedSecret !== webhookSecret) {
  return res.status(401).json({ error: 'Invalid webhook secret' })
}
```

### 2. Rate Limiting (Nên thêm)

Có thể thêm rate limiting middleware:

```typescript
import rateLimit from 'express-rate-limit'

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: 'Too many webhook requests'
})

router.post('/appsheet/badges', webhookLimiter, appsheetBadgesWebhook)
```

### 3. IP Whitelist (Nếu có AppSheet IPs)

```typescript
const ALLOWED_IPS = ['1.2.3.4', '5.6.7.8'] // AppSheet IPs

app.use('/api/webhooks', (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress
  if (!ALLOWED_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'IP not allowed' })
  }
  next()
})
```

## 📊 Mapping AppSheet Columns → Database

### Badges (PHUHIEUXE):

| AppSheet Column | Database Column | Notes |
|----------------|-----------------|-------|
| `SoPhuHieu` | `badge_number` | Số phù hiệu |
| `BienSo` | `plate_number` | Biển số (auto normalize) |
| `LoaiPH` | `badge_type` | Loại phù hiệu |
| `NgayCap` | `issue_date` | Ngày cấp (YYYY-MM-DD) |
| `NgayHetHan` | `expiry_date` | Ngày hết hạn |
| `TrangThai` | `status` | Trạng thái |
| `MauPhuHieu` | `badge_color` (metadata) | Màu phù hiệu |
| `MaHoSo` | `file_number` (metadata) | Mã hồ sơ |

### Vehicles (XE):

| AppSheet Column | Database Column |
|----------------|-----------------|
| `BienSo` | `plate_number` |
| `SoGhe` | `seat_count` |
| `LoaiXe` | `vehicle_type` |
| `TenDangKyXe` | `metadata.registration_name` |

## 🚀 Production Setup

### 1. Domain và HTTPS:

```
https://your-production-domain.com/api/webhooks/appsheet/badges
```

**Bắt buộc dùng HTTPS!**

### 2. Environment Variables:

```env
# Production .env
APPSHEET_WEBHOOK_SECRET=production-secret-key-here
NODE_ENV=production
```

### 3. Monitoring:

Theo dõi webhook logs:
```bash
# Xem webhook logs
tail -f server.log | grep "\[Webhook\]"
```

## 🔄 Kết Hợp Polling + Webhook

Có thể dùng cả hai:

1. **Webhook** cho real-time updates (khi AppSheet hỗ trợ)
2. **Polling** làm backup (giảm tần suất xuống 5 phút)

```typescript
// Trong useAppSheetPolling
const interval = webhookEnabled ? 300_000 : 10_000 // 5 phút vs 10 giây
```

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized:
- ✅ Kiểm tra `X-AppSheet-Secret` header có đúng không
- ✅ Kiểm tra `APPSHEET_WEBHOOK_SECRET` trong `.env`
- ✅ Restart server sau khi thêm env variable

### Lỗi 400 Bad Request:
- ✅ Kiểm tra format data AppSheet gửi
- ✅ Xem server logs để biết format cụ thể
- ✅ Đảm bảo data là array hoặc object có key `badges`/`data`/`Rows`

### Data không sync vào DB:
- ✅ Kiểm tra server logs: `[Webhook] Sync successful`
- ✅ Kiểm tra database connection
- ✅ Kiểm tra data format có đúng schema không

### Webhook không nhận được:
- ✅ Kiểm tra firewall/network
- ✅ Kiểm tra URL có đúng không
- ✅ Test bằng curl/Postman trước
- ✅ Kiểm tra AppSheet có gửi được webhook không

## 📋 Checklist Setup

- [ ] Tạo `APPSHEET_WEBHOOK_SECRET` và thêm vào `server/.env`
- [ ] Restart backend server
- [ ] Test webhook bằng script/curl/Postman
- [ ] Cấu hình webhook trong AppSheet (Automation/Actions)
- [ ] Test với data thật từ AppSheet
- [ ] Kiểm tra data đã sync vào database
- [ ] Setup production URL (HTTPS)
- [ ] Monitor webhook logs

## 🎯 Tóm Tắt

**Webhook Endpoints:**
- `POST /api/webhooks/appsheet/badges`
- `POST /api/webhooks/appsheet/vehicles`
- `POST /api/webhooks/appsheet/routes`
- `POST /api/webhooks/appsheet/operators`

**Headers cần thiết:**
- `Content-Type: application/json`
- `X-AppSheet-Secret: {your-secret}`

**Body format:**
- `{ badges: [...] }` hoặc `[...]` hoặc `{ Rows: [...] }`

**Lợi ích:**
- ✅ Real-time data sync
- ✅ Tiết kiệm tài nguyên
- ✅ Giảm delay
