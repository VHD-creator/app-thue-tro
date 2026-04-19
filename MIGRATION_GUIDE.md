# Migration Guide - Cập nhật Database

## Thay đổi gần đây (Phiên bản mới)

### 1. Bảng `chu_tro` - Thêm xác thực email & SĐT

```sql
-- Kiểm tra xem cột đã tồn tại chưa
ALTER TABLE `chu_tro` ADD COLUMN `email_verified` BOOLEAN DEFAULT FALSE;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verified` BOOLEAN DEFAULT FALSE;
ALTER TABLE `chu_tro` ADD COLUMN `verification_token` VARCHAR(100) NULL;
ALTER TABLE `chu_tro` ADD COLUMN `verification_token_expiry` DATETIME NULL;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verification_code` VARCHAR(10) NULL;
ALTER TABLE `chu_tro` ADD COLUMN `phone_verification_expiry` DATETIME NULL;
```

### 2. Bảng `hinh_anh_phong` - Thêm hash kiểm tra trùng ảnh

```sql
-- Thêm cột file_hash để phát hiện ảnh trùng lặp
ALTER TABLE `hinh_anh_phong` ADD COLUMN `file_hash` VARCHAR(128) NOT NULL AFTER `kich_thuoc`;
-- Tạo index để tìm kiếm nhanh
CREATE INDEX `idx_file_hash` ON `hinh_anh_phong`(`file_hash`);
```

### 3. Bảng `tai_khoan` - Kiểm tra trạng thái

```sql
-- Nếu chưa có cột trang_thai, tạo thêm
-- (Nếu đã có thì bỏ qua)
ALTER TABLE `tai_khoan` ADD COLUMN `trang_thai` INT DEFAULT 1;
```

## Các thay đổi logic

### Auth Flow
- **Đăng ký CHU_TRO**: 
  - Buộc cung cấp email
  - Tạo tài khoản với `trang_thai = 0` (chưa kích hoạt)
  - Gửi email xác thực
  - Email xác thực có hiệu lực 24h

- **Xác thực email**:
  - Truy cập `/api/auth/verify-email/:token`
  - Sẽ kích hoạt tài khoản (`trang_thai = 1`)
  - Có thể đăng nhập sau khi xác thực

- **Gửi lại email**:
  - POST `/api/auth/resend-verification` với email
  - Tạo token mới, gửi lại email

### Upload ảnh
- **Kiểm tra hash**: 
  - Tính SHA-256 của file ảnh
  - Kiểm tra xem ảnh đã tồn tại ở chủ trọ khác không
  - Nếu có, từ chối upload

- **Xác thực chủ trọ**:
  - Chỉ chủ trọ đã xác thực email + SĐT mới được upload
  - Middleware: `requireChuTroVerified`

### Thanh toán
- **Kiểm tra quyền**:
  - Chủ trọ chỉ thanh toán hóa đơn của phòng mình
  - Admin có thể thanh toán bất kỳ

- **Tính toán partial payment**:
  - Hóa đơn chỉ `PAID (1)` khi tổng thanh toán >= tổng tiền
  - Response trả về tổng đã thanh toán

### Tối ưu Chatbot
- Chỉ load 20 phòng trống đầu tiên (thay vì toàn bộ)
- Giảm thời gian response & chi phí API

## Quy trình cập nhật

1. **Backup database**
   ```bash
   mysqldump -u root -p quan_ly_thue_tro > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Chạy SQL migration** (từng dòng, kiểm tra từng lệnh)
   ```sql
   -- Chạy các lệnh ALTER TABLE ở trên
   ```

3. **Restart server**
   ```bash
   npm start
   ```

4. **Test các route**
   - POST `/api/auth/register` (đăng ký CHU_TRO)
   - GET `/api/auth/verify-email/:token` (xác thực)
   - POST `/api/hinhAnh/phong/:id_phong` (upload ảnh)
   - POST `/api/thanhToan` (thanh toán)

## Rollback (nếu cần)

```sql
-- Xóa các cột mới (nếu cần quay lại phiên bản cũ)
ALTER TABLE `chu_tro` DROP COLUMN `email_verified`;
ALTER TABLE `chu_tro` DROP COLUMN `phone_verified`;
ALTER TABLE `chu_tro` DROP COLUMN `verification_token`;
ALTER TABLE `chu_tro` DROP COLUMN `verification_token_expiry`;
ALTER TABLE `chu_tro` DROP COLUMN `phone_verification_code`;
ALTER TABLE `chu_tro` DROP COLUMN `phone_verification_expiry`;

ALTER TABLE `hinh_anh_phong` DROP INDEX `idx_file_hash`;
ALTER TABLE `hinh_anh_phong` DROP COLUMN `file_hash`;
```

## Lưu ý

- Các cột mới có `DEFAULT` value, nên dữ liệu cũ không bị mất
- Các trường `_token` và `_expiry` cho phép NULL (cho dữ liệu cũ)
- Không cần migrate dữ liệu hiện tại (tự động có giá trị defaults)
