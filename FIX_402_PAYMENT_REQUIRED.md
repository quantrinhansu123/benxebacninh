# 🚨 Xử lý lỗi 402 (Payment Required)

## Vấn đề
Lỗi **402 (Payment Required)** xảy ra khi Supabase project đã bị restrict do:
- Vượt quá **egress quota** (5GB/month cho free tier)
- Project bị suspend do payment issues

## Triệu chứng
```
GET https://xxx.supabase.co/rest/v1/users?... 402 (Payment Required)
```

## Giải pháp ngay lập tức

### 1. ⚡ Upgrade lên Pro Plan (Khuyến nghị)
- **URL**: https://supabase.com/dashboard/project/_/settings/billing
- **Cost**: $25/month
- **Benefits**: 
  - 50GB egress/month (10x free tier)
  - Better performance
  - Priority support
- **Thời gian**: Có hiệu lực ngay sau khi upgrade

### 2. 📧 Liên hệ Supabase Support
- **URL**: https://supabase.help
- **Yêu cầu**: Request quota reset (one-time exception)
- **Lý do**: Đang tối ưu code để giảm bandwidth
- **Thời gian**: 1-2 ngày để được phản hồi

### 3. 🔄 Tạo Project mới (Tạm thời)
- Tạo Supabase project mới
- Migrate data (nếu cần)
- Update `.env` với credentials mới
- **Lưu ý**: Chỉ là giải pháp tạm thời, sẽ gặp lại vấn đề tương tự

## Đã cải thiện

### ✅ Error Handling
- File: `client/src/lib/supabase-error-handler.ts`
- Detect và hiển thị lỗi 402 một cách user-friendly
- Cập nhật `authApi` để handle payment errors

### ✅ User-Friendly Messages
Thay vì lỗi kỹ thuật, user sẽ thấy:
```
"Dịch vụ tạm thời không khả dụng do vượt quá hạn mức. 
Vui lòng liên hệ quản trị viên hoặc nâng cấp gói dịch vụ Supabase."
```

## Các bước thực hiện

### Bước 1: Upgrade Supabase Plan
1. Vào https://supabase.com/dashboard
2. Chọn project bị restrict
3. Vào **Settings** → **Billing**
4. Click **Upgrade to Pro**
5. Thanh toán $25/month
6. Service sẽ được restore ngay lập tức

### Bước 2: Verify Service
Sau khi upgrade:
1. Refresh browser
2. Thử đăng nhập lại
3. Kiểm tra console không còn lỗi 402

### Bước 3: Monitor Usage
1. Vào **Settings** → **Usage**
2. Theo dõi **Network Egress**
3. Set alerts khi gần đạt limit

## Long-term Solutions

### Option 1: Supabase Pro Plan ✅ (Khuyến nghị)
- **Cost**: $25/month
- **Egress**: 50GB/month
- **Best for**: Production apps

### Option 2: Self-hosted PostgreSQL
- **Cost**: VPS $5-20/month
- **Egress**: Unlimited
- **Best for**: Full control, high traffic

### Option 3: Hybrid Approach
- Critical data: Supabase Pro
- Static/cached data: CDN
- **Best for**: Cost optimization

## Prevention

### 1. ✅ Đã tối ưu
- Caching layer (5-10 min TTL)
- Select specific fields only
- Query limits (500-1000 records)

### 2. 🔄 Cần làm tiếp
- Tối ưu các service còn lại
- Thêm pagination
- Reduce real-time subscriptions
- Monitor bandwidth daily

## Code Changes

### Files Modified
1. `client/src/lib/supabase-error-handler.ts` - New error handling utility
2. `client/src/features/auth/api/authApi.ts` - Handle 402 errors

### Error Detection
```typescript
import { isPaymentRequiredError, getSupabaseErrorMessage } from '@/lib/supabase-error-handler'

if (isPaymentRequiredError(error)) {
  throw new Error(getSupabaseErrorMessage(error))
}
```

## Monitoring

### Check Current Status
1. Supabase Dashboard → Project Settings
2. Xem project status (Active/Restricted)
3. Check usage quota

### Set Up Alerts
- Alert at 80% quota (4GB)
- Alert at 95% quota (4.75GB)
- Alert when project is restricted

## Support

- **Supabase Support**: https://supabase.help
- **Supabase Discord**: https://discord.supabase.com
- **Billing Issues**: billing@supabase.com

## Quick Checklist

- [ ] Upgrade to Pro Plan ($25/month)
- [ ] Verify service is restored
- [ ] Update error handling (✅ Done)
- [ ] Monitor bandwidth usage
- [ ] Continue optimizing queries
- [ ] Set up usage alerts
