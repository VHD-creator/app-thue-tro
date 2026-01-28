import express from 'express';
import HoaDon from '../models/HoaDon.js';
import NguoiThue from '../models/NguoiThue.js';
import Phong from '../models/Phong.js';

const router = express.Router();

// Middleware check user
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

// Middleware check admin role
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

// Lấy tất cả hóa đơn (Admin only)
router.get('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
      include: [
        { model: Phong, as: 'Phong' }
      ]
    });
    res.json({ success: true, data: hoaDons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy hóa đơn theo ID
router.get('/:id_hoa_don', checkUser, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [
        { model: Phong, as: 'Phong' }
      ]
    });
    if (!hoaDon) {
      return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
    res.json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo hóa đơn mới (Admin only)
router.post('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const hoaDon = await HoaDon.create(req.body);
    res.status(201).json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật hóa đơn (Admin only)
router.put('/:id_hoa_don', checkUser, checkAdminRole, async (req, res) => {
  try {
    const [updated] = await HoaDon.update(req.body, { where: { id_hoa_don: req.params.id_hoa_don } });
    if (updated) {
      const updatedHoaDon = await HoaDon.findByPk(req.params.id_hoa_don);
      res.json({ success: true, data: updatedHoaDon });
    } else {
      res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa hóa đơn (Admin only)
router.delete('/:id_hoa_don', checkUser, checkAdminRole, async (req, res) => {
  try {
    const deleted = await HoaDon.destroy({ where: { id_hoa_don: req.params.id_hoa_don } });
    if (deleted) {
      res.json({ success: true, message: 'Hóa đơn đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tính toán hóa đơn tự động cho phòng
router.post('/tinh/:id_phong', async (req, res) => {
  try {
    const { id_phong } = req.params;
    const { thang_nam } = req.body;

    // Lấy thông tin phòng
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }

    // Tạo hóa đơn mới
    const hoaDon = await HoaDon.create({
      id_phong,
      thang_nam,
      so_dien_cu: 0,
      so_dien_moi: 0,
      so_nuoc_cu: 0,
      so_nuoc_moi: 0,
      tien_phong: phong.gia_phong
    });

    res.status(201).json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;