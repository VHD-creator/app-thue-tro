# 📚 API DOCUMENTATION - Quản Lý Cho Thuê Phòng

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication

Tất cả request (trừ public endpoints) cần chứa `session.userId` trong request session.

**Vai trò:**
- `ADMIN` - Quản trị viên (full access)
- `CHU_TRO` - Chủ trọ (quản lý phòng và hóa đơn)
- `NGUOI_THUE` - Người thuê (xem phòng, thanh toán)

---

## 📋 API ENDPOINTS

### **1. PHÒNG (Phong)**

#### GET `/api/phong` - Danh sách tất cả phòng (Public)
```
Method: GET
Auth: Not required
Response:
{
  "count": 10,
  "data": [
    {
      "id_phong": 1,
      "id_chu_tro": 5,
      "ten_phong": "Phòng A101",
      "gia_phong": 5000000,
      "trang_thai": 0,
      "mo_ta": "Phòng khép kín có ban công"
    }
  ]
}
```

#### GET `/api/phong/trong` - Danh sách phòng trống (Public)
```
Method: GET
Auth: Not required
Response: Chỉ phòng có trang_thai = 0
```

#### GET `/api/phong/:id_phong` - Chi tiết phòng (Auth required)
```
Method: GET
Auth: Required
Params: id_phong = 1
Response: {id_phong, ten_phong, gia_phong, ...}
```

#### POST `/api/phong` - Tạo phòng mới (Admin only)
```
Method: POST
Auth: Admin
Body: {
  "id_chu_tro": 5,
  "ten_phong": "Phòng A101",
  "gia_phong": 5000000,
  "mo_ta": "Mô tả phòng"
}
Validation:
  - ten_phong: 1-100 ký tự
  - gia_phong: số dương
Response: {message: "Tạo phòng thành công", data: {...}}
```

#### PUT `/api/phong/:id_phong` - Cập nhật phòng (Admin only)
```
Method: PUT
Auth: Admin
Body: {
  "ten_phong": "Phòng B101",
  "gia_phong": 5500000,
  "mo_ta": "Mô tả mới",
  "trang_thai": 1
}
```

#### DELETE `/api/phong/:id_phong` - Xóa phòng (Admin only)
```
Method: DELETE
Auth: Admin
Response: {message: "Xóa phòng thành công"}
```

---

### **2. HỢP ĐỒNG (HopDong - Booking)**

#### POST `/api/hopDong` - Đặt phòng (Auth required)
```
Method: POST
Auth: Required
Body: {
  "id_phong": 1,
  "id_nguoi_thue": 5,
  "ngay_bat_dau": "01-02-2026",
  "ngay_ket_thuc": "01-05-2026",
  "tien_coc": 1000000
}
Validation:
  - Ngày phải format DD-MM-YYYY
  - ngay_ket_thuc > ngay_bat_dau
  - tien_coc > 0
  - Phòng phải trang_thai = 0 (trống)
Response: {message: "Tạo hợp đồng thành công", hopDong: {...}}
Auto: Phòng tự động chuyển thành trang_thai = 1
```

#### GET `/api/hopDong` - Danh sách hợp đồng (Admin only)
```
Method: GET
Auth: Admin
Response: [{id_hop_dong, id_phong, id_nguoi_thue, ngay_bat_dau, ...}]
```

#### GET `/api/hopDong/:id_hop_dong` - Chi tiết hợp đồng (Auth required)
```
Method: GET
Auth: Required
```

#### PUT `/api/hopDong/:id_hop_dong` - Cập nhật hợp đồng (Admin only)
```
Method: PUT
Auth: Admin
Body: {ngay_bat_dau, ngay_ket_thuc, tien_coc, trang_thai}
```

#### DELETE `/api/hopDong/:id_hop_dong` - Hủy hợp đồng (Admin only)
```
Method: DELETE
Auth: Admin
Auto: Phòng tự động chuyển thành trang_thai = 0 (trống)
```

---

### **3. HÓA ĐƠN (HoaDon)**

#### GET `/api/hoaDon` - Danh sách hóa đơn (Admin only)
```
Method: GET
Auth: Admin
```

#### GET `/api/hoaDon/:id_hoa_don` - Chi tiết hóa đơn (Auth required)
```
Method: GET
Auth: Required
Response: {
  "id_hoa_don": 10,
  "id_phong": 1,
  "thang_nam": "02-2026",
  "so_dien_cu": 100,
  "so_dien_moi": 150,
  "so_nuoc_cu": 10,
  "so_nuoc_moi": 15,
  "tien_dien": 150000,
  "tien_nuoc": 100000,
  "tien_phong": 5000000,
  "tong_tien": 5250000,
  "trang_thai": 0,
  "ngay_tao": "2026-02-01"
}
```

#### POST `/api/hoaDon` - Tạo hóa đơn (Admin only)
```
Method: POST
Auth: Admin
Body: {
  "id_phong": 1,
  "thang_nam": "02-2026",
  "so_dien_cu": 100,
  "so_dien_moi": 150,
  "so_nuoc_cu": 10,
  "so_nuoc_moi": 15,
  "tien_dien": 150000,
  "tien_nuoc": 100000,
  "tien_phong": 5000000
}
Validation:
  - thang_nam format MM-YYYY
  - so_dien, so_nuoc >= 0
Response: Auto calculate tong_tien
```

#### PUT `/api/hoaDon/:id_hoa_don` - Cập nhật hóa đơn (Admin only)
```
Method: PUT
Auth: Admin
Body: {so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, trang_thai}
Auto: Recalculate tong_tien
```

#### DELETE `/api/hoaDon/:id_hoa_don` - Xóa hóa đơn (Admin only)
```
Method: DELETE
Auth: Admin
```

#### POST `/api/hoaDon/tinh/:id_phong` - Tính hóa đơn tự động (Public)
```
Method: POST
Auth: Not required
Body: {"thang_nam": "02-2026"}
Validation: thang_nam format MM-YYYY
Auto: Sử dụng gia_phong làm tien_phong
```

---

### **4. THANH TOÁN (ThanhToan)**

#### GET `/api/thanhToan` - Danh sách thanh toán (Admin only)
```
Method: GET
Auth: Admin
```

#### GET `/api/thanhToan/hoa_don/:id_hoa_don` - Thanh toán theo hóa đơn (Auth required)
```
Method: GET
Auth: Required
```

#### GET `/api/thanhToan/:id_thanh_toan` - Chi tiết thanh toán (Auth required)
```
Method: GET
Auth: Required
```

#### POST `/api/thanhToan` - Tạo thanh toán (Auth required)
```
Method: POST
Auth: Required
Body: {
  "id_hoa_don": 10,
  "so_tien": 5250000,
  "hinh_thuc": "chuyển khoản"
}
Validation:
  - so_tien > 0
  - hinh_thuc: tiền mặt | chuyển khoản | thẻ tín dụng | ví điện tử
Auto: Hóa đơn tự động trang_thai = 1
```

#### PUT `/api/thanhToan/:id_thanh_toan` - Cập nhật thanh toán (Admin only)
```
Method: PUT
Auth: Admin
Body: {so_tien, hinh_thuc, ngay_thanh_toan}
```

#### DELETE `/api/thanhToan/:id_thanh_toan` - Xóa thanh toán (Admin only)
```
Method: DELETE
Auth: Admin
Auto: Nếu không còn thanh toán, hóa đơn về trang_thai = 0
```

---

### **5. NGƯỜI THUÊ (NguoiThue)**

#### GET `/api/nguoiThue` - Danh sách người thuê (Admin only)
```
Method: GET
Auth: Admin
```

#### GET `/api/nguoiThue/:id_nguoi_thue` - Chi tiết người thuê (Auth required)
```
Method: GET
Auth: Required
```

#### POST `/api/nguoiThue` - Tạo người thuê (Admin only)
```
Method: POST
Auth: Admin
Body: {
  "ho_ten": "Nguyễn Văn A",
  "cccd": "123456789012",
  "so_dien_thoai": "0987654321",
  "email": "nguyenvana@example.com",
  "ngay_vao": "2026-02-01",
  "ngay_ra": "2026-05-01",
  "id_tai_khoan": 10
}
```

#### PUT `/api/nguoiThue/:id_nguoi_thue` - Cập nhật người thuê (Admin only)
```
Method: PUT
Auth: Admin
```

#### DELETE `/api/nguoiThue/:id_nguoi_thue` - Xóa người thuê (Admin only)
```
Method: DELETE
Auth: Admin
```

---

### **6. TÀI KHOẢN (TaiKhoan)**

#### GET `/api/taiKhoan` - Danh sách tài khoản (Admin only)
```
Method: GET
Auth: Admin
Response: Không chứa mat_khau
```

#### GET `/api/taiKhoan/:id_tai_khoan` - Chi tiết tài khoản (Auth required)
```
Method: GET
Auth: Required
Response: Không chứa mat_khau
```

#### POST `/api/taiKhoan` - Tạo tài khoản (Admin only)
```
Method: POST
Auth: Admin
Body: {
  "ten_dang_nhap": "user123",
  "mat_khau": "Pass1234",
  "vai_tro": "NGUOI_THUE"
}
Validation:
  - ten_dang_nhap: 4-20 ký tự, alphanumeric + underscore
  - mat_khau: min 6 ký tự, 1 chữ cái + 1 số
  - vai_tro: ADMIN | CHU_TRO | NGUOI_THUE
Response: Không trả mat_khau
```

#### PUT `/api/taiKhoan/:id_tai_khoan` - Cập nhật tài khoản (Auth/Admin)
```
Method: PUT
Auth: Required (user own or admin)
Body: {ten_dang_nhap, mat_khau, vai_tro, trang_thai}
Note: User chỉ cập nhật username, password; Admin cập nhật role, status
```

#### DELETE `/api/taiKhoan/:id_tai_khoan` - Xóa tài khoản (Admin only)
```
Method: DELETE
Auth: Admin
Safety: Không thể xóa admin cuối cùng
```

---

### **7. ADMIN - KIỂM TRA QUYỀN**

#### GET `/api/admin/check-permission` - Kiểm tra vai trò (Auth required)
```
Method: GET
Auth: Required
Response: {
  "isAdmin": true,
  "isChuTro": false,
  "isNguoiThue": false,
  "vai_tro": "ADMIN",
  "id_tai_khoan": 1,
  "ten_dang_nhap": "admin"
}
```

#### POST `/api/admin/check-action` - Kiểm tra quyền hành động (Auth required)
```
Method: POST
Auth: Required
Body: {
  "action": "delete_room",
  "target_id": 1
}
Response: {
  "allowed": true,
  "reason": "Bạn có quyền thực hiện hành động này",
  "vai_tro": "ADMIN",
  "action": "delete_room"
}
```

---

### **8. BÁO CÁO (BaoCao)**

#### GET `/api/baoCao/hoaDon` - Báo cáo hóa đơn PDF (Admin only)
```
Method: GET
Auth: Admin
Response: File PDF
```

#### GET `/api/baoCao/thanhToan` - Báo cáo thanh toán PDF (Admin only)
```
Method: GET
Auth: Admin
Response: File PDF
```

#### GET `/api/baoCao/doanhThu?startDate=01-02-2026&endDate=28-02-2026` - Báo cáo doanh thu (Admin only)
```
Method: GET
Auth: Admin
Query: startDate, endDate (DD-MM-YYYY)
Response: {
  "success": true,
  "data": {
    "tongDoanhThu": "10,250,000",
    "soLuongThanhToan": 5,
    "khoangThoiGian": "01-02-2026 đến 28-02-2026",
    "chiTiet": [...]
  }
}
```

#### GET `/api/baoCao/tongHop` - Báo cáo tổng hợp (Admin only)
```
Method: GET
Auth: Admin
Response: {
  "success": true,
  "data": {
    "phong": {"tong": 10, "trong": 3, "choThue": 7},
    "hoaDon": {"tong": 50, "chaThanhtoan": 5, "daThanhtoan": 45},
    "doanhThu": "500,000,000",
    "tongThanhToan": 45
  }
}
```

---

## ✅ STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | OK - Request thành công |
| 201 | Created - Resource được tạo |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Cần đăng nhập |
| 403 | Forbidden - Không có quyền |
| 404 | Not Found - Resource không tồn tại |
| 500 | Server Error - Lỗi server |

---

## 🔄 AUTO-UPDATE BEHAVIORS

| Action | Auto-Update |
|--------|------------|
| Tạo hợp đồng | Phòng: trang_thai 0 → 1 |
| Hủy hợp đồng | Phòng: trang_thai 1 → 0 |
| Tạo thanh toán | Hóa đơn: trang_thai 0 → 1 |
| Xóa thanh toán (cuối cùng) | Hóa đơn: trang_thai 1 → 0 |
| Cập nhật hóa đơn | Auto calc tong_tien |

---

## 📦 DATA TYPES

### trang_thai (Status)
- Phòng: 0 = Trống, 1 = Có người thuê
- Hóa đơn: 0 = Chưa thanh toán, 1 = Đã thanh toán, 2 = Nợ
- Hợp đồng: 0 = Hết hạn, 1 = Hoạt động
- Tài khoản: 0 = Inactive, 1 = Active

### vai_tro (Role)
- ADMIN: Quản trị viên
- CHU_TRO: Chủ trọ/Chủ nhà
- NGUOI_THUE: Người thuê

### hinh_thuc (Payment Method)
- tiền mặt
- chuyển khoản
- thẻ tín dụng
- ví điện tử

---

## 🚀 EXAMPLE WORKFLOWS

### Workflow 1: Đặt Phòng & Thanh Toán
```
1. GET /api/phong/trong (xem phòng trống)
2. POST /api/hopDong (đặt phòng)
   └─ Auto: Phòng → trang_thai = 1
3. POST /api/hoaDon/tinh/:id_phong (tạo hóa đơn)
4. POST /api/thanhToan (thanh toán)
   └─ Auto: Hóa đơn → trang_thai = 1
```

### Workflow 2: Admin Quản Lý
```
1. GET /api/admin/check-permission (kiểm tra role)
2. GET /api/phong (xem tất cả phòng)
3. POST /api/taiKhoan (tạo tài khoản người dùng)
4. GET /api/baoCao/doanhThu (xem doanh thu)
```

---

## ⚠️ NOTES

- Mật khẩu hiện lưu plaintext - **CẦN hash với bcrypt trong production**
- Tất cả response errors có key `error`
- Tất cả response success có key `message` (nếu có)
- Timestamp tự động: `ngay_tao`, `ngay_thanh_toan`

---

**Last Updated:** 2026-01-29
