# 🚀 Tối ưu Bandwidth Supabase - Giảm Egress Quota

## Vấn đề
Supabase free tier có giới hạn **5GB egress/month**. Khi vượt quá, service sẽ bị restrict.

## Giải pháp đã áp dụng

### 1. ✅ Caching Layer
- Thêm `supabase-cache.ts` để cache queries
- Cache TTL: 5 phút cho các queries thường dùng
- Giảm số lượng requests đến Supabase

### 2. ✅ Select Specific Fields
Thay vì `select('*')`, chỉ select các fields cần thiết:
```typescript
// ❌ Bad - fetch tất cả columns
.select('*')

// ✅ Good - chỉ fetch fields cần thiết
.select('id,plate_number,operator_id,is_active,created_at')
```

### 3. ✅ Query Limits
Thêm `.limit()` để tránh fetch quá nhiều records:
```typescript
.select('*').limit(1000) // Giới hạn 1000 records
```

### 4. ✅ Pagination (Cần implement)
Cho các queries lớn, nên dùng pagination:
```typescript
.select('*')
.range(0, 49) // First 50 records
```

## Các bước tiếp theo

### 1. Tối ưu các service còn lại
- [ ] `driver.service.ts` - chỉ select essential fields
- [ ] `operator.service.ts` - thêm cache và limit
- [ ] `route.service.ts` - tối ưu queries
- [ ] `schedule.service.ts` - pagination cho large datasets
- [ ] `dispatch.service.ts` - chỉ fetch recent records

### 2. Implement Pagination
Thêm pagination cho các list views:
```typescript
getAll: async (page = 1, pageSize = 50) => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  return supabase
    .from('table')
    .select('*')
    .range(from, to)
}
```

### 3. Reduce Real-time Subscriptions
Nếu có real-time subscriptions, giảm số lượng hoặc tắt nếu không cần thiết.

### 4. Monitor Bandwidth Usage
- Vào Supabase Dashboard → Settings → Usage
- Theo dõi egress quota hàng ngày
- Set alerts khi gần đạt limit

## Best Practices

### ✅ DO
- Cache frequently accessed data
- Select only needed fields
- Use pagination for large lists
- Limit query results
- Batch multiple operations when possible

### ❌ DON'T
- Don't use `select('*')` unless necessary
- Don't fetch all records without limit
- Don't make unnecessary queries
- Don't ignore cache
- Don't fetch data on every render

## Upgrade Options

Nếu vẫn vượt quota sau khi tối ưu:

1. **Supabase Pro Plan** ($25/month)
   - 50GB egress/month
   - Better performance

2. **Self-hosted PostgreSQL**
   - Unlimited bandwidth
   - Full control

3. **Hybrid Approach**
   - Critical data: Supabase
   - Static/cached data: CDN or local storage

## Monitoring

Check bandwidth usage:
```bash
# Supabase Dashboard
Settings → Usage → Network Egress
```

Set up alerts:
- Alert at 80% quota (4GB)
- Alert at 95% quota (4.75GB)

## Emergency Actions

Nếu đã bị restrict:
1. Contact Supabase Support: https://supabase.help
2. Request quota reset (one-time)
3. Upgrade to Pro plan
4. Implement aggressive caching
5. Reduce query frequency
