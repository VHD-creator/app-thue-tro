import express from 'express';
import { ChuTro, Phong } from '../models/quanHe.js';
import {
  verifyToken,
  loadChuTro,
  requireChuTroOrAdmin,
  requireAdmin
} from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ QUAN TRỌNG: Route cụ thể PHẢI đặt TRƯỚC /:id_chu_tro

// ==================== CHỦ TRỌ ====================

// GET /api/chuTro/profile - Chủ trọ xem thông tin cá nhân
router.get('/profile', verifyToken, requireChuTroOrAdmin, loadChuTro, async (req, res) => {
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

// POST /api/chuTro/profile/verify - Chủ trọ gửi yêu cầu xác thực tài khoản
router.post('/profile/verify', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
    if (!chuTro) return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });

    if (chuTro.verification_status === 1) {
      return res.status(400).json({ error: 'Yêu cầu của bạn đang được xử lý, vui lòng chờ' });
    }
    if (chuTro.verification_status === 2) {
      return res.status(400).json({ error: 'Tài khoản của bạn đã được xác thực' });
    }

    chuTro.verification_status = 1; // Chuyển sang chờ duyệt
    await chuTro.save();

    res.json({ message: 'Gửi yêu cầu xác thực thành công. Admin sẽ sớm duyệt hồ sơ của bạn' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ====================

// GET /api/chuTro - Admin xem danh sách tất cả chủ trọ
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status !== undefined) where.verification_status = status;

    const chuTros = await ChuTro.findAll({ 
      where,
      order: [['ngay_tao', 'DESC']] 
    });
    res.json(chuTros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/chuTro/:id_chu_tro/approve-verification - Admin duyệt xác thực
router.put('/:id_chu_tro/approve-verification', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id_chu_tro;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID chủ trọ không hợp lệ' });
    }

    const { approve } = req.body;
    const chuTro = await ChuTro.findByPk(id);
    if (!chuTro) return res.status(404).json({ error: 'Chủ trọ không tồn tại' });

    if (approve) {
      chuTro.verification_status = 2; // Đã xác thực
      chuTro.email_verified = true;  // Giả lập xác thực email/SĐT luôn khi admin duyệt
      chuTro.phone_verified = true;
    } else {
      chuTro.verification_status = 3; // Bị từ chối
    }

    await chuTro.save();
    res.json({ 
      message: approve ? 'Duyệt xác thực thành công' : 'Đã từ chối yêu cầu xác thực',
      data: chuTro 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chuTro/:id_chu_tro - Chi tiết chủ trọ (PHẢI đặt SAU /profile)
router.get('/:id_chu_tro', verifyToken, requireChuTroOrAdmin, loadChuTro, async (req, res) => {
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