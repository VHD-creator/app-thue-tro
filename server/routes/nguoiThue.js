import express from 'express';
import { NguoiThue, HopDong, HoaDon, Phong } from '../models/quanHe.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  requireAuthenticated 
} from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ QUAN TRỌNG: Các route cụ thể PHẢI đặt TRƯỚC route có params /:id
// Nếu không Express sẽ match /profile, /hop-dong, /tat-ca vào /:id_nguoi_thue

// ==================== NGƯỜI THUÊ ====================

// GET /api/nguoiThue/profile
router.get('/profile', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    // ✅ Chỉ NGUOI_THUE mới có profile người thuê
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới có thể xem profile này. Chủ trọ dùng GET /api/chuTro/profile' });
    }
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });
    res.json(nguoiThue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/nguoiThue/profile
router.put('/profile', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới có thể cập nhật profile này' });
    }
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });

    const { ho_ten, so_dien_thoai, email } = req.body;
    if (ho_ten) nguoiThue.ho_ten = ho_ten;
    if (so_dien_thoai) nguoiThue.so_dien_thoai = so_dien_thoai;
    if (email) nguoiThue.email = email;
    await nguoiThue.save();

    res.json({ message: 'Cập nhật thông tin thành công', data: nguoiThue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nguoiThue/hop-dong - Người thuê xem hợp đồng của mình
router.get('/hop-dong', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });

    const hopDongs = await HopDong.findAll({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue },
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong', 'mo_ta', 'trang_thai'] }],
      order: [['ngay_bat_dau', 'DESC']]
    });

    res.json(hopDongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nguoiThue/hoa-don - Người thuê xem hóa đơn của mình
router.get('/hoa-don', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });

    const hopDongs = await HopDong.findAll({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue },
      attributes: ['id_phong']
    });

    if (hopDongs.length === 0) return res.json([]);

    const idPhongs = [...new Set(hopDongs.map(hd => hd.id_phong))];

    const hoaDons = await HoaDon.findAll({
      where: { id_phong: idPhongs },
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong'] }],
      order: [['ngay_tao', 'DESC']]
    });

    res.json(hoaDons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nguoiThue/tat-ca - Admin xem tất cả người thuê
router.get('/tat-ca', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xem tất cả người thuê' });
    }
    const tenants = await NguoiThue.findAll({ order: [['ho_ten', 'ASC']] });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHỦ TRỌ / ADMIN ====================

// GET /api/nguoiThue - Danh sách người thuê đang có hợp đồng
router.get('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereHopDong = { trang_thai: 1 };

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      whereHopDong.id_phong = danhSachPhong.map(p => p.id_phong);
    }

    const tenants = await NguoiThue.findAll({
      include: [{
        model: HopDong,
        as: 'DanhSachHopDong',
        where: whereHopDong,
        attributes: ['id_hop_dong', 'id_phong', 'ngay_bat_dau', 'ngay_ket_thuc'],
        required: true
      }],
      order: [['ho_ten', 'ASC']]
    });

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nguoiThue/:id_nguoi_thue - Chi tiết (PHẢI đặt SAU các route cụ thể)
router.get('/:id_nguoi_thue', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const HopDong = (await import('../models/HopDong.js')).default;
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue, {
      include: [
        {
          model: HopDong,
          as: 'DanhSachHopDong',
          where: { trang_thai: 1 },
          attributes: ['id_hop_dong', 'id_phong', 'ngay_bat_dau', 'ngay_ket_thuc'],
          required: false
        }
      ]
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    // Người thuê chỉ xem được thông tin của mình
    if (req.userRole === 'NGUOI_THUE') {
      const selfTenant = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!selfTenant || selfTenant.id_nguoi_thue !== tenant.id_nguoi_thue) {
        return res.status(403).json({ error: 'Bạn chỉ có thể xem thông tin của mình' });
      }
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nguoiThue
router.post('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { ho_ten, cccd, so_dien_thoai, email, id_tai_khoan } = req.body;

    if (!ho_ten || !cccd) return res.status(400).json({ error: 'Thiếu dữ liệu: ho_ten, cccd' });
    if (!/^\d{12}$/.test(cccd)) return res.status(400).json({ error: 'CCCD phải là 12 chữ số' });

    const existingTenant = await NguoiThue.findOne({ where: { cccd } });
    if (existingTenant) return res.status(400).json({ error: 'CCCD đã tồn tại trong hệ thống' });

    const tenant = await NguoiThue.create({
      ho_ten,
      cccd,
      so_dien_thoai,
      email,
      id_tai_khoan
    });

    res.status(201).json({
      message: 'Tạo người thuê thành công',
      data: tenant
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/nguoiThue/:id_nguoi_thue
router.put('/:id_nguoi_thue', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
    if (!tenant) return res.status(404).json({ error: 'Người thuê không tồn tại' });

    const { ho_ten, cccd, so_dien_thoai, email } = req.body;

    if (cccd && cccd !== tenant.cccd) {
      if (!/^\d{12}$/.test(cccd)) return res.status(400).json({ error: 'CCCD phải là 12 chữ số' });
      const existingTenant = await NguoiThue.findOne({ where: { cccd } });
      if (existingTenant) return res.status(400).json({ error: 'CCCD đã tồn tại trong hệ thống' });
      tenant.cccd = cccd;
    }

    if (ho_ten) tenant.ho_ten = ho_ten;
    if (so_dien_thoai) tenant.so_dien_thoai = so_dien_thoai;
    if (email) tenant.email = email;

    await tenant.save();
    res.json({ message: 'Cập nhật người thuê thành công', data: tenant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/nguoiThue/:id_nguoi_thue
router.delete('/:id_nguoi_thue', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
    if (!tenant) return res.status(404).json({ error: 'Người thuê không tồn tại' });

    const activeContract = await HopDong.findOne({
      where: { id_nguoi_thue: tenant.id_nguoi_thue, trang_thai: 1 }
    });

    if (activeContract) return res.status(400).json({ error: 'Không thể xóa người thuê đang có hợp đồng hoạt động' });

    await tenant.destroy();
    res.json({ message: 'Xóa người thuê thành công', id_nguoi_thue: parseInt(req.params.id_nguoi_thue) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;