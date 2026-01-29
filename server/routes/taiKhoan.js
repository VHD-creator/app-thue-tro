import express from 'express';
import TaiKhoan from '../models/TaiKhoan.js';
import {
  verifyToken,
  requireAdmin,
  requireAuthenticated
} from '../middlewares/auth.js';
import {
  validateUsername,
  validatePassword,
  validateRole
} from '../utils/validators.js';

const router = express.Router();

/* ================================
   GET /api/taiKhoan (ADMIN)
================================ */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoans = await TaiKhoan.findAll({
      attributes: { exclude: ['mat_khau'] }
    });
    res.json(taiKhoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   GET /api/taiKhoan/:id
================================ */
router.get('/:id_tai_khoan', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan, {
      attributes: { exclude: ['mat_khau'] }
    });

    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // Admin xem tất cả, user chỉ xem chính mình
    if (
      req.userRole !== 'ADMIN' &&
      req.userId !== parseInt(req.params.id_tai_khoan)
    ) {
      return res.status(403).json({ error: 'Bạn chỉ có thể xem tài khoản của mình' });
    }

    res.json(taiKhoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   POST /api/taiKhoan (ADMIN)
================================ */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

    if (!ten_dang_nhap || !mat_khau || !vai_tro) {
      return res.status(400).json({
        error: 'Thiếu dữ liệu: ten_dang_nhap, mat_khau, vai_tro'
      });
    }

    if (!validateUsername(ten_dang_nhap)) {
      return res.status(400).json({ error: 'Tên đăng nhập không hợp lệ' });
    }

    if (!validatePassword(mat_khau)) {
      return res.status(400).json({ error: 'Mật khẩu không hợp lệ' });
    }

    if (!validateRole(vai_tro)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }

    const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const taiKhoan = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau,
      vai_tro,
      trang_thai: trang_thai ?? 1
    });

    res.status(201).json(taiKhoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   PUT /api/taiKhoan/:id
================================ */
router.put('/:id_tai_khoan', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // User chỉ sửa mình, admin sửa tất cả
    if (
      req.userRole !== 'ADMIN' &&
      req.userId !== parseInt(req.params.id_tai_khoan)
    ) {
      return res.status(403).json({ error: 'Bạn chỉ có thể cập nhật tài khoản của mình' });
    }

    // User thường không được đổi role/trạng thái
    if (
      req.userRole !== 'ADMIN' &&
      (vai_tro !== undefined || trang_thai !== undefined)
    ) {
      return res.status(403).json({
        error: 'Chỉ admin mới được thay đổi vai trò hoặc trạng thái'
      });
    }

    if (ten_dang_nhap && ten_dang_nhap !== taiKhoan.ten_dang_nhap) {
      const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
      if (existingUser) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }
      taiKhoan.ten_dang_nhap = ten_dang_nhap;
    }

    if (mat_khau) taiKhoan.mat_khau = mat_khau;
    if (vai_tro) taiKhoan.vai_tro = vai_tro;
    if (trang_thai !== undefined) taiKhoan.trang_thai = trang_thai;

    await taiKhoan.save();
    res.json(taiKhoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   DELETE /api/taiKhoan/:id (ADMIN)
================================ */
router.delete('/:id_tai_khoan', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    if (taiKhoan.vai_tro === 'ADMIN') {
      const adminCount = await TaiKhoan.count({ where: { vai_tro: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Không thể xóa tài khoản admin cuối cùng'
        });
      }
    }

    await taiKhoan.destroy();
    res.json({ id_tai_khoan: Number(req.params.id_tai_khoan) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
