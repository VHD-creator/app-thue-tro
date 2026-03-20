-- ========================================
-- DATA SAMPLE - DỮ LIỆU KIỂM THỬ
-- ========================================
-- Ngày tạo: 2026-01-29
-- Database: quan_ly_thue_tro
-- Mô tả: File chứa dữ liệu mẫu để test API

-- Tắt kiểm tra khóa ngoài
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ (theo thứ tự từ bảng phụ thuộc đến bảng cha)
TRUNCATE TABLE thanh_toan;
TRUNCATE TABLE hoa_don;
TRUNCATE TABLE hop_dong;
TRUNCATE TABLE phong;
TRUNCATE TABLE nguoi_thue;
TRUNCATE TABLE chu_tro;
TRUNCATE TABLE tai_khoan;

-- Bật lại kiểm tra khóa ngoài
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 1. TẠO TÀI KHOẢN
-- ========================================
INSERT INTO tai_khoan (id_tai_khoan, ten_dang_nhap, mat_khau, vai_tro, trang_thai, ngay_tao) VALUES
(1, 'admin01', 'Admin@123', 'ADMIN', 1, NOW()),
(2, 'chuTro01', 'ChuTro@123', 'CHU_TRO', 1, NOW()),
(3, 'chuTro02', 'ChuTro@123', 'CHU_TRO', 1, NOW()),
(4, 'nguoiThue01', 'NguoiThue@123', 'NGUOI_THUE', 1, NOW()),
(5, 'nguoiThue02', 'NguoiThue@123', 'NGUOI_THUE', 1, NOW());

-- ========================================
-- 2. TẠO CHỦ TRỌ
-- ========================================
INSERT INTO chu_tro (id_chu_tro, id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_tao) VALUES
(1, 2, 'Lê Văn Chủ Trọ', '0901234567', 'chuTro01@gmail.com', '123 Đường Lê Lợi, Quận 1, TP.HCM', NOW()),
(2, 3, 'Nguyễn Thị Chủ Trọ', '0912345678', 'chuTro02@gmail.com', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM', NOW());

-- ========================================
-- 3. TẠO PHÒNG
-- ========================================
INSERT INTO phong (id_phong, id_chu_tro, ten_phong, gia_phong, trang_thai, mo_ta) VALUES
(1, 1, 'Phòng 101 - Tầng 1', 3000000.00, 1, 'Phòng đơn, có cửa sổ, thoáng mát, full nội thất cơ bản'),
(2, 1, 'Phòng 102 - Tầng 1', 3500000.00, 0, 'Phòng đôi, toilet riêng, có AC, bếp đầy đủ'),
(3, 1, 'Phòng 201 - Tầng 2', 4000000.00, 0, 'Phòng VIP, full nội thất cao cấp, view đẹp, có ban công'),
(4, 2, 'Phòng 301 - Tầng 3', 2500000.00, 0, 'Phòng nhỏ giá rẻ, tiết kiệm, thích hợp cho sinh viên'),
(5, 2, 'Phòng 302 - Tầng 3', 3200000.00, 1, 'Phòng rộng, có bếp, toilet sạch sẽ, gần công viên');

-- ========================================
-- 4. TẠO NGƯỜI THUÊ (CCCD, SO_DIEN_THOAI, EMAIL)
-- ========================================
INSERT INTO nguoi_thue (id_nguoi_thue, id_tai_khoan, ho_ten, cccd, so_dien_thoai, email, ngay_vao, ngay_ra) VALUES
(1, 4, 'Nguyễn Văn A', '123456789012', '0987654321', 'nguyenvana@gmail.com', NOW(), NULL),
(2, 5, 'Trần Thị B', '987654321098', '0912345678', 'tranthib@gmail.com', NOW(), NULL);

-- ========================================
-- 5. TẠO HỢP ĐỒNG
-- ========================================
INSERT INTO hop_dong (id_hop_dong, id_phong, id_nguoi_thue, ngay_bat_dau, ngay_ket_thuc, tien_coc, trang_thai) VALUES
(1, 1, 1, '2026-01-29', '2026-12-29', 6000000.00, 1),
(2, 5, 2, '2026-02-15', '2027-02-15', 6400000.00, 1);

-- ========================================
-- 6. TẠO HÓA ĐƠN
-- ========================================
INSERT INTO hoa_don (id_hoa_don, id_phong, thang_nam, so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, tong_tien, trang_thai, ngay_tao) VALUES
(1, 1, '01-2026', 100, 150, 50, 65, 500000.00, 200000.00, 3000000.00, 3700000.00, 1, NOW()),
(2, 1, '02-2026', 150, 200, 65, 80, 500000.00, 200000.00, 3000000.00, 3700000.00, 0, NOW()),
(3, 5, '01-2026', 0, 0, 0, 0, 0.00, 0.00, 3200000.00, 3200000.00, 0, NOW());

-- ========================================
-- 7. TẠO THANH TOÁN
-- ========================================
INSERT INTO thanh_toan (id_thanh_toan, id_hoa_don, so_tien, ngay_thanh_toan, hinh_thuc) VALUES
(1, 1, 3700000.00, '2026-02-01', 'chuyển khoản'),
(2, 3, 3200000.00, '2026-01-31', 'tiền mặt');

-- ========================================
-- KIỂM TRA DỮ LIỆU
-- ========================================
SELECT '=== TÀI KHOẢN ===' as '';
SELECT * FROM tai_khoan;

SELECT '=== CHỦ TRỌ ===' as '';
SELECT * FROM chu_tro;

SELECT '=== PHÒNG ===' as '';
SELECT * FROM phong;

SELECT '=== NGƯỜI THUÊ ===' as '';
SELECT * FROM nguoi_thue;

SELECT '=== HỢP ĐỒNG ===' as '';
SELECT * FROM hop_dong;

SELECT '=== HÓA ĐƠN ===' as '';
SELECT * FROM hoa_don;

SELECT '=== THANH TOÁN ===' as '';
SELECT * FROM thanh_toan;

-- ========================================
-- THỐNG KỊ
-- ========================================
SELECT 
  (SELECT COUNT(*) FROM tai_khoan) as 'Tổng tài khoản',
  (SELECT COUNT(*) FROM chu_tro) as 'Tổng chủ trọ',
  (SELECT COUNT(*) FROM phong) as 'Tổng phòng',
  (SELECT COUNT(*) FROM phong WHERE trang_thai = 0) as 'Phòng trống',
  (SELECT COUNT(*) FROM phong WHERE trang_thai = 1) as 'Phòng đã cho thuê',
  (SELECT COUNT(*) FROM nguoi_thue) as 'Tổng người thuê',
  (SELECT COUNT(*) FROM hop_dong) as 'Tổng hợp đồng',
  (SELECT COUNT(*) FROM hoa_don) as 'Tổng hóa đơn',
  (SELECT COUNT(*) FROM thanh_toan) as 'Tổng thanh toán';
