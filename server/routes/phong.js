import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Phong, ChuTro, HoaDon, HopDong, NguoiThue, TaiKhoan } from '../models/quanHe.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  checkPhongOwnership,
  optionalAuth
} from '../middlewares/auth.js';
import { validatePrice, validateStringLength } from '../utils/validators.js';

const router = express.Router();

// GET /api/phong/trong - Danh sách phòng trống (public)
router.get('/trong', async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      // ✅ Chỉ lấy phòng thực sự trống (0), không lấy chờ duyệt (2)
      where: { trang_thai: 0 },
      include: [{ model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'so_dien_thoai', 'dia_chi'] }]
    });
    res.json(dsPhongTrong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET /api/phong/search - Tìm kiếm & lọc phòng (public)
// Query params: gia_min, gia_max, trang_thai, ten_phong
router.get('/search', async (req, res) => {
  try {
    const { gia_min, gia_max, trang_thai, ten_phong } = req.query;
    const whereClause = {};

    // Lọc theo tên phòng
    if (ten_phong) {
      whereClause.ten_phong = { [Op.like]: `%${ten_phong}%` };
    }

    // Lọc theo trạng thái
    if (trang_thai !== undefined && trang_thai !== '') {
      whereClause.trang_thai = parseInt(trang_thai);
    }

    // Lọc theo khoảng giá
    if (gia_min || gia_max) {
      whereClause.gia_phong = {};
      if (gia_min) whereClause.gia_phong[Op.gte] = parseFloat(gia_min);
      if (gia_max) whereClause.gia_phong[Op.lte] = parseFloat(gia_max);
    }

    const phongs = await Phong.findAll({
      where: whereClause,
      include: [{ model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'so_dien_thoai', 'dia_chi'] }],
      order: [['gia_phong', 'ASC']]
    });

    res.json({
      total: phongs.length,
      data: phongs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/cua-toi - Lấy phòng hiện tại của người thuê
router.get('/cua-toi', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới sử dụng API này' });
    }
    
    // Tìm ID người thuê
    const NguoiThue = (await import('../models/NguoiThue.js')).default;
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    
    if (!nguoiThue) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người thuê' });
    }

    // Tìm hợp đồng đang active
    const HopDong = (await import('../models/HopDong.js')).default;
    const activeContract = await HopDong.findOne({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue, trang_thai: 1 }
    });

    if (!activeContract) {
      return res.status(404).json({ error: 'Bạn chưa thuê phòng nào' });
    }

    // Lấy thông tin phòng
    const room = await Phong.findByPk(activeContract.id_phong);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong - Danh sách tất cả phòng
router.get('/', optionalAuth, async (req, res) => {
  try {
    let whereCondition = {};
    
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ 
        where: { id_tai_khoan: req.userId } 
      });
      if (chuTro) {
        whereCondition.id_chu_tro = chuTro.id_chu_tro;
      }
    }
    
    const data = await Phong.findAll({ 
      where: whereCondition,
      include: [{ model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'so_dien_thoai', 'dia_chi'] }]
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET /api/phong/:id_phong/hoa-don - Lịch sử hóa đơn của phòng
// ⚠️ PHẢI đặt TRƯỚC GET /:id_phong
router.get('/:id_phong/hoa-don', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
      where: { id_phong: req.params.id_phong },
      order: [['ngay_tao', 'DESC']]
    });

    res.json({
      id_phong: parseInt(req.params.id_phong),
      total: hoaDons.length,
      data: hoaDons
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET /api/phong/:id_phong/hop-dong - Lịch sử hợp đồng của phòng
// ⚠️ PHẢI đặt TRƯỚC GET /:id_phong
router.get('/:id_phong/hop-dong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const hopDongs = await HopDong.findAll({
      where: { id_phong: req.params.id_phong },
      include: [{ model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten', 'so_dien_thoai', 'email'] }],
      order: [['ngay_bat_dau', 'DESC']]
    });

    res.json({
      id_phong: parseInt(req.params.id_phong),
      total: hopDongs.length,
      data: hopDongs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/:id_phong - Chi tiết phòng (public)
// ⚠️ PHẢI đặt SAU /:id_phong/hoa-don và /:id_phong/hop-dong
router.get('/:id_phong', async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong, {
      include: [{ model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'so_dien_thoai', 'email', 'dia_chi'] }]
    });
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/phong - Tạo phòng mới
router.post('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { id_chu_tro, ten_phong, gia_phong, mo_ta } = req.body;

    if (!ten_phong || !gia_phong) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: ten_phong, gia_phong' });
    }

    if (!validateStringLength(ten_phong, 1, 100)) {
      return res.status(400).json({ error: 'ten_phong phải từ 1-100 ký tự' });
    }

    if (!validatePrice(gia_phong)) {
      return res.status(400).json({ error: 'gia_phong phải là số dương' });
    }

    let finalIdChuTro = id_chu_tro;
    
    if (req.userRole === 'CHU_TRO') {
      if (!req.idChuTro) return res.status(400).json({ error: 'Không tìm thấy thông tin chủ trọ' });
      finalIdChuTro = req.idChuTro;
    } else if (req.userRole === 'ADMIN' && !id_chu_tro) {
      return res.status(400).json({ error: 'Admin phải chỉ định id_chu_tro' });
    }

    const room = await Phong.create({
      id_chu_tro: finalIdChuTro,
      ten_phong,
      gia_phong,
      mo_ta: mo_ta || '',
      trang_thai: 0
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/phong/:id_phong - Cập nhật phòng
router.put('/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });

    const { ten_phong, gia_phong, mo_ta, trang_thai } = req.body;

    if (ten_phong && !validateStringLength(ten_phong, 1, 100)) {
      return res.status(400).json({ error: 'ten_phong phải từ 1-100 ký tự' });
    }

    if (gia_phong && !validatePrice(gia_phong)) {
      return res.status(400).json({ error: 'gia_phong phải là số dương' });
    }

    if (trang_thai !== undefined && ![0, 1, 2].includes(parseInt(trang_thai))) {
      return res.status(400).json({ error: 'trang_thai phải là 0, 1 hoặc 2' });
    }

    if (ten_phong) room.ten_phong = ten_phong;
    if (gia_phong) room.gia_phong = gia_phong;
    if (mo_ta !== undefined) room.mo_ta = mo_ta;
    if (trang_thai !== undefined) room.trang_thai = trang_thai;

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/phong/:id_phong - Xóa phòng
router.delete('/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });

    if (room.trang_thai === 1) {
      return res.status(400).json({ error: 'Không thể xóa phòng đang cho thuê' });
    }

    // Xóa các dữ liệu liên kết để tránh lỗi Foreign Key Constraint
    try {
      const AnhPhong = (await import('../models/HinhAnhPhong.js')).default;
      await AnhPhong.destroy({ where: { id_phong: req.params.id_phong } });

      const HoaDon = (await import('../models/HoaDon.js')).default;
      const ThanhToan = (await import('../models/ThanhToan.js')).default;
      
      // Lấy danh sách hóa đơn của phòng
      const hoaDons = await HoaDon.findAll({ where: { id_phong: req.params.id_phong } });
      const idHoaDons = hoaDons.map(hd => hd.id_hoa_don);
      
      if (idHoaDons.length > 0) {
        // Xóa thanh toán của các hóa đơn này trước
        await ThanhToan.destroy({ where: { id_hoa_don: idHoaDons } });
        // Sau đó xóa hóa đơn
        await HoaDon.destroy({ where: { id_phong: req.params.id_phong } });
      }

      const HopDong = (await import('../models/HopDong.js')).default;
      await HopDong.destroy({ where: { id_phong: req.params.id_phong } });
    } catch (err) {
      // Bỏ qua lỗi xóa dữ liệu liên kết, cho phép phòng tự được xóa
    }

    await room.destroy();
    res.json({ message: 'Xóa phòng thành công', id_phong: parseInt(req.params.id_phong) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;