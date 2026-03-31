import express from 'express';
import bcrypt from 'bcryptjs';
import { TaiKhoan, ChuTro, NguoiThue } from '../models/quanHe.js';
import {
  verifyToken,
  requireAdmin,
  requireAuthenticated
} from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ QUAN TRỌNG: Route cụ thể PHẢI đặt TRƯỚC /:id_tai_khoan

// ==================== ADMIN ====================

// GET /api/taiKhoan - Xem tất cả tài khoản
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoans = await TaiKhoan.findAll({
      attributes: { exclude: ['mat_khau'] },
      include: [
        { model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'email', 'so_dien_thoai'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten', 'email', 'so_dien_thoai'] }
      ],
      order: [['id_tai_khoan', 'ASC']]
    });
    res.json(taiKhoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/taiKhoan/theo-vai-tro/:vai_tro - Lọc theo vai trò
// ⚠️ PHẢI đặt TRƯỚC /:id_tai_khoan
router.get('/theo-vai-tro/:vai_tro', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { vai_tro } = req.params;
    const validRoles = ['ADMIN', 'CHU_TRO', 'NGUOI_THUE'];

    if (!validRoles.includes(vai_tro)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }

    const taiKhoans = await TaiKhoan.findAll({
      where: { vai_tro },
      attributes: { exclude: ['mat_khau'] },
      include: [
        { model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'email', 'so_dien_thoai'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten', 'email', 'so_dien_thoai'] }
      ]
    });

    res.json(taiKhoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/taiKhoan/:id_tai_khoan - Chi tiết (PHẢI đặt SAU các route cụ thể)
router.get('/:id_tai_khoan', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN' && req.userId !== parseInt(req.params.id_tai_khoan)) {
      return res.status(403).json({ error: 'Bạn chỉ có thể xem tài khoản của mình' });
    }

    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan, {
      attributes: { exclude: ['mat_khau'] }
    });

    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    res.json(taiKhoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/taiKhoan - Tạo tài khoản mới
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

    if (!ten_dang_nhap || !mat_khau || !vai_tro) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: ten_dang_nhap, mat_khau, vai_tro' });
    }

    const validRoles = ['ADMIN', 'CHU_TRO', 'NGUOI_THUE'];
    if (!validRoles.includes(vai_tro)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }

    const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
    if (existingUser) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });

    const hashedPassword = await bcrypt.hash(mat_khau, 10);
    const taiKhoan = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau: hashedPassword,
      vai_tro,
      trang_thai: trang_thai ?? 1
    });

    const { mat_khau: _, ...result } = taiKhoan.toJSON();
    res.status(201).json({ message: 'Tạo tài khoản thành công', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT /api/taiKhoan/:id_tai_khoan/khoa - Khóa tài khoản
// ⚠️ PHẢI đặt TRƯỚC PUT /:id_tai_khoan
router.put('/:id_tai_khoan/khoa', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    if (taiKhoan.vai_tro === 'ADMIN') {
      return res.status(400).json({ error: 'Không thể khóa tài khoản Admin' });
    }

    if (taiKhoan.trang_thai === 0) {
      return res.status(400).json({ error: 'Tài khoản đã bị khóa rồi' });
    }

    await taiKhoan.update({ trang_thai: 0 });
    res.json({ message: 'Khóa tài khoản thành công', id_tai_khoan: taiKhoan.id_tai_khoan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT /api/taiKhoan/:id_tai_khoan/mo-khoa - Mở khóa tài khoản
router.put('/:id_tai_khoan/mo-khoa', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    if (taiKhoan.trang_thai === 1) {
      return res.status(400).json({ error: 'Tài khoản đang hoạt động rồi' });
    }

    await taiKhoan.update({ trang_thai: 1 });
    res.json({ message: 'Mở khóa tài khoản thành công', id_tai_khoan: taiKhoan.id_tai_khoan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT /api/taiKhoan/:id_tai_khoan/doi-mat-khau - Admin reset mật khẩu
router.put('/:id_tai_khoan/doi-mat-khau', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { mat_khau_moi } = req.body;

    if (!mat_khau_moi || mat_khau_moi.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
    await taiKhoan.update({ mat_khau: hashedPassword });

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/taiKhoan/:id_tai_khoan - Cập nhật tài khoản (PHẢI đặt SAU các route cụ thể)
router.put('/:id_tai_khoan', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    if (req.userRole !== 'ADMIN' && req.userId !== parseInt(req.params.id_tai_khoan)) {
      return res.status(403).json({ error: 'Bạn chỉ có thể cập nhật tài khoản của mình' });
    }

    const { ten_dang_nhap, vai_tro, trang_thai } = req.body;

    if (req.userRole !== 'ADMIN' && (vai_tro !== undefined || trang_thai !== undefined)) {
      return res.status(403).json({ error: 'Chỉ admin mới được thay đổi vai trò hoặc trạng thái' });
    }

    if (ten_dang_nhap && ten_dang_nhap !== taiKhoan.ten_dang_nhap) {
      const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
      if (existingUser) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      taiKhoan.ten_dang_nhap = ten_dang_nhap;
    }

    if (vai_tro) taiKhoan.vai_tro = vai_tro;
    if (trang_thai !== undefined) taiKhoan.trang_thai = trang_thai;

    await taiKhoan.save();
    const { mat_khau: _, ...result } = taiKhoan.toJSON();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/taiKhoan/:id_tai_khoan
router.delete('/:id_tai_khoan', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

    if (taiKhoan.vai_tro === 'ADMIN') {
      const adminCount = await TaiKhoan.count({ where: { vai_tro: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Không thể xóa tài khoản admin cuối cùng' });
      }
    }

    await taiKhoan.destroy();
    res.json({ message: 'Xóa tài khoản thành công', id_tai_khoan: Number(req.params.id_tai_khoan) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;