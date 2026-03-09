# 📊 Tình trạng API hiện tại

## ✅ Đã chuyển sang Supabase

### Authentication (Đăng nhập/Đăng ký)
- ✅ `client/src/features/auth/api/authApi.ts` - Dùng Supabase trực tiếp
- ✅ Login, Register, GetCurrentUser, UpdateProfile - Tất cả đều dùng Supabase

### Services đã migrate
- ✅ `client/src/services/vehicle.service.ts` - Dùng Supabase
- ✅ `client/src/services/driver.service.ts` - Dùng Supabase
- ✅ `client/src/services/operator.service.ts` - Dùng Supabase
- ✅ `client/src/services/route.service.ts` - Dùng Supabase
- ✅ `client/src/services/schedule.service.ts` - Dùng Supabase
- ✅ `client/src/services/location.service.ts` - Dùng Supabase
- ✅ `client/src/services/vehicle-badge.service.ts` - Dùng Supabase

## ⚠️ Vẫn đang dùng Backend API

### Services chưa migrate
- ❌ `client/src/services/dispatch.service.ts` - Vẫn gọi `/dispatch/*`
- ❌ `client/src/services/dashboard.service.ts` - Vẫn gọi `/dashboard/*`
- ❌ `client/src/services/report.service.ts` - Vẫn gọi `/reports/*`
- ❌ `client/src/services/user.service.ts` - Vẫn gọi `/users/*`
- ❌ `client/src/services/invoice.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/violation.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/vehicle-type.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/shift.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/service.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/service-formula.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/service-charge.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/quanly-data.service.ts` - Vẫn gọi `/quanly-data`
- ❌ `client/src/services/province.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/operation-notice.service.ts` - Vẫn gọi backend API
- ❌ `client/src/services/gtvt-sync.service.ts` - Vẫn gọi backend API

### Feature APIs chưa migrate
- ❌ `client/src/features/dispatch/api/dispatchApi.ts` - Vẫn gọi `/dispatch/*`
- ❌ `client/src/features/fleet/vehicles/api/vehicleApi.ts` - Có sync function gọi backend
- ❌ `client/src/features/fleet/operators/api/operatorApi.ts` - Có sync function gọi backend
- ❌ `client/src/features/fleet/drivers/api/driverApi.ts` - Vẫn gọi backend
- ❌ `client/src/features/fleet/routes/api/routeApi.ts` - Có sync function gọi backend
- ❌ `client/src/features/fleet/schedules/api/schedule-api.ts` - Có sync function gọi backend
- ❌ `client/src/features/fleet/vehicle-badges/api/vehicleBadgeApi.ts` - Có sync function gọi backend
- ❌ `client/src/features/fleet/vehicles/api/vehicleTypeApi.ts` - Vẫn gọi backend
- ❌ `client/src/features/chat/api/chatApi.ts` - Vẫn gọi backend

### Components
- ❌ `client/src/components/driver/DriverForm.tsx` - Có thể gọi backend
- ❌ `client/src/components/dispatch/sections/VehicleImageSection.tsx` - Có thể gọi backend
- ❌ `client/src/components/dispatch/CapPhepDialogRedesign.tsx` - Có thể gọi backend
- ❌ `client/src/features/fleet/vehicles/components/VehicleForm.tsx` - Có thể gọi backend

### Utilities
- ❌ `client/src/lib/pdf-cache.ts` - Dùng `VITE_API_URL` để proxy PDF

## 🔧 Backend API Configuration

File `client/src/lib/api.ts`:
- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`
- Đang hoạt động bình thường
- Có interceptor để thêm auth token
- Có error handling cho 401 (unauthorized)

## 📝 Kết luận

**Hiện tại code đang dùng HỖN HỢP:**
- ✅ Auth: Supabase
- ✅ CRUD cơ bản (vehicles, drivers, operators, routes, schedules): Supabase
- ❌ Business logic phức tạp (dispatch, dashboard, reports): Backend API
- ❌ Sync functions (AppSheet sync): Backend API

**Nếu muốn tiếp tục dùng Backend API:**
- Cần đảm bảo `VITE_API_URL` được set đúng trong `.env`
- Cần đảm bảo backend server đang chạy và CORS được config đúng
- Backend URL hiện tại: `https://ben-xe-backend-gctv.onrender.com/api`

**Nếu muốn chuyển hết sang Supabase:**
- Cần migrate các services còn lại
- Cần implement business logic trong Supabase Functions hoặc client-side
- Cần xử lý AppSheet sync logic
