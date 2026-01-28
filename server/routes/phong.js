import express from 'express';
import Phong from '../models/Phong.js';
import NguoiThue from '../models/NguoiThue.js';

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

// ✅ Danh sách phòng trống (trang_thai = 0)
router.get('/trong', checkUser, async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      where: {
        trang_thai: 0
      }
    });

    res.json({
      success: true,
      count: dsPhongTrong.length,
      data: dsPhongTrong
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ Tất cả phòng (Admin only)
router.get('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const data = await Phong.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy phòng theo ID
router.get('/:id', checkUser, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo phòng mới (Admin only)
router.post('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const room = await Phong.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật phòng (Admin only)
router.put('/:id', checkUser, checkAdminRole, async (req, res) => {
  try {
    const [updated] = await Phong.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedRoom = await Phong.findByPk(req.params.id);
      res.json({ success: true, data: updatedRoom });
    } else {
      res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa phòng (Admin only)
router.delete('/:id', checkUser, checkAdminRole, async (req, res) => {
  try {
    const deleted = await Phong.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Phòng đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
