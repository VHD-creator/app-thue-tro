import express from 'express';
import Phong from '../models/Phong.js';
import NguoiThue from '../models/NguoiThue.js';
import { validatePrice, validateStringLength, validateStatus } from '../utils/validators.js';

const router = express.Router();

// Middleware check user
const checkUser = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  next();
};

// Middleware check admin role
const checkAdminRole = async (req, res, next) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.session.userId);
    if (!taiKhoan || taiKhoan.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/phong/trong - Danh sách phòng trống (public)
router.get('/trong', async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      where: { trang_thai: 0 }
    });

    res.json({
      success: true,
      count: dsPhongTrong.length,
      data: dsPhongTrong
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong - Danh sách tất cả phòng (public)
router.get('/', async (req, res) => {
  try {
    const data = await Phong.findAll();
    res.json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/:id_phong - Chi tiết phòng (auth)
router.get('/:id_phong', checkUser, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/phong - Tạo phòng mới (admin)
router.post('/', checkAdminRole, async (req, res) => {
  try {
    const { id_chu_tro, ten_phong, gia_phong, mo_ta } = req.body;

    // Validation
    if (!id_chu_tro || !ten_phong || !gia_phong) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: id_chu_tro, ten_phong, gia_phong' 
      });
    }

    if (!validateStringLength(ten_phong, 1, 100)) {
      return res.status(400).json({ error: 'ten_phong phải từ 1-100 ký tự' });
    }

    if (!validatePrice(gia_phong)) {
      return res.status(400).json({ error: 'gia_phong phải là số dương' });
    }

    const room = await Phong.create({
      id_chu_tro,
      ten_phong,
      gia_phong,
      mo_ta: mo_ta || '',
      trang_thai: 0
    });

    res.status(201).json({
      message: 'Tạo phòng thành công',
      data: room
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/phong/:id_phong - Cập nhật phòng (admin)
router.put('/:id_phong', checkAdminRole, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    const { ten_phong, gia_phong, mo_ta, trang_thai } = req.body;

    // Validation
    if (ten_phong && !validateStringLength(ten_phong, 1, 100)) {
      return res.status(400).json({ error: 'ten_phong phải từ 1-100 ký tự' });
    }

    if (gia_phong && !validatePrice(gia_phong)) {
      return res.status(400).json({ error: 'gia_phong phải là số dương' });
    }

    if (trang_thai !== undefined && !validateStatus(trang_thai)) {
      return res.status(400).json({ error: 'trang_thai phải là 0 hoặc 1' });
    }

    if (ten_phong) room.ten_phong = ten_phong;
    if (gia_phong) room.gia_phong = gia_phong;
    if (mo_ta) room.mo_ta = mo_ta;
    if (trang_thai !== undefined) room.trang_thai = trang_thai;

    await room.save();

    res.json({
      message: 'Cập nhật phòng thành công',
      data: room
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/phong/:id_phong - Xóa phòng (admin)
router.delete('/:id_phong', checkAdminRole, async (req, res) => {
  try {
    const deleted = await Phong.destroy({ where: { id_phong: req.params.id_phong } });
    if (deleted) {
      res.json({ message: 'Xóa phòng thành công' });
    } else {
      res.status(404).json({ error: 'Phòng không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
