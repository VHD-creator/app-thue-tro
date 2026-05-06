import express from 'express';
import { Op } from 'sequelize';
import { Phong, ChuTro, HoaDon, HopDong, NguoiThue } from '../models/quanHe.js';
import { 
  optionalAuth,
  verifyToken,
  requireChuTroOrAdmin,
  requireChuTroVerified,
  checkPhongOwnership
} from '../middlewares/auth.js';
import { validatePrice, validateStringLength } from '../utils/validators.js';

const router = express.Router();

// ====================== PUBLIC ROUTES ======================

// GET /api/phong/trong - Danh sách phòng trống (public)
router.get('/trong', async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      where: { trang_thai: 0 },
      include: [{ model: ChuTro, as: 'ChuTro', attributes: ['ho_ten', 'so_dien_thoai', 'dia_chi'] }]
    });
    res.json(dsPhongTrong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/search - Tìm kiếm phòng (public)
router.get('/search', async (req, res) => {
  try {
    const { gia_min, gia_max, trang_thai, ten_phong } = req.query;
    const whereClause = { trang_thai: { [Op.ne]: -1 } };

    if (ten_phong) whereClause.ten_phong = { [Op.like]: `%${ten_phong}%` };
    if (trang_thai !== undefined && trang_thai !== '') {
      whereClause.trang_thai = parseInt(trang_thai);
    }
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

    res.json({ total: phongs.length, data: phongs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/cua-toi - Phòng hiện tại của người thuê
router.get('/cua-toi', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới sử dụng API này' });
    }

    const NguoiThueModel = (await import('../models/NguoiThue.js')).default;
    const nguoiThue = await NguoiThueModel.findOne({ where: { id_tai_khoan: req.userId } });

    if (!nguoiThue) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người thuê' });

    const HopDongModel = (await import('../models/HopDong.js')).default;
    const activeContract = await HopDongModel.findOne({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue, trang_thai: 1 }
    });

    if (!activeContract) return res.status(404).json({ error: 'Bạn chưa thuê phòng nào' });

    const room = await Phong.findByPk(activeContract.id_phong);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== CHI TIẾT PHÒNG ======================

// GET /api/phong/:id_phong - Chi tiết phòng + hợp đồng + hóa đơn
router.get('/:id_phong', optionalAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id_phong);

    const room = await Phong.findByPk(roomId, {
      include: [{ 
        model: ChuTro, 
        as: 'ChuTro', 
        attributes: ['ho_ten', 'so_dien_thoai', 'email', 'dia_chi'] 
      }]
    });

    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    let hopDongs = [];
    let hoaDons = [];

    // Người thuê chỉ xem được dữ liệu của chính mình
    if (req.userRole === 'NGUOI_THUE' && req.userId) {
      const NguoiThueModel = (await import('../models/NguoiThue.js')).default;
      const nguoiThue = await NguoiThueModel.findOne({ where: { id_tai_khoan: req.userId } });

      if (nguoiThue) {
        const HopDongModel = (await import('../models/HopDong.js')).default;
        hopDongs = await HopDongModel.findAll({
          where: { 
            id_phong: roomId, 
            id_nguoi_thue: nguoiThue.id_nguoi_thue 
          },
          include: [{ model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten'] }],
          order: [['ngay_bat_dau', 'DESC']]
        });

        const HoaDonModel = (await import('../models/HoaDon.js')).default;
        hoaDons = await HoaDonModel.findAll({
          where: { id_phong: roomId },
          order: [['ngay_tao', 'DESC']]
        });
      }
    } 
    // Chủ trọ và Admin xem đầy đủ
    else if (req.userRole === 'CHU_TRO' || req.userRole === 'ADMIN') {
      const HopDongModel = (await import('../models/HopDong.js')).default;
      const HoaDonModel = (await import('../models/HoaDon.js')).default;

      hopDongs = await HopDongModel.findAll({
        where: { id_phong: roomId },
        include: [{ model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten'] }],
        order: [['ngay_bat_dau', 'DESC']]
      });

      hoaDons = await HoaDonModel.findAll({
        where: { id_phong: roomId },
        order: [['ngay_tao', 'DESC']]
      });
    }

    res.json({
      ...room.toJSON(),
      hop_dongs: hopDongs,
      hoa_dons: hoaDons
    });

  } catch (error) {
    console.error('Error fetching room detail:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================== ROUTES KHÁC ======================

// GET /api/phong - Danh sách phòng (theo quyền)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let whereCondition = { trang_thai: { [Op.ne]: -1 } };

    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (chuTro) {
        whereCondition.id_chu_tro = chuTro.id_chu_tro;
      } else {
        // Nếu là CHU_TRO nhưng chưa có profile, không trả về gì để bảo mật
        return res.json([]);
      }
    } else if (req.userRole !== 'ADMIN') {
      // Khách hoặc Người thuê: Chỉ xem các phòng đang trống (Available)
      // whereCondition.trang_thai = 0; // Tạm thời để họ xem tất cả phòng Active để test, 
      // nhưng tốt nhất là chỉ xem phòng trống
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

// POST /api/phong - Tạo phòng mới
router.post('/', verifyToken, requireChuTroOrAdmin, requireChuTroVerified, async (req, res) => {
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

// PUT /api/phong/:id_phong
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

// DELETE /api/phong/:id_phong
router.delete('/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });

    if (room.trang_thai !== 0) {
      return res.status(400).json({ error: 'Chỉ có thể xóa phòng đang trống' });
    }

    room.trang_thai = -1;
    await room.save();
    
    res.json({ message: 'Xóa phòng thành công', id_phong: parseInt(req.params.id_phong) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;