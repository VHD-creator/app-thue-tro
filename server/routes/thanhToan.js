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
router.get('/:id', checkUser, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id, {
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
router.put('/:id', checkUser, checkAdminRole, async (req, res) => {
  try {
    const [updated] = await ThanhToan.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedThanhToan = await ThanhToan.findByPk(req.params.id);
      res.json({ success: true, data: updatedThanhToan });
    } else {
      res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa thanh toán
router.delete('/:id', checkUser, checkAdminRole, async (req, res) => {
  try {
    const deleted = await ThanhToan.destroy({ where: { id: req.params.id } });
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
router.get('/phong/:id_phong', checkUser, async (req, res) => {
  try {
    const id_phong = req.params.id_phong;
    
    const thanhToans = await ThanhToan.findAll({
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          where: { id_phong: id_phong }
        }
      ]
    });
    
    res.json({ success: true, data: thanhToans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;