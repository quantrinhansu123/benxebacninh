# 🚨 Xử lý lỗi "exceed_egress_quota"

## Vấn đề
Supabase free tier có giới hạn **5GB egress/month**. Khi vượt quá, service sẽ bị restrict với thông báo:
```
Service for this project is restricted due to the following violations: exceed_egress_quota.
```

## Giải pháp ngay lập tức

### 1. Liên hệ Supabase Support
- **URL**: https://supabase.help
- **Yêu cầu**: Request quota reset (one-time exception)
- **Lý do**: Đang tối ưu code để giảm bandwidth

### 2. Upgrade tạm thời (nếu cần)
- Upgrade lên **Pro Plan** ($25/month) để có 50GB/month
- Sau khi tối ưu xong có thể downgrade lại

## Đã tối ưu

### ✅ Caching Layer
- File: `client/src/lib/supabase-cache.ts`
- Cache TTL: 5-10 phút tùy loại data
- Giảm số lượng requests đến Supabase

### ✅ Select Specific Fields
Thay vì `select('*')`, chỉ select fields cần thiết:
- `vehicle.service.ts` - chỉ select essential fields
- `operator.service.ts` - chỉ select essential fields

### ✅ Query Limits
- Thêm `.limit(500-1000)` để tránh fetch quá nhiều records

## Cần làm tiếp

### 1. Tối ưu các service còn lại
```bash
# Các file cần tối ưu:
- client/src/services/driver.service.ts
- client/src/services/route.service.ts
- client/src/services/schedule.service.ts
- client/src/services/dispatch.service.ts
- client/src/services/vehicle-badge.service.ts
```

### 2. Thêm Pagination
Cho các list views lớn, implement pagination:
```typescript
getAll: async (page = 1, pageSize = 50) => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  return supabase
    .from('table')
    .select('essential_fields')
    .range(from, to)
}
```

### 3. Giảm Real-time Subscriptions
Nếu có real-time subscriptions, tắt hoặc giảm số lượng.

### 4. Monitor Usage
- Vào Supabase Dashboard → Settings → Usage
- Theo dõi egress quota hàng ngày
- Set alerts khi gần đạt limit

## Best Practices

### ✅ DO
- ✅ Cache frequently accessed data
- ✅ Select only needed fields
- ✅ Use pagination for large lists
- ✅ Limit query results
- ✅ Batch multiple operations

### ❌ DON'T
- ❌ Don't use `select('*')` unless necessary
- ❌ Don't fetch all records without limit
- ❌ Don't make unnecessary queries
- ❌ Don't ignore cache
- ❌ Don't fetch data on every render

## Monitoring

### Check Bandwidth Usage
1. Vào Supabase Dashboard
2. Settings → Usage → Network Egress
3. Xem current usage và remaining quota

### Set Up Alerts
- Alert at 80% quota (4GB)
- Alert at 95% quota (4.75GB)

## Long-term Solutions

### Option 1: Supabase Pro Plan
- **Cost**: $25/month
- **Benefits**: 50GB egress/month
- **Best for**: Production apps with moderate traffic

### Option 2: Self-hosted PostgreSQL
- **Cost**: VPS ($5-20/month)
- **Benefits**: Unlimited bandwidth
- **Best for**: Full control, high traffic

### Option 3: Hybrid Approach
- Critical data: Supabase
- Static/cached data: CDN or local storage
- **Best for**: Cost optimization

## Emergency Checklist

Nếu đã bị restrict:
- [ ] Contact Supabase Support
- [ ] Upgrade to Pro (temporary)
- [ ] Implement aggressive caching
- [ ] Optimize all queries
- [ ] Add pagination
- [ ] Monitor usage daily
- [ ] Set up alerts

## Code Changes Summary

### Files Modified
1. `client/src/lib/supabase-cache.ts` - New caching utility
2. `client/src/services/vehicle.service.ts` - Optimized queries
3. `client/src/services/operator.service.ts` - Optimized queries

### Next Steps
1. Optimize remaining services
2. Add pagination to list views
3. Review and reduce real-time subscriptions
4. Monitor bandwidth usage

## Contact
- Supabase Support: https://supabase.help
- Supabase Discord: https://discord.supabase.com
