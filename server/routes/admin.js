import express from 'express';
import TaiKhoan from '../models/TaiKhoan.js';

const router = express.Router();

// Middleware check user - kiểm tra xác minh người dùng
const checkUser = async (req, res, next) => {
  try {
    if (!req.user && !req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ API check quyền Admin
// GET /api/admin/check-permission
// Response: { isAdmin: true/false, vai_tro: "ADMIN" / "CHU_TRO" / "NGUOI_THUE" }
router.get('/check-permission', checkUser, async (req, res) => {
  try {
    const userId = req.user?.id_tai_khoan || req.session?.userId;
    
    // Lấy thông tin tài khoản
    const taiKhoan = await TaiKhoan.findByPk(userId);
    
    if (!taiKhoan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tài khoản không tồn tại',
        isAdmin: false 
      });
    }

    // Kiểm tra xem có phải admin không
    // vai_tro: "ADMIN", "CHU_TRO" hoặc "NGUOI_THUE"
    const isAdmin = taiKhoan.vai_tro === 'ADMIN';
    const isChuTro = taiKhoan.vai_tro === 'CHU_TRO';
    const isNguoiThue = taiKhoan.vai_tro === 'NGUOI_THUE';

    res.json({ 
      success: true, 
      isAdmin,
      isChuTro,
      isNguoiThue,
      vai_tro: taiKhoan.vai_tro,
      id_tai_khoan: taiKhoan.id_tai_khoan,
      message: isAdmin ? 'Bạn là Admin' : `Bạn là ${taiKhoan.vai_tro}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      isAdmin: false 
    });
  }
});

// ✅ API check quyền perform action
// POST /api/admin/check-action
// Body: { action: "delete_room", target_id: 5 }
// Response: { allowed: true/false, reason: "..." }
router.post('/check-action', checkUser, async (req, res) => {
  try {
    const userId = req.user?.id_tai_khoan || req.session?.userId;
    const { action, target_id } = req.body;

    // Lấy thông tin tài khoản
    const taiKhoan = await TaiKhoan.findByPk(userId);
    
    if (!taiKhoan) {
      return res.status(404).json({ 
        success: false, 
        allowed: false,
        reason: 'Tài khoản không tồn tại'
      });
    }

    const isAdmin = taiKhoan.vai_tro === 'ADMIN';

    // Định nghĩa các action
    // CHU_TRO được làm: quản lý phòng, hóa đơn
    // NGUOI_THUE được làm: xem phòng, xem hóa đơn, tạo thanh toán
    // ADMIN được làm: tất cả
    
    const chuTroActions = ['view_rooms', 'create_room', 'edit_room', 'delete_room', 'view_bills', 'create_bill', 'edit_bill', 'delete_bill'];
    const nguoiThueActions = ['view_rooms', 'view_bills', 'view_payments', 'create_payment'];
    const adminAllActions = ['view_rooms', 'create_room', 'edit_room', 'delete_room', 'view_bills', 'create_bill', 'edit_bill', 'delete_bill', 'delete_payment', 'edit_payment', 'manage_users'];

    let allowed = false;
    let reason = '';

    if (isAdmin) {
      // Admin được làm tất cả
      allowed = true;
      reason = 'Admin được thực hiện thao tác này';
    } else if (taiKhoan.vai_tro === 'CHU_TRO') {
      if (chuTroActions.includes(action)) {
        allowed = true;
        reason = 'Chủ trọ được thực hiện thao tác này';
      } else {
        allowed = false;
        reason = `Chủ trọ không có quyền ${action}`;
      }
    } else if (taiKhoan.vai_tro === 'NGUOI_THUE') {
      if (nguoiThueActions.includes(action)) {
        allowed = true;
        reason = 'Người thuê được thực hiện thao tác này';
      } else {
        allowed = false;
        reason = `Người thuê không có quyền ${action}. Liên hệ chủ trọ hoặc admin`;
      }
    } else {
      allowed = false;
      reason = 'Vai trò không xác định';
    }

    res.json({
      success: true,
      allowed,
      reason,
      vai_tro: taiKhoan.vai_tro,
      action
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      allowed: false,
      message: error.message
    });
  }
});

export default router;
