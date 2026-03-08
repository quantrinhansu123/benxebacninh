# Hướng dẫn khởi động Server

## Lỗi ERR_CONNECTION_REFUSED

Lỗi này xảy ra khi server backend chưa được khởi động.

## Cách khởi động Server

### Cách 1: Khởi động riêng từng service

1. **Khởi động Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   
   Bạn sẽ thấy thông báo:
   ```
   Server is running on http://localhost:3000
   API available at http://localhost:3000/api
   ```

2. **Khởi động Frontend (terminal mới):**
   ```bash
   cd client
   npm run dev
   ```

### Cách 2: Khởi động cả hai cùng lúc (từ root)

```bash
# Từ thư mục gốc của project
npm run dev
```

## Kiểm tra Server đang chạy

1. Mở browser và truy cập: `http://localhost:3000/health`
2. Bạn sẽ thấy: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### Port 3000 đã được sử dụng

Nếu port 3000 đã được sử dụng, bạn có thể:
1. Đổi port trong file `server/.env`:
   ```
   APP_PORT=3001
   ```
2. Hoặc dừng process đang dùng port 3000

### Database không kết nối được

Kiểm tra file `server/.env` có đầy đủ:
- `DATABASE_URL` - Connection string đến PostgreSQL
- `JWT_SECRET` - Secret key cho JWT

Chạy lệnh kiểm tra:
```bash
cd server
npm run check-env
```

## Lưu ý

- Server backend PHẢI chạy trước khi frontend có thể kết nối
- Đảm bảo cả hai đang chạy khi phát triển
- Backend chạy trên port 3000 (hoặc port trong APP_PORT)
- Frontend chạy trên port 5173 (hoặc port trong Vite config)
