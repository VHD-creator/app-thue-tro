import express from 'express';
import Phong from '../models/Phong.js';
import TaiKhoan from '../models/TaiKhoan.js';
import ChuTro from '../models/ChuTro.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  checkPhongOwnership
} from '../middlewares/auth.js';
import { validatePrice, validateStringLength, validateStatus } from '../utils/validators.js';

const router = express.Router();

// GET /api/phong/trong - Danh sách phòng trống (public)
router.get('/trong', async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      where: { trang_thai: 0 }
    });
    res.json(dsPhongTrong);
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

import { optionalAuth } from '../middlewares/auth.js';

// GET /api/phong - Danh sách tất cả phòng
// - Public: xem tất cả
// - Chủ trọ (nếu có token): chỉ xem phòng của mình
// - Admin: xem tất cả
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
      include: [
        {
          model: ChuTro,
          as: 'ChuTro',
          attributes: ['ho_ten', 'so_dien_thoai', 'dia_chi']
        }
      ]
    });

    const formattedData = data.map(room => {
      const roomJSON = room.toJSON();
      if (roomJSON.ChuTro) {
        roomJSON.chu_tro = roomJSON.ChuTro;
        delete roomJSON.ChuTro;
      }
      return roomJSON;
    });

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/phong/:id_phong - Chi tiết phòng (public)
router.get('/:id_phong', async (req, res) => {
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

// POST /api/phong - Tạo phòng mới (Chủ trọ hoặc Admin)
router.post('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { id_chu_tro, ten_phong, gia_phong, mo_ta } = req.body;

    // Validation
    if (!ten_phong || !gia_phong) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: ten_phong, gia_phong' 
      });
    }

    if (!validateStringLength(ten_phong, 1, 100)) {
      return res.status(400).json({ error: 'ten_phong phải từ 1-100 ký tự' });
    }

    if (!validatePrice(gia_phong)) {
      return res.status(400).json({ error: 'gia_phong phải là số dương' });
    }

    // Xác định id_chu_tro
    let finalIdChuTro = id_chu_tro;
    
    // Nếu là chủ trọ, tự động dùng id_chu_tro của họ
    if (req.userRole === 'CHU_TRO') {
      if (!req.idChuTro) {
        return res.status(400).json({ error: 'Không tìm thấy thông tin chủ trọ' });
      }
      finalIdChuTro = req.idChuTro;
    } else if (req.userRole === 'ADMIN') {
      // Admin phải chỉ định id_chu_tro
      if (!id_chu_tro) {
        return res.status(400).json({ error: 'Admin phải chỉ định id_chu_tro' });
      }
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

// PUT /api/phong/:id_phong - Cập nhật phòng (Chủ trọ hoặc Admin)
router.put('/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
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

    // Update
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

// DELETE /api/phong/:id_phong - Xóa phòng (Chủ trọ hoặc Admin)
router.delete('/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id_phong);
    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    // Kiểm tra phòng có đang cho thuê không
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
      console.error("Lỗi xóa dữ liệu liên kết:", err);
      // Tiếp tục để thử xóa phòng, mặc dù có thể sẽ lỗi nếu chưa xóa hết FK
    }

    await room.destroy();
    res.json({ 
      message: 'Xóa phòng thành công',
      id_phong: parseInt(req.params.id_phong) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;