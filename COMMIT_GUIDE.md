# Hướng dẫn Commit và Push lên Git

## Tóm tắt các thay đổi

### Tính năng mới:
1. **Quản lý nhân sự** - Thêm trang QuanLyNhanSu để quản lý users
2. **Bến phụ trách** - Thêm trường `benPhuTrach` cho users để gán bến phụ trách
3. **Filter theo bến phụ trách** - Routes và Locations tự động filter theo bến phụ trách của user
4. **Sidebar collapsible** - Thêm chức năng thu gọn/mở rộng sidebar
5. **ActionMenu component** - Thay thế các nút thao tác bằng dropdown menu

### Cải thiện:
- Cải thiện error handling cho 401 Unauthorized
- Thêm logging cho routes và locations filtering
- Cải thiện UI/UX cho các bảng quản lý

## Các file đã thay đổi

### Client:
- `client/src/pages/QuanLyNhanSu.tsx` (mới)
- `client/src/components/ui/ActionMenu.tsx` (mới)
- `client/src/services/user.service.ts` (mới)
- `client/src/components/layout/Sidebar.tsx` - Thêm collapsible
- `client/src/components/layout/MainLayout.tsx` - Điều chỉnh padding khi sidebar collapsed
- `client/src/store/ui.store.ts` - Thêm state cho sidebar collapse
- `client/src/lib/api.ts` - Cải thiện error handling
- Các trang quản lý - Thay thế action buttons bằng ActionMenu

### Server:
- `server/src/controllers/user.controller.ts` (mới)
- `server/src/routes/user.routes.ts` (mới)
- `server/src/controllers/route.controller.ts` - Filter theo benPhuTrach
- `server/src/controllers/location.controller.ts` - Filter theo benPhuTrach
- `server/src/controllers/auth.controller.ts` - Cải thiện login logic
- `server/src/db/schema/users.ts` - Thêm benPhuTrach field
- `server/src/db/migrations/manual/007-add-ben-phu-trach-to-users.sql` (mới)
- `server/src/scripts/` - Thêm các script utility

## Lệnh để commit và push

```bash
# 1. Kiểm tra trạng thái
git status

# 2. Thêm các file (trừ .env)
git add client/
git add server/
git add LOGIN_LOGIC.md
git add COMMIT_GUIDE.md

# 3. Commit với message
git commit -m "feat: thêm quản lý nhân sự và filter theo bến phụ trách

- Thêm trang Quản lý nhân sự (QuanLyNhanSu)
- Thêm trường benPhuTrach cho users
- Filter routes và locations theo bến phụ trách của user
- Thêm sidebar collapsible để tiết kiệm không gian
- Thay thế action buttons bằng ActionMenu component
- Cải thiện error handling cho authentication
- Thêm các script utility để quản lý users"

# 4. Push lên remote
git push origin master
```

## Lưu ý

⚠️ **KHÔNG commit file `.env`** - File này chứa thông tin nhạy cảm

Nếu muốn commit tất cả trừ .env:
```bash
git add .
git reset HEAD .env
git commit -m "your message"
```

## Commit message theo Conventional Commits

Nếu muốn chia nhỏ commits:

```bash
# Commit 1: Quản lý nhân sự
git add client/src/pages/QuanLyNhanSu.tsx client/src/services/user.service.ts server/src/controllers/user.controller.ts server/src/routes/user.routes.ts
git commit -m "feat(nhan-su): thêm trang quản lý nhân sự"

# Commit 2: Bến phụ trách
git add server/src/db/schema/users.ts server/src/db/migrations/manual/007-add-ben-phu-trach-to-users.sql
git commit -m "feat(users): thêm trường benPhuTrach cho users"

# Commit 3: Filter theo bến phụ trách
git add server/src/controllers/route.controller.ts server/src/controllers/location.controller.ts
git commit -m "feat(filter): filter routes và locations theo bến phụ trách"

# Commit 4: Sidebar collapsible
git add client/src/components/layout/Sidebar.tsx client/src/components/layout/MainLayout.tsx client/src/store/ui.store.ts
git commit -m "feat(ui): thêm chức năng thu gọn sidebar"

# Commit 5: ActionMenu component
git add client/src/components/ui/ActionMenu.tsx client/src/pages/*.tsx
git commit -m "feat(ui): thay thế action buttons bằng ActionMenu"

# Commit 6: Cải thiện error handling
git add client/src/lib/api.ts server/src/controllers/auth.controller.ts
git commit -m "fix(auth): cải thiện error handling cho 401 Unauthorized"

# Push tất cả
git push origin master
```
