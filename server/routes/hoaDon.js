import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { HoaDon, Phong, TaiKhoan, ChuTro, NguoiThue, HopDong } from '../models/quanHe.js';
import { 
  verifyToken,
  requireChuTroOrAdmin,
  checkPhongOwnership 
} from '../middlewares/auth.js';
import { validateAmount, validateMonthYear, validateBillStatus } from '../utils/validators.js';

const router = express.Router();

// ==================== ROUTES CỤ THỂ TRƯỚC /:id ====================

// POST /api/hoaDon/tinh/:id_phong - Tính toán hóa đơn tự động
// ⚠️ PHẢI đặt TRƯỚC GET /:id_hoa_don
router.post('/tinh/:id_phong', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const { id_phong } = req.params;
    const { thang_nam } = req.body;

    if (!thang_nam) return res.status(400).json({ error: 'Thiếu dữ liệu: thang_nam' });
    if (!validateMonthYear(thang_nam)) return res.status(400).json({ error: 'thang_nam phải có định dạng MM-YYYY' });

    const existingBill = await HoaDon.findOne({ where: { id_phong, thang_nam } });
    if (existingBill) return res.status(400).json({ error: `Hóa đơn tháng ${thang_nam} cho phòng này đã tồn tại` });

    const phong = await Phong.findByPk(id_phong);
    if (!phong) return res.status(404).json({ error: 'Phòng không tồn tại' });

    const hoaDon = await HoaDon.create({
      id_phong,
      thang_nam,
      so_dien_cu: 0, so_dien_moi: 0,
      so_nuoc_cu: 0, so_nuoc_moi: 0,
      tien_dien: 0, tien_nuoc: 0,
      tien_phong: phong.gia_phong,
      tong_tien: phong.gia_phong,
      trang_thai: 0
    });

    res.status(201).json({ message: 'Tạo hóa đơn tự động thành công', data: hoaDon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CRUD ====================

// GET /api/hoaDon - Danh sách hóa đơn
// Chủ trọ: chỉ xem hóa đơn của phòng mình
// Admin: xem tất cả
// Public: xem tất cả (có thể đổi thành require auth)
router.get('/', async (req, res) => {
  try {
    let whereCondition = {};
    
    // Nếu có token, parse để filter
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        
        const taiKhoan = await TaiKhoan.findByPk(decoded.id_tai_khoan);
        
        if (taiKhoan?.vai_tro === 'CHU_TRO') {
          const chuTro = await ChuTro.findOne({ 
            where: { id_tai_khoan: taiKhoan.id_tai_khoan } 
          });
          
          if (chuTro) {
            const danhSachPhong = await Phong.findAll({
              where: { id_chu_tro: chuTro.id_chu_tro },
              attributes: ['id_phong']
            });
            
            const idPhongs = danhSachPhong.map(p => p.id_phong);
            whereCondition.id_phong = idPhongs;
          }
        } else if (taiKhoan?.vai_tro === 'NGUOI_THUE') {
          const nguoiThue = await (await import('../models/NguoiThue.js')).default.findOne({ 
            where: { id_tai_khoan: taiKhoan.id_tai_khoan } 
          });
          if (nguoiThue) {
            const HopDong = (await import('../models/HopDong.js')).default;
            const hopDongs = await HopDong.findAll({
              where: { id_nguoi_thue: nguoiThue.id_nguoi_thue }
            });
            const idPhongs = hopDongs.map(hd => hd.id_phong);
            
            if (idPhongs.length > 0) {
              whereCondition.id_phong = idPhongs;
            } else {
              return res.json([]); // Return immediately to avoid empty array bug
            }
          } else {
            return res.json([]);
          }
        }
      } catch (err) {
        // Token không hợp lệ, bỏ qua
      }
    }
    
    const hoaDons = await HoaDon.findAll({
      where: whereCondition,
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] }],
      order: [['ngay_tao', 'DESC']]
    });

    res.json(hoaDons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hoaDon/:id_hoa_don - Chi tiết hóa đơn
router.get('/:id_hoa_don', async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] }]
    });
    if (!hoaDon) return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    res.json(hoaDon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hoaDon - Tạo hóa đơn mới
router.post('/', verifyToken, requireChuTroOrAdmin, checkPhongOwnership, async (req, res) => {
  try {
    const { id_phong, thang_nam, so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, trang_thai } = req.body;

    if (!id_phong || !thang_nam) return res.status(400).json({ error: 'Thiếu dữ liệu: id_phong, thang_nam' });
    if (!validateMonthYear(thang_nam)) return res.status(400).json({ error: 'thang_nam phải có định dạng MM-YYYY' });

    if (so_dien_cu !== undefined && so_dien_moi !== undefined) {
      if (so_dien_cu < 0 || so_dien_moi < 0) return res.status(400).json({ error: 'Chỉ số điện phải >= 0' });
      if (so_dien_moi < so_dien_cu) return res.status(400).json({ error: 'Chỉ số điện mới phải >= chỉ số điện cũ' });
    }

    if (so_nuoc_cu !== undefined && so_nuoc_moi !== undefined) {
      if (so_nuoc_cu < 0 || so_nuoc_moi < 0) return res.status(400).json({ error: 'Chỉ số nước phải >= 0' });
      if (so_nuoc_moi < so_nuoc_cu) return res.status(400).json({ error: 'Chỉ số nước mới phải >= chỉ số nước cũ' });
    }

    const existingBill = await HoaDon.findOne({ where: { id_phong, thang_nam } });
    if (existingBill) return res.status(400).json({ error: `Hóa đơn tháng ${thang_nam} đã tồn tại` });

    const hoaDon = await HoaDon.create({
      id_phong, thang_nam,
      so_dien_cu: so_dien_cu || 0, so_dien_moi: so_dien_moi || 0,
      so_nuoc_cu: so_nuoc_cu || 0, so_nuoc_moi: so_nuoc_moi || 0,
      tien_dien: tien_dien || 0, tien_nuoc: tien_nuoc || 0,
      tien_phong: tien_phong || 0,
      tong_tien: (tien_dien || 0) + (tien_nuoc || 0) + (tien_phong || 0),
      trang_thai: trang_thai || 0
    });

    res.status(201).json({ message: 'Tạo hóa đơn thành công', data: hoaDon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hoaDon/:id_hoa_don - Cập nhật hóa đơn
router.put('/:id_hoa_don', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    if (!hoaDon) return res.status(404).json({ error: 'Hóa đơn không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hoaDon.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa hóa đơn này' });
      }
    }

    const { so_dien_cu, so_dien_moi, so_nuoc_cu, so_nuoc_moi, tien_dien, tien_nuoc, tien_phong, trang_thai } = req.body;

    if (trang_thai !== undefined && !validateBillStatus(trang_thai)) {
      return res.status(400).json({ error: 'trang_thai phải là 0, 1 hoặc 2' });
    }

    if (so_dien_cu !== undefined) hoaDon.so_dien_cu = so_dien_cu;
    if (so_dien_moi !== undefined) hoaDon.so_dien_moi = so_dien_moi;
    if (so_nuoc_cu !== undefined) hoaDon.so_nuoc_cu = so_nuoc_cu;
    if (so_nuoc_moi !== undefined) hoaDon.so_nuoc_moi = so_nuoc_moi;
    if (tien_dien !== undefined) hoaDon.tien_dien = tien_dien;
    if (tien_nuoc !== undefined) hoaDon.tien_nuoc = tien_nuoc;
    if (tien_phong !== undefined) hoaDon.tien_phong = tien_phong;
    if (trang_thai !== undefined) hoaDon.trang_thai = trang_thai;

    hoaDon.tong_tien = (hoaDon.tien_dien || 0) + (hoaDon.tien_nuoc || 0) + (hoaDon.tien_phong || 0);

    await hoaDon.save();
    res.json({ message: 'Cập nhật hóa đơn thành công', data: hoaDon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hoaDon/:id_hoa_don - Xóa hóa đơn
router.delete('/:id_hoa_don', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    if (!hoaDon) return res.status(404).json({ error: 'Hóa đơn không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hoaDon.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa hóa đơn này' });
      }
    }

    if (hoaDon.trang_thai === 1) {
      return res.status(400).json({ error: 'Không thể xóa hóa đơn đã thanh toán. Vui lòng xóa thanh toán trước.' });
    }

    await hoaDon.destroy();
    res.json({ message: 'Xóa hóa đơn thành công', id_hoa_don: parseInt(req.params.id_hoa_don) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;