import express from 'express';
import HopDong from '../models/HopDong.js';
import Phong from '../models/Phong.js';
import NguoiThue from '../models/NguoiThue.js';
import ThanhToan from '../models/ThanhToan.js';
import { validateDate, isEndDateAfterStartDate, validateAmount } from '../utils/validators.js';

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
    const taiKhoan = await db.TaiKhoan.findByPk(req.session.userId);
    if (!taiKhoan || taiKhoan.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/hopDong - Danh sách hợp đồng (admin only)
router.get('/', checkAdminRole, async (req, res) => {
  try {
    const hopDongs = await HopDong.findAll({
      include: [
        { model: Phong, as: 'Phong' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });
    res.json(hopDongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hopDong/:id_hop_dong - Chi tiết hợp đồng
router.get('/:id_hop_dong', checkUser, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [
        { model: Phong, as: 'Phong' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    res.json(hopDong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hopDong - Tạo hợp đồng mới (auth required)
router.post('/', checkUser, async (req, res) => {
  try {
    const { id_phong, id_nguoi_thue, ngay_bat_dau, ngay_ket_thuc, tien_coc } = req.body;

    // Validate required fields
    if (!id_phong || !id_nguoi_thue || !ngay_bat_dau || !ngay_ket_thuc || !tien_coc) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: id_phong, id_nguoi_thue, ngay_bat_dau, ngay_ket_thuc, tien_coc' 
      });
    }

    // Validate date format
    if (!validateDate(ngay_bat_dau) || !validateDate(ngay_ket_thuc)) {
      return res.status(400).json({ error: 'Ngày phải có định dạng DD-MM-YYYY' });
    }

    // Validate end date after start date
    if (!isEndDateAfterStartDate(ngay_bat_dau, ngay_ket_thuc)) {
      return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    // Validate amount
    if (!validateAmount(tien_coc)) {
      return res.status(400).json({ error: 'tien_coc phải là số dương' });
    }

    // Check if room exists and is available
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    if (phong.trang_thai === 1) {
      return res.status(400).json({ error: 'Phòng đã có người thuê' });
    }

    // Check if tenant exists
    const nguoiThue = await NguoiThue.findByPk(id_nguoi_thue);
    if (!nguoiThue) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    // Create contract
    const hopDong = await HopDong.create({
      id_phong,
      id_nguoi_thue,
      ngay_bat_dau,
      ngay_ket_thuc,
      tien_coc,
      trang_thai: 1
    });

    // Update room status to occupied (trang_thai = 1)
    await phong.update({ trang_thai: 1 });

    res.status(201).json({
      message: 'Tạo hợp đồng thành công',
      hopDong
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hopDong/:id_hop_dong - Cập nhật hợp đồng (admin only)
router.put('/:id_hop_dong', checkAdminRole, async (req, res) => {
  try {
    const { ngay_bat_dau, ngay_ket_thuc, tien_coc, trang_thai } = req.body;

    const hopDong = await HopDong.findByPk(req.params.id_hop_dong);
    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    // Validation
    if (ngay_bat_dau && !validateDate(ngay_bat_dau)) {
      return res.status(400).json({ error: 'ngay_bat_dau phải có định dạng DD-MM-YYYY' });
    }

    if (ngay_ket_thuc && !validateDate(ngay_ket_thuc)) {
      return res.status(400).json({ error: 'ngay_ket_thuc phải có định dạng DD-MM-YYYY' });
    }

    const startDate = ngay_bat_dau || hopDong.ngay_bat_dau;
    const endDate = ngay_ket_thuc || hopDong.ngay_ket_thuc;

    if (!isEndDateAfterStartDate(startDate, endDate)) {
      return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    if (tien_coc && !validateAmount(tien_coc)) {
      return res.status(400).json({ error: 'tien_coc phải là số dương' });
    }

    // Update fields if provided
    if (ngay_bat_dau) hopDong.ngay_bat_dau = ngay_bat_dau;
    if (ngay_ket_thuc) hopDong.ngay_ket_thuc = ngay_ket_thuc;
    if (tien_coc) hopDong.tien_coc = tien_coc;
    if (trang_thai !== undefined) hopDong.trang_thai = trang_thai;

    await hopDong.save();

    res.json({
      message: 'Cập nhật hợp đồng thành công',
      hopDong
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hopDong/:id_hop_dong - Xóa hợp đồng (admin only)
router.delete('/:id_hop_dong', checkAdminRole, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong);
    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    // Get the room to update its status
    const phong = await Phong.findByPk(hopDong.id_phong);
    
    // Delete contract
    await hopDong.destroy();

    // Update room status back to vacant (trang_thai = 0)
    if (phong) {
      await phong.update({ trang_thai: 0 });
    }

    res.json({
      message: 'Xóa hợp đồng thành công, phòng đã được đánh dấu là trống'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
