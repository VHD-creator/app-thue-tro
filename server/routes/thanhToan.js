import express from 'express';
import ThanhToan from '../models/ThanhToan.js';
import HoaDon from '../models/HoaDon.js';
import NguoiThue from '../models/NguoiThue.js';

const router = express.Router();

// Middleware check user - kiểm tra xác minh người dùng
const checkUser = async (req, res, next) => {
  try {
    // Kiểm tra xem user có được authentication hay không
    if (!req.user && !req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Middleware check admin role - phân quyền người dùng
const checkAdminRole = async (req, res, next) => {
  try {
    const userId = req.user?.id_tai_khoan || req.session?.userId;
    const user = await NguoiThue.findByPk(userId, { raw: true });
    
    if (!user) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả thanh toán (Admin only)
router.get('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      include: [
        { model: HoaDon, as: 'HoaDon' }
      ]
    });
    res.json({ success: true, data: thanhToans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy thanh toán theo ID
router.get('/:id_thanh_toan', checkUser, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan, {
      include: [
        { model: HoaDon, as: 'HoaDon' }
      ]
    });
    if (!thanhToan) {
      return res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
    res.json({ success: true, data: thanhToan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo thanh toán mới
router.post('/', checkUser, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.create(req.body);

    // Cập nhật trạng thái hóa đơn thành '1' (Đã trả)
    await HoaDon.update({ trang_thai: 1 }, { where: { id_hoa_don: req.body.id_hoa_don } });

    res.status(201).json({ success: true, data: thanhToan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật thanh toán
router.put('/:id_thanh_toan', checkUser, checkAdminRole, async (req, res) => {
  try {
    const [updated] = await ThanhToan.update(req.body, { where: { id_thanh_toan: req.params.id_thanh_toan } });
    if (updated) {
      const updatedThanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan);
      res.json({ success: true, data: updatedThanhToan });
    } else {
      res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa thanh toán
router.delete('/:id_thanh_toan', checkUser, checkAdminRole, async (req, res) => {
  try {
    const deleted = await ThanhToan.destroy({ where: { id_thanh_toan: req.params.id_thanh_toan } });
    if (deleted) {
      res.json({ success: true, message: 'Thanh toán đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API lấy danh sách thanh toán theo hóa đơn của phòng
router.get('/hoa_don/:id_hoa_don', checkUser, async (req, res) => {
  try {
    const id_hoa_don = req.params.id_hoa_don;
    
    const thanhToans = await ThanhToan.findAll({
      where: { id_hoa_don },
      include: [
        { model: HoaDon, as: 'HoaDon' }
      ]
    });
    
    res.json({ success: true, data: thanhToans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;