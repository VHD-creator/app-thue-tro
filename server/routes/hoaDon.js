import express from 'express';
import HoaDon from '../models/HoaDon.js';
import Phong from '../models/Phong.js';
import TaiKhoan from '../models/TaiKhoan.js';
import { validateAmount, validateMonthYear, validateBillStatus } from '../utils/validators.js';

const router = express.Router();


// Middleware: Check authentication
const checkUser = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  next();
};

// Middleware: Check admin role
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

// GET /api/hoaDon - Danh sách hóa đơn (admin only)
router.get('/', checkAdminRole, async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
      include: [
        { model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] }
      ]
    });
    res.json({ count: hoaDons.length, data: hoaDons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hoaDon/:id_hoa_don - Chi tiết hóa đơn (auth)
router.get('/:id_hoa_don', checkUser, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [
        { model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] }
      ]
    });
    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }
    res.json(hoaDon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hoaDon - Tạo hóa đơn mới (admin only)
router.post('/', checkAdminRole, async (req, res) => {
  try {
    const { id_phong, thang_nam, so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, trang_thai } = req.body;

    // Validation
    if (!id_phong || !thang_nam) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: id_phong, thang_nam' });
    }

    if (!validateMonthYear(thang_nam)) {
      return res.status(400).json({ error: 'thang_nam phải có định dạng MM-YYYY' });
    }

    // Validate amounts
    if (so_dien_cu !== undefined || so_dien_moi !== undefined) {
      if (so_dien_cu < 0 || so_dien_moi < 0) {
        return res.status(400).json({ error: 'Chỉ số điện phải >= 0' });
      }
    }

    if (so_nuoc_cu !== undefined || so_nuoc_moi !== undefined) {
      if (so_nuoc_cu < 0 || so_nuoc_moi < 0) {
        return res.status(400).json({ error: 'Chỉ số nước phải >= 0' });
      }
    }

    // Create bill
    const hoaDon = await HoaDon.create({
      id_phong,
      thang_nam,
      so_dien_cu: so_dien_cu || 0,
      so_dien_moi: so_dien_moi || 0,
      so_nuoc_cu: so_nuoc_cu || 0,
      so_nuoc_moi: so_nuoc_moi || 0,
      tien_dien: tien_dien || 0,
      tien_nuoc: tien_nuoc || 0,
      tien_phong: tien_phong || 0,
      tong_tien: (tien_dien || 0) + (tien_nuoc || 0) + (tien_phong || 0),
      trang_thai: trang_thai || 0
    });

    res.status(201).json({
      message: 'Tạo hóa đơn thành công',
      data: hoaDon
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hoaDon/:id_hoa_don - Cập nhật hóa đơn (admin only)
router.put('/:id_hoa_don', checkAdminRole, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don);
    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }

    const { so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, trang_thai } = req.body;

    // Validation
    if (trang_thai !== undefined && !validateBillStatus(trang_thai)) {
      return res.status(400).json({ error: 'trang_thai phải là 0, 1 hoặc 2' });
    }

    // Update fields if provided
    if (so_dien_cu !== undefined) hoaDon.so_dien_cu = so_dien_cu;
    if (so_dien_moi !== undefined) hoaDon.so_dien_moi = so_dien_moi;
    if (so_nuoc_cu !== undefined) hoaDon.so_nuoc_cu = so_nuoc_cu;
    if (so_nuoc_moi !== undefined) hoaDon.so_nuoc_moi = so_nuoc_moi;
    if (tien_dien !== undefined) hoaDon.tien_dien = tien_dien;
    if (tien_nuoc !== undefined) hoaDon.tien_nuoc = tien_nuoc;
    if (tien_phong !== undefined) hoaDon.tien_phong = tien_phong;
    if (trang_thai !== undefined) hoaDon.trang_thai = trang_thai;

    // Recalculate total
    hoaDon.tong_tien = (hoaDon.tien_dien || 0) + (hoaDon.tien_nuoc || 0) + (hoaDon.tien_phong || 0);

    await hoaDon.save();

    res.json({
      message: 'Cập nhật hóa đơn thành công',
      data: hoaDon
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hoaDon/:id_hoa_don - Xóa hóa đơn (admin only)
router.delete('/:id_hoa_don', checkAdminRole, async (req, res) => {
  try {
    const deleted = await HoaDon.destroy({ where: { id_hoa_don: req.params.id_hoa_don } });
    if (deleted) {
      res.json({ message: 'Xóa hóa đơn thành công' });
    } else {
      res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hoaDon/tinh/:id_phong - Tính toán hóa đơn tự động cho phòng (public)
router.post('/tinh/:id_phong', async (req, res) => {
  try {
    const { id_phong } = req.params;
    const { thang_nam } = req.body;

    if (!thang_nam) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: thang_nam' });
    }

    if (!validateMonthYear(thang_nam)) {
      return res.status(400).json({ error: 'thang_nam phải có định dạng MM-YYYY' });
    }

    // Lấy thông tin phòng
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    // Tạo hóa đơn mới
    const hoaDon = await HoaDon.create({
      id_phong,
      thang_nam,
      so_dien_cu: 0,
      so_dien_moi: 0,
      so_nuoc_cu: 0,
      so_nuoc_moi: 0,
      tien_dien: 0,
      tien_nuoc: 0,
      tien_phong: phong.gia_phong,
      tong_tien: phong.gia_phong,
      trang_thai: 0
    });

    res.status(201).json({
      message: 'Tạo hóa đơn thành công',
      data: hoaDon
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;