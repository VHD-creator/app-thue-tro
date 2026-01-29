import express from 'express';
import ThanhToan from '../models/ThanhToan.js';
import HoaDon from '../models/HoaDon.js';
import TaiKhoan from '../models/TaiKhoan.js';
import { validateAmount, validatePaymentMethod, validateDate } from '../utils/validators.js';
import { guiNhacNhoThanhToan } from '../services/emailService.js';

const router = express.Router();


// Middleware: Check authentication
const checkUser = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  next();
};

// Middleware: Check admin role
const checkAdminRole = async (req, res, next) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.session.userId);
    if (!taiKhoan || taiKhoan.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/thanhToan - Danh sách thanh toán (admin only)
router.get('/', checkAdminRole, async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien']
        }
      ]
    });
    res.json({ count: thanhToans.length, data: thanhToans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thanhToan/hoa_don/:id_hoa_don - Danh sách thanh toán theo hóa đơn (auth)
router.get('/hoa_don/:id_hoa_don', checkUser, async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      where: { id_hoa_don: req.params.id_hoa_don },
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'thang_nam', 'tong_tien']
        }
      ]
    });
    res.json({ count: thanhToans.length, data: thanhToans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thanhToan/:id_thanh_toan - Chi tiết thanh toán (auth)
router.get('/:id_thanh_toan', checkUser, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan, {
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien']
        }
      ]
    });

    if (!thanhToan) {
      return res.status(404).json({ error: 'Thanh toán không tồn tại' });
    }

    res.json(thanhToan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thanhToan - Tạo thanh toán mới (auth required)
router.post('/', checkUser, async (req, res) => {
  try {
    const { id_hoa_don, so_tien, hinh_thuc } = req.body;

    // Validation
    if (!id_hoa_don || !so_tien || !hinh_thuc) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: id_hoa_don, so_tien, hinh_thuc' 
      });
    }

    if (!validateAmount(so_tien)) {
      return res.status(400).json({ error: 'so_tien phải là số dương' });
    }

    if (!validatePaymentMethod(hinh_thuc)) {
      return res.status(400).json({ 
        error: 'hinh_thuc phải là một trong: tiền mặt, chuyển khoản, thẻ tín dụng, ví điện tử' 
      });
    }

    // Check if bill exists
    const hoaDon = await HoaDon.findByPk(id_hoa_don);
    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }

    // Create payment
    const thanhToan = await ThanhToan.create({
      id_hoa_don,
      so_tien,
      hinh_thuc,
      ngay_thanh_toan: new Date()
    });

    // Auto-update bill status to paid (trang_thai = 1)
    await hoaDon.update({ trang_thai: 1 });

    res.status(201).json({
      message: 'Tạo thanh toán thành công, hóa đơn đã được đánh dấu là đã thanh toán',
      data: thanhToan
    });

    // Send confirmation email (optional)
    // await guiNhacNhoThanhToan(nguoiThue.email, nguoiThue.ho_ten, so_tien, new Date());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/thanhToan/:id_thanh_toan - Cập nhật thanh toán (admin only)
router.put('/:id_thanh_toan', checkAdminRole, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan);
    if (!thanhToan) {
      return res.status(404).json({ error: 'Thanh toán không tồn tại' });
    }

    const { so_tien, hinh_thuc, ngay_thanh_toan } = req.body;

    // Validation
    if (so_tien && !validateAmount(so_tien)) {
      return res.status(400).json({ error: 'so_tien phải là số dương' });
    }

    if (hinh_thuc && !validatePaymentMethod(hinh_thuc)) {
      return res.status(400).json({ 
        error: 'hinh_thuc phải là một trong: tiền mặt, chuyển khoản, thẻ tín dụng, ví điện tử' 
      });
    }

    if (ngay_thanh_toan && !validateDate(ngay_thanh_toan)) {
      return res.status(400).json({ error: 'ngay_thanh_toan phải có định dạng DD-MM-YYYY' });
    }

    // Update fields if provided
    if (so_tien) thanhToan.so_tien = so_tien;
    if (hinh_thuc) thanhToan.hinh_thuc = hinh_thuc;
    if (ngay_thanh_toan) thanhToan.ngay_thanh_toan = ngay_thanh_toan;

    await thanhToan.save();

    res.json({
      message: 'Cập nhật thanh toán thành công',
      data: thanhToan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/thanhToan/:id_thanh_toan - Xóa thanh toán (admin only)
router.delete('/:id_thanh_toan', checkAdminRole, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan);
    if (!thanhToan) {
      return res.status(404).json({ error: 'Thanh toán không tồn tại' });
    }

    const idHoaDon = thanhToan.id_hoa_don;

    // Delete payment
    await thanhToan.destroy();

    // Check if there are other payments for this bill
    const otherPayments = await ThanhToan.count({ where: { id_hoa_don: idHoaDon } });
    
    // If no more payments, set bill status back to unpaid (trang_thai = 0)
    if (otherPayments === 0) {
      const hoaDon = await HoaDon.findByPk(idHoaDon);
      if (hoaDon) {
        await hoaDon.update({ trang_thai: 0 });
      }
    }

    res.json({ message: 'Xóa thanh toán thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;