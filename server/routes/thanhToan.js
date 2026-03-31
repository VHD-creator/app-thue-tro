import express from 'express';
import { ThanhToan, HoaDon, Phong } from '../models/quanHe.js';
import { 
  verifyToken,
  requireChuTroOrAdmin,
  requireAuthenticated 
} from '../middlewares/auth.js';
import { validateAmount, validatePaymentMethod } from '../utils/validators.js';

const router = express.Router();

// ==================== ROUTES CỤ THỂ TRƯỚC /:id ====================

// GET /api/thanhToan/hoa_don/:id_hoa_don - Danh sách thanh toán theo hóa đơn
// ⚠️ PHẢI đặt TRƯỚC GET /:id_thanh_toan
router.get('/hoa_don/:id_hoa_don', async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      where: { id_hoa_don: req.params.id_hoa_don },
      include: [{ model: HoaDon, as: 'HoaDon', attributes: ['id_hoa_don', 'thang_nam', 'tong_tien'] }],
      order: [['ngay_thanh_toan', 'DESC']]
    });
    res.json(thanhToans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CRUD ====================

// GET /api/thanhToan - Danh sách thanh toán
router.get('/', async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      include: [{
        model: HoaDon, as: 'HoaDon',
        attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien'],
        include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
      }],
      order: [['ngay_thanh_toan', 'DESC']]
    });
    res.json(thanhToans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thanhToan/:id_thanh_toan - Chi tiết thanh toán
router.get('/:id_thanh_toan', async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan, {
      include: [{
        model: HoaDon, as: 'HoaDon',
        attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien'],
        include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
      }]
    });
    if (!thanhToan) return res.status(404).json({ error: 'Thanh toán không tồn tại' });
    res.json(thanhToan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thanhToan - Tạo thanh toán mới
router.post('/', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const { id_hoa_don, so_tien, hinh_thuc } = req.body;

    if (!id_hoa_don || !so_tien || !hinh_thuc) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: id_hoa_don, so_tien, hinh_thuc' });
    }

    if (!validateAmount(so_tien)) return res.status(400).json({ error: 'so_tien phải là số dương' });
    if (!validatePaymentMethod(hinh_thuc)) {
      return res.status(400).json({ error: 'hinh_thuc phải là: tiền mặt hoặc VietQR - Chuyển khoản' });
    }

    const hoaDon = await HoaDon.findByPk(id_hoa_don);
    if (!hoaDon) return res.status(404).json({ error: 'Hóa đơn không tồn tại' });

    if (parseFloat(so_tien) > parseFloat(hoaDon.tong_tien)) {
      return res.status(400).json({ error: `Số tiền vượt quá tổng tiền hóa đơn (${hoaDon.tong_tien})` });
    }

    const thanhToan = await ThanhToan.create({
      id_hoa_don, so_tien, hinh_thuc,
      ngay_thanh_toan: new Date()
    });

    await hoaDon.update({ trang_thai: 1 });

    res.status(201).json({ message: 'Ghi nhận thanh toán thành công', data: thanhToan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/thanhToan/:id_thanh_toan - Cập nhật thanh toán
router.put('/:id_thanh_toan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan);
    if (!thanhToan) return res.status(404).json({ error: 'Thanh toán không tồn tại' });

    const { so_tien, hinh_thuc, ngay_thanh_toan } = req.body;

    if (so_tien && !validateAmount(so_tien)) return res.status(400).json({ error: 'so_tien phải là số dương' });
    if (hinh_thuc && !validatePaymentMethod(hinh_thuc)) {
      return res.status(400).json({ error: 'hinh_thuc không hợp lệ' });
    }

    if (so_tien) thanhToan.so_tien = so_tien;
    if (hinh_thuc) thanhToan.hinh_thuc = hinh_thuc;
    if (ngay_thanh_toan) thanhToan.ngay_thanh_toan = ngay_thanh_toan;

    await thanhToan.save();
    res.json({ message: 'Cập nhật thanh toán thành công', data: thanhToan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/thanhToan/:id_thanh_toan - Xóa thanh toán
router.delete('/:id_thanh_toan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan);
    if (!thanhToan) return res.status(404).json({ error: 'Thanh toán không tồn tại' });

    const idHoaDon = thanhToan.id_hoa_don;
    await thanhToan.destroy();

    const otherPayments = await ThanhToan.count({ where: { id_hoa_don: idHoaDon } });
    if (otherPayments === 0) {
      const hoaDon = await HoaDon.findByPk(idHoaDon);
      if (hoaDon) await hoaDon.update({ trang_thai: 0 });
    }

    res.json({ message: 'Xóa thanh toán thành công', id_thanh_toan: parseInt(req.params.id_thanh_toan) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;