# Hướng Dẫn Điền HTTP Headers trong AppSheet

## Vấn Đề

AppSheet có thể hiểu nhầm headers nếu điền không đúng format, dẫn đến lỗi:
```
contains an invalid expression 'Arithmetic expression'
```

## Cách Điền Đúng

### Trong AppSheet Webhook Configuration:

**KHÔNG điền tất cả headers vào một field!**

Thay vào đó, **click "Add" và thêm từng header một:**

### Header 1: apikey

1. Click nút **"Add"** trong phần HTTP Headers
2. **Điền:** `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

**Copy dòng này:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### Header 2: Authorization

1. Click **"Add"** lần nữa
2. **Điền:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI`

**Copy dòng này:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZXVmZWx6dWtmdWNxcXRrbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjE1NDIsImV4cCI6MjA4MzU5NzU0Mn0.cFSiTKGrh6mB7Zswf_geV3-py2pXspKhrArxMhUUgYI
```

### Header 3: Content-Type

1. Click **"Add"** lần nữa
2. **Điền:** `Content-Type: application/json`

**Copy dòng này:**
```
Content-Type: application/json
```

### Header 4: Prefer

1. Click **"Add"** lần nữa
2. **Điền:** `Prefer: return=representation,resolution=merge-duplicates`

**Copy dòng này:**
```
Prefer: return=representation,resolution=merge-duplicates
```

## Kết Quả

Sau khi thêm xong, bạn sẽ thấy 4 headers riêng biệt:

```
1. apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
2. Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. Content-Type: application/json
4. Prefer: return=representation,resolution=merge-duplicates
```

## Lưu Ý

- ✅ Format phải là: `Name: Value` (có dấu hai chấm `:` và một khoảng trắng sau dấu hai chấm)
- ✅ Mỗi header là một dòng riêng
- ✅ Click "Add" để thêm từng header
- ❌ KHÔNG điền tất cả vào một field
- ❌ KHÔNG dùng 2 trường riêng (Name và Value) - AppSheet yêu cầu format `Name: Value`

## Troubleshooting

### Nếu vẫn bị lỗi:

1. **Kiểm tra format:** Đảm bảo mỗi header là một entry riêng
2. **Kiểm tra dấu ngoặc kép:** AppSheet có thể tự động thêm quotes
3. **Thử bỏ qua header Prefer:** Chỉ thêm 3 headers đầu tiên để test

### Test với ít headers hơn:

Nếu vẫn lỗi, thử chỉ thêm 2 headers đầu tiên:
- `apikey`
- `Authorization`

Sau đó test xem có hoạt động không, rồi mới thêm các headers khác.
