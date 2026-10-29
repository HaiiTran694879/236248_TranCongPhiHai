# Frontend quản lý món ăn

## Cấu hình API

Frontend đọc URL API từ biến môi trường `VITE_API_URL`. Sao chép `.env.example` thành `.env` khi chạy cục bộ và thay giá trị bằng URL backend đang sử dụng, ví dụ:

```env
VITE_API_URL=https://your-backend.example.com/api/foods
```

Khi triển khai Vite lên môi trường cloud, khai báo biến `VITE_API_URL` trong cấu hình build của nhà cung cấp. URL cần trỏ đến endpoint `/api/foods`, không chỉ đến domain gốc. Giá trị mặc định khi không khai báo là `http://localhost:3000/api/foods`.

## Chạy và kiểm tra

```bash
npm install
npm run dev
npm run lint
npm run build
```

Giao diện hỗ trợ xem danh sách và chi tiết, tìm kiếm theo tên/loại/ẩm thực, thêm, cập nhật và xóa món ăn. Backend phải hoạt động và cho phép CORS từ domain frontend.











