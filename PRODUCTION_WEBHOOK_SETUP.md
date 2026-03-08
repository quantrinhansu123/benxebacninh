# Cấu Hình Webhook Production - AppSheet

## Thông Tin Deployment

- **Frontend:** https://benxebacninh-client.vercel.app
- **Backend:** Cần xác định URL backend production

## Bước 1: Xác Định Backend URL

### Nếu Backend Deploy trên Render.com:

1. Vào Render.com dashboard
2. Tìm service `ben-xe-backend`
3. Copy URL (ví dụ: `https://ben-xe-backend.onrender.com`)

### Nếu Backend Deploy ở nơi khác:

- Railway: `https://your-app.railway.app`
- Heroku: `https://your-app.herokuapp.com`
- VPS: `https://your-domain.com`

## Bước 2: Cấu Hình Webhook trong AppSheet

### URL Webhook:

```
https://YOUR-BACKEND-URL/api/webhooks/appsheet/badges
```

**Ví dụ:**
```
https://ben-xe-backend.onrender.com/api/webhooks/appsheet/badges
```

### HTTP Verb:
```
POST
```

### HTTP Content Type:
```
JSON
```

### HTTP Headers:
```
X-AppSheet-Secret: 52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1
```

### Body:
```json
{
  "badges": [
    {
      "id": "[id]",
      "badgeNumber": "[SoPhuHieu]",
      "plateNumber": "[BienSo]",
      "badgeType": "[LoaiPH]",
      "fileNumber": "[MaHoSo]",
      "operatorRef": "[Ref_DonViCapPhuHieu]",
      "issueDate": "[NgayCap]",
      "expiryDate": "[NgayHetHan]",
      "status": "[TrangThai]",
      "badgeColor": "[MauPhuHieu]",
      "issueType": "[LoaiCap]",
      "routeRef": "[Ref_Tuyen]",
      "busRouteRef": "[Ref_TuyenBuyt]",
      "routeCode": "[MaSoTuyen]",
      "routeName": "[TenTuyen]",
      "oldBadgeNumber": "[SoPhuHieuCu]",
      "renewalReason": "[LyDoCapLai]",
      "revokeDecision": "[QDThuHoi]",
      "revokeReason": "[LyDoThuHoi]",
      "revokeDate": "[NgayThuHoi]",
      "notes": "[GhiChu]"
    }
  ]
}
```

## Bước 3: Cấu Hình Environment Variables trên Backend

Đảm bảo backend production có các biến môi trường:

```env
APPSHEET_WEBHOOK_SECRET=52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1
```

### Trên Render.com:

1. Vào service `ben-xe-backend`
2. Vào tab **Environment**
3. Thêm hoặc cập nhật:
   - Key: `APPSHEET_WEBHOOK_SECRET`
   - Value: `52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1`
4. Save và redeploy

## Bước 4: Test Webhook

### Test bằng cURL:

```bash
curl -X POST https://YOUR-BACKEND-URL/api/webhooks/appsheet/badges \
  -H "Content-Type: application/json" \
  -H "X-AppSheet-Secret: 52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1" \
  -d '{
    "badges": [
      {
        "id": "test_123",
        "badgeNumber": "TEST-001",
        "plateNumber": "99H01234",
        "badgeType": "Buýt",
        "status": "active"
      }
    ]
  }'
```

### Test bằng PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-AppSheet-Secret" = "52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1"
}

$body = @{
    badges = @(
        @{
            id = "test_123"
            badgeNumber = "TEST-001"
            plateNumber = "99H01234"
            badgeType = "Buýt"
            status = "active"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://YOUR-BACKEND-URL/api/webhooks/appsheet/badges" -Method POST -Headers $headers -Body $body
```

## Bước 5: Kiểm Tra Logs

### Trên Render.com:

1. Vào service `ben-xe-backend`
2. Vào tab **Logs**
3. Tìm các dòng:
   ```
   [Webhook] Received badges webhook: ...
   [Webhook] Processing X badges
   [Webhook] Sync successful: { upserted: X, errors: [] }
   ```

## Troubleshooting

### Lỗi: Connection refused / Timeout

**Nguyên nhân:** Backend URL không đúng hoặc backend không chạy

**Giải pháp:**
- Kiểm tra backend URL có đúng không
- Kiểm tra backend có đang chạy không (Render.com dashboard)
- Kiểm tra firewall/network không chặn request

### Lỗi: 401 Unauthorized

**Nguyên nhân:** Secret không khớp

**Giải pháp:**
- Đảm bảo `APPSHEET_WEBHOOK_SECRET` trong backend production = `52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1`
- Redeploy backend sau khi thay đổi environment variables

### Lỗi: 404 Not Found

**Nguyên nhân:** URL webhook không đúng

**Giải pháp:**
- Kiểm tra URL: `https://YOUR-BACKEND-URL/api/webhooks/appsheet/badges`
- Đảm bảo có `/api/webhooks/appsheet/badges` ở cuối
- Test endpoint: `https://YOUR-BACKEND-URL/api/webhooks/health` (phải trả về `{status: "ok"}`)

## Lưu Ý Quan Trọng

1. **HTTPS bắt buộc:** AppSheet yêu cầu HTTPS cho production webhooks
2. **Public URL:** Backend phải có public URL (không thể dùng localhost)
3. **CORS:** Đảm bảo CORS cho phép request từ AppSheet (nếu cần)
4. **Secret bảo mật:** Không chia sẻ secret key với người khác

## Các Webhook Endpoints Khác

Ngoài badges, bạn cũng có thể cấu hình:

- **Vehicles:** `https://YOUR-BACKEND-URL/api/webhooks/appsheet/vehicles`
- **Routes:** `https://YOUR-BACKEND-URL/api/webhooks/appsheet/routes`
- **Operators:** `https://YOUR-BACKEND-URL/api/webhooks/appsheet/operators`

Cấu hình tương tự như badges webhook.
