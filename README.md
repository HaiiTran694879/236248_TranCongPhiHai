
# 236248_TranCongPhiHai

## 1. Giới thiệu
Dự án quản lý món ăn, cho phép xem, tìm kiếm, thêm,
cập nhật và xóa món ăn.

## 2. Công nghệ sử dụng
- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Quản lý mã nguồn: GitHub
- Đóng gói: Docker
- Triển khai: Render

## 3. Cấu trúc dự án
- backend/: mã nguồn API
- frontend/: mã nguồn giao diện
- README.md: tài liệu dự án
- .gitignore: các file không đưa lên GitHub

## 4. Chạy backend bằng Docker

Backend đọc cấu hình khi container chạy; `MONGODB_URI` là bắt buộc. Không truyền secrets lúc build và không commit file `backend/.env`.

```powershell
docker build -t food-management-backend:latest ./backend
docker run --rm --name food-api -p 3000:3000 --env-file ./backend/.env food-management-backend:latest
```

`backend/.env` cần chứa `MONGODB_URI`. Có thể cấu hình thêm `MONGODB_DB` (mặc định `236248_TranCongPhiHai`) và `PORT` (mặc định `3000`). Tạo file này riêng trên máy chạy container; `.dockerignore` loại file môi trường khỏi build context và image.

Kiểm tra container tại `http://localhost:3000/health` và danh sách món tại `http://localhost:3000/api/foods`.

## 5. Đẩy image lên Docker Hub

Thay `<dockerhub-username>` bằng tên tài khoản Docker Hub:

```powershell
docker login --username <dockerhub-username>
docker tag food-management-backend:latest <dockerhub-username>/food-management-backend:latest
docker push <dockerhub-username>/food-management-backend:latest
```

Đường dẫn image nộp bài: `docker.io/haiitran694879/food-management-backend:latest`.

## 6. Triển khai
- GitHub: https://github.com/HaiiTran694879/236248_TranCongPhiHai
- Frontend: Chưa triển khai
- Backend API: Chưa triển khai
