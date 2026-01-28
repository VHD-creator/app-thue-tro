import express from 'express';
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

// Lấy tất cả người thuê (Admin only)
router.get('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const tenants = await NguoiThue.findAll();
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy người thuê theo ID
router.get('/:id_nguoi_thue', checkUser, async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo người thuê mới (Admin only)
router.post('/', checkUser, checkAdminRole, async (req, res) => {
  try {
    const tenant = await NguoiThue.create(req.body);
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật người thuê (Admin only)
router.put('/:id_nguoi_thue', checkUser, checkAdminRole, async (req, res) => {
  try {
    const [updated] = await NguoiThue.update(req.body, { where: { id_nguoi_thue: req.params.id_nguoi_thue } });
    if (updated) {
      const updatedTenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
      res.json({ success: true, data: updatedTenant });
    } else {
      res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa người thuê (Admin only)
router.delete('/:id_nguoi_thue', checkUser, checkAdminRole, async (req, res) => {
  try {
    const deleted = await NguoiThue.destroy({ where: { id_nguoi_thue: req.params.id_nguoi_thue } });
    if (deleted) {
      res.json({ success: true, message: 'Người thuê đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;