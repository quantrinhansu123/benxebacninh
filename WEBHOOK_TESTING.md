# Hướng Dẫn Test Webhook AppSheet

## Kiểm Tra Webhook Có Hoạt Động Không

### 1. Kiểm Tra Server Đang Chạy

```bash
# Chạy server
cd server
npm run dev
```

Server phải chạy trên port 3000 (hoặc port bạn đã cấu hình).

### 2. Test Webhook Endpoint Bằng cURL

#### Test Badges Webhook:

```bash
curl -X POST http://localhost:3000/api/webhooks/appsheet/badges \
  -H "Content-Type: application/json" \
  -H "X-AppSheet-Secret: 52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1" \
  -d '{
    "badges": [
      {
        "id": "test_badge_123",
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

#### Test với PowerShell (Windows):

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-AppSheet-Secret" = "52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1"
}

$body = @{
    badges = @(
        @{
            id = "test_badge_123"
            badgeNumber = "TEST-001"
            plateNumber = "99H01234"
            badgeType = "Buýt"
            status = "active"
            issueDate = "2024-01-01"
            expiryDate = "2025-12-31"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/appsheet/badges" -Method POST -Headers $headers -Body $body
```

### 3. Kiểm Tra Logs Trên Server

Khi webhook được gọi, bạn sẽ thấy logs trên console:

```
[Webhook] Received badges webhook: { headers: {...}, bodyKeys: [...] }
[Webhook] Processing 1 badges
[Webhook] Sync successful: { upserted: 1, errors: [] }
```

### 4. Kiểm Tra Database

Sau khi webhook chạy thành công, kiểm tra database:

```sql
-- Kiểm tra badge mới được tạo
SELECT id, firebase_id, badge_number, plate_number, created_at
FROM vehicle_badges
WHERE badge_number = 'TEST-001'
ORDER BY created_at DESC
LIMIT 5;
```

## Troubleshooting

### Vấn đề 1: Webhook không nhận được request

**Kiểm tra:**
1. Server có đang chạy không?
2. URL webhook có đúng không? `http://localhost:3000/api/webhooks/appsheet/badges`
3. AppSheet có gửi request không? (kiểm tra trong AppSheet logs)

**Giải pháp:**
- Đảm bảo server đang chạy
- Kiểm tra firewall/network không chặn request
- Nếu deploy production, đảm bảo URL là HTTPS và public

### Vấn đề 2: Lỗi 401 Unauthorized

**Nguyên nhân:** Secret không khớp

**Kiểm tra:**
1. Secret trong AppSheet: `X-AppSheet-Secret: 52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1`
2. Secret trong `.env`: `APPSHEET_WEBHOOK_SECRET=52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1`
3. Restart server sau khi thay đổi `.env`

**Giải pháp:**
- Đảm bảo secret giống nhau ở cả hai nơi
- Restart server: `npm run dev`

### Vấn đề 3: Lỗi 400 Bad Request - Invalid payload format

**Nguyên nhân:** Format body không đúng

**Kiểm tra:**
- Body phải là JSON
- Phải có trường `badges` là array
- Mỗi badge phải có `id`, `badgeNumber`, `plateNumber`

**Giải pháp:**
- Kiểm tra format body trong AppSheet webhook config
- Đảm bảo body đúng format như trong `APPSHEET_WEBHOOK_CONFIG.md`

### Vấn đề 4: Webhook nhận được nhưng không sync vào database

**Kiểm tra logs:**
```
[Webhook] Processing X badges
[Webhook] Sync successful: { upserted: X, errors: [] }
```

Nếu có errors, xem chi tiết trong logs.

**Giải pháp:**
- Kiểm tra database connection
- Kiểm tra logs để xem lỗi cụ thể
- Đảm bảo các trường bắt buộc được gửi đúng

## Cấu Hình AppSheet Webhook

### Bước 1: Tạo Automation trong AppSheet

1. Vào AppSheet → Automation
2. Tạo Automation mới:
   - **Trigger:** When data changes in PHUHIEUXE
   - **Action:** HTTP Request

### Bước 2: Cấu Hình HTTP Request

**URL:**
```
http://localhost:3000/api/webhooks/appsheet/badges
```
(Thay bằng domain thực tế khi deploy production)

**Method:** POST

**Headers:**
```
X-AppSheet-Secret: 52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1
Content-Type: application/json
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

### Bước 3: Test Automation

1. Tạo hoặc sửa một record trong PHUHIEUXE
2. Kiểm tra logs trên server
3. Kiểm tra database xem record đã được sync chưa

## Kiểm Tra Webhook Đang Hoạt Động

### Health Check Endpoint

```bash
curl http://localhost:3000/api/webhooks/health
```

Response:
```json
{
  "status": "ok",
  "service": "webhook"
}
```

### Xem Logs Real-time

Trên server console, bạn sẽ thấy:
- `[Webhook] Received badges webhook:` - Khi nhận được request
- `[Webhook] Processing X badges` - Đang xử lý
- `[Webhook] Sync successful:` - Thành công
- `[Webhook] Sync failed:` - Lỗi

## Production Deployment

Khi deploy lên production:

1. **Thay đổi URL trong AppSheet:**
   ```
   https://your-domain.com/api/webhooks/appsheet/badges
   ```

2. **Đảm bảo HTTPS:** AppSheet yêu cầu HTTPS cho production

3. **Kiểm tra Environment Variables:**
   - `APPSHEET_WEBHOOK_SECRET` phải được set trong production environment

4. **Test lại:** Test webhook sau khi deploy

## Debug Tips

1. **Thêm logging:**
   - Webhook controller đã có logging sẵn
   - Xem console logs để debug

2. **Test với Postman/Insomnia:**
   - Dùng Postman để test webhook trước khi cấu hình AppSheet

3. **Kiểm tra Network:**
   - Dùng browser DevTools → Network tab để xem request/response

4. **Database Logs:**
   - Kiểm tra database logs nếu có lỗi sync
