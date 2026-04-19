# Tóm tắt thay đổi - Code Review Fixes

**Ngày**: 19/04/2026
**Phiên bản**: v1.1 (Security & Logic improvements)

## 📋 Danh sách các sửa lỗi

### 1. **Authentication & Verification** ✅
**File**: `server/routes/auth.js`

- Thêm route: `GET /api/auth/verify-email/:token`
  - Xác thực email chủ trọ
  - Kích hoạt tài khoản (`trang_thai = 0` → `1`)
  - Token có hiệu lực 24h

- Thêm route: `POST /api/auth/resend-verification`
  - Gửi lại email xác thực
  - Tạo token mới

**Tác dụng**: Chủ trọ phải xác thực email mới có thể đăng nhập và sử dụng hệ thống

---

### 2. **Upload Ảnh & Chống Trùng Lặp** ✅
**File**: 
- `server/routes/hinhAnhPhong.js`
- `server/models/HinhAnhPhong.js`
- `server/middlewares/auth.js`

- Thêm trường `file_hash` (SHA-256) vào model
- Kiểm tra hash trước upload:
  - Nếu ảnh trùng ở phòng khác của chủ trọ khác → từ chối
  - Nếu trùng ở phòng của cùng chủ trọ → cho phép
  
- Thêm middleware: `requireChuTroVerified`
  - Chỉ chủ trọ xác thực mới upload ảnh
  - Trả lỗi 403 nếu chưa xác thực email/SĐT

**Tác dụng**: Chặn chủ trọ giả mạo lấy ảnh của chủ trọ khác

---

### 3. **Tạo phòng với xác thực** ✅
**File**: `server/routes/phong.js`

- Thêm middleware: `requireChuTroVerified` vào route `POST /api/phong`
- Chỉ chủ trọ xác thực mới được tạo phòng mới

**Tác dụng**: Đảm bảo chỉ chủ trọ hợp lệ mới có thể đăng phòng

---

### 4. **Thanh toán với kiểm tra quyền** ✅
**File**: `server/routes/thanhToan.js`

Sửa logic `POST /api/thanhToan`:
- Thêm kiểm tra ownership:
  - Chủ trọ chỉ thanh toán hóa đơn của phòng mình
  - Admin có thể thanh toán bất kỳ

- Sửa tính toán partial payment:
  - Lấy tổng thanh toán hiện tại + thanh toán mới
  - Chỉ đánh `PAID (1)` nếu `tổng >= tổng tiền`
  - Nếu `tổng < tổng tiền` → vẫn chưa thanh toán

- Response trả về thêm:
  - `so_tien_thanh_toan` (số tiền vừa thanh toán)
  - `tong_da_thanh_toan` (tổng đã thanh toán)
  - `trang_thai` (Đã thanh toán đủ / Chưa thanh toán đủ)

**Tác dụng**: Chặn người khác thanh toán hóa đơn; tính toán đúng trạng thái hóa đơn

---

### 5. **Cố định lỗi file size** ✅
**File**: `server/middlewares/upload.js`

- Sửa thông báo lỗi từ `5MB` → `10MB` (match với limit thực tế)

**Tác dụng**: Thông báo lỗi chính xác cho người dùng

---

### 6. **Tối ưu Server Setup** ✅
**File**: `server/app.js`

- Xóa import dư thừa: `bodyParser`
- Loại bỏ `app.use(bodyParser.json())` và `app.use(bodyParser.urlencoded())`
- Dùng express built-in: `express.json()` và `express.urlencoded()`
- Sửa `extended: false` → `extended: true` (để hỗ trợ nested objects)

**Tác dụng**: Giảm dependency, tối ưu performance

---

### 7. **Tối ưu Chatbot** ✅
**File**: `server/services/geminiService.js`

- Sửa query: Chỉ load 20 phòng trống đầu tiên (thay vì toàn bộ)
- Thêm filter: `where: { trang_thai: 0 }` (chỉ phòng trống)
- Giới hạn: `limit: 20`

**Tác dụng**: 
- Giảm thời gian response
- Tiết kiệm chi phí API Gemini
- Chatbot vẫn hoạt động tốt với dữ liệu quan trọng

---

## 📊 Tóm tắt thay đổi

| File | Thay đổi | Tác dụng |
|------|----------|---------|
| auth.js | +verify-email, +resend-verification | ✅ Xác thực chủ trọ |
| hinhAnhPhong.js | +hash check, +middleware | ✅ Chặn ảnh trùng & fake landlord |
| phong.js | +middleware xác thực | ✅ Chỉ chủ trọ hợp lệ tạo phòng |
| thanhToan.js | +ownership check, +partial payment | ✅ Tính toán & quyền hạn |
| upload.js | Sửa message | ✅ Lỗi chính xác |
| app.js | Xóa bodyParser dư thừa | ✅ Tối ưu |
| geminiService.js | Limit 20 phòng | ✅ Performance |
| ChuTro.js | Model no change (đã sửa trước) | ✅ Hỗ trợ xác thực |

---

## 🔧 Cần làm kế tiếp

1. **Cập nhật Database** (xem MIGRATION_GUIDE.md)
   ```bash
   # Chạy SQL migration
   ```

2. **Test toàn bộ flow**
   ```bash
   # Đăng ký CHU_TRO
   # → Xác thực email
   # → Upload ảnh
   # → Tạo phòng
   # → Xử lý thanh toán
   ```

3. **Deploy** (sau khi test)

---

## ✅ Các vấn đề đã xử lý

- [x] Email verification cho chủ trọ
- [x] Chặn ảnh trùng từ chủ trọ khác (dùng hash)
- [x] Middleware xác thực cho upload/tạo phòng
- [x] Kiểm tra quyền thanh toán
- [x] Tính toán partial payment
- [x] Xóa body-parser dư thừa
- [x] Tối ưu chatbot

---

## ⚠️ Lưu ý

- `file_hash` cần migration DB
- Email verification token hết hạn sau 24h
- Chủ trọ phải xác thực email & SĐT mới upload/tạo phòng được
- Thanh toán partial được hỗ trợ nhưng hóa đơn chỉ `PAID` khi đủ tiền
