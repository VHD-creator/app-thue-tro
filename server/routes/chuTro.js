import express from 'express';
import { ChuTro, Phong } from '../models/quanHe.js';
import {
  verifyToken,
  requireChuTroOrAdmin,
  requireAdmin
} from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ QUAN TRỌNG: Route cụ thể PHẢI đặt TRƯỚC /:id_chu_tro

// ==================== CHỦ TRỌ ====================

// GET /api/chuTro/profile - Chủ trọ xem thông tin cá nhân
router.get('/profile', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
    if (!chuTro) return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });
    res.json(chuTro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/chuTro/profile - Chủ trọ cập nhật thông tin cá nhân
router.put('/profile', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
    if (!chuTro) return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });

    const { ho_ten, so_dien_thoai, email, dia_chi } = req.body;

    if (email && email !== chuTro.email) {
      const emailExist = await ChuTro.findOne({ where: { email } });
      if (emailExist) return res.status(400).json({ error: 'Email đã được sử dụng bởi chủ trọ khác' });
      chuTro.email = email;
    }

    if (ho_ten) chuTro.ho_ten = ho_ten;
    if (so_dien_thoai) chuTro.so_dien_thoai = so_dien_thoai;
    if (dia_chi) chuTro.dia_chi = dia_chi;

    await chuTro.save();
    res.json({ message: 'Cập nhật thông tin thành công', data: chuTro });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ====================

// GET /api/chuTro - Admin xem danh sách tất cả chủ trọ
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const chuTros = await ChuTro.findAll({ order: [['ngay_tao', 'DESC']] });
    res.json(chuTros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chuTro/:id_chu_tro - Chi tiết chủ trọ (PHẢI đặt SAU /profile)
router.get('/:id_chu_tro', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    // Chủ trọ chỉ xem được thông tin của mình
    if (req.userRole === 'CHU_TRO' && parseInt(req.params.id_chu_tro) !== req.idChuTro) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
    }

    const chuTro = await ChuTro.findByPk(req.params.id_chu_tro, {
      include: [{
        model: Phong,
        as: 'DanhSachPhong',
        attributes: ['id_phong', 'ten_phong', 'gia_phong', 'trang_thai']
      }]
    });

    if (!chuTro) return res.status(404).json({ error: 'Chủ trọ không tồn tại' });
    res.json(chuTro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/chuTro/:id_chu_tro - Admin cập nhật thông tin chủ trọ
router.put('/:id_chu_tro', verifyToken, requireAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findByPk(req.params.id_chu_tro);
    if (!chuTro) return res.status(404).json({ error: 'Chủ trọ không tồn tại' });

    const { ho_ten, so_dien_thoai, email, dia_chi } = req.body;

    if (email && email !== chuTro.email) {
      const emailExist = await ChuTro.findOne({ where: { email } });
      if (emailExist) return res.status(400).json({ error: 'Email đã được sử dụng' });
      chuTro.email = email;
    }

    if (ho_ten) chuTro.ho_ten = ho_ten;
    if (so_dien_thoai) chuTro.so_dien_thoai = so_dien_thoai;
    if (dia_chi) chuTro.dia_chi = dia_chi;

    await chuTro.save();
    res.json({ message: 'Cập nhật thành công', data: chuTro });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chuTro/:id_chu_tro - Admin xóa chủ trọ
router.delete('/:id_chu_tro', verifyToken, requireAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findByPk(req.params.id_chu_tro);
    if (!chuTro) return res.status(404).json({ error: 'Chủ trọ không tồn tại' });

    const soPhong = await Phong.count({ where: { id_chu_tro: chuTro.id_chu_tro } });
    if (soPhong > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa chủ trọ đang quản lý ${soPhong} phòng. Vui lòng xóa phòng trước.` 
      });
    }

    await chuTro.destroy();
    res.json({ message: 'Xóa chủ trọ thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;