# Ứng Dụng Quản Lý Cho Thuê Phòng

## Tính Năng
- **CRUD Operations**: Quản lý phòng và người thuê hiệu quả.
- **Tính Hóa Đơn Tự Động**: Tính hóa đơn hàng tháng cho thuê phòng, điện, nước dựa trên dữ liệu nhập.
- **Theo Dõi Lịch Sử Thanh Toán**: Theo dõi lịch sử thanh toán, bao gồm ai đã thanh toán và ai còn nợ.
- **Nhắc Nhở Thanh Toán**: Nhắc nhở tự động cho người thuê chưa thanh toán.
- **Xuất Báo Cáo**: Tạo báo cáo chi tiết để in hoặc gửi cho người thuê.
- **Tích Hợp Chatbot AI**: Hỗ trợ tương tác với AI để quản lý.

## Công Nghệ Sử Dụng
- Node.js
- Express
- MySQL
- Sequelize ORM
- Nodemailer (cho email)
- PDFKit (cho xuất báo cáo)

## Hướng Dẫn Thiết Lập
1. Sao chép repository.
2. Cài đặt dependencies: `npm install`.
3. Thiết lập cơ sở dữ liệu MySQL và cập nhật file `.env`.
4. Đồng bộ database: `npm run sync`.
5. Khởi động server: `npm start` hoặc `npm run dev` (development).

## Sử Dụng
- Truy cập ứng dụng qua `http://localhost:3000`.
- Sử dụng các API routes để quản lý phòng, người thuê, hóa đơn, thanh toán.

## API Endpoints
- **Phòng**: `/api/phong`
- **Người Thuê**: `/api/nguoiThue`
- **Hóa Đơn**: `/api/hoaDon`
- **Thanh Toán**: `/api/thanhToan`
- **Báo Cáo**: `/api/baoCao`

## Lưu Ý
- Đảm bảo cấu hình email trong `.env` để gửi nhắc nhở.
- Scheduler tự động chạy hàng ngày để kiểm tra hóa đơn quá hạn.