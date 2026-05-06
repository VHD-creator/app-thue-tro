import express from 'express';
import { Op } from 'sequelize';
import { ThanhToan, HoaDon, Phong, HopDong, ChuTro } from '../models/quanHe.js';
import {
  verifyToken,
  requireChuTroOrAdmin,
  requireAuthenticated
} from '../middlewares/auth.js';
import { validateAmount, validatePaymentMethod, validateDate } from '../utils/validators.js';

const router = express.Router();

// Helper: Kiểm tra và kích hoạt hợp đồng/phòng nếu đã đóng cọc
const checkAndActivateContract = async (id_hop_dong) => {
  if (!id_hop_dong) return;

  const hopDong = await HopDong.findByPk(id_hop_dong);
  if (!hopDong || hopDong.trang_thai !== 2) return;

  // Kiểm tra xem tất cả các hóa đơn tiền cọc/đầu tiên của hợp đồng này đã thanh toán chưa
  const pendingInvoices = await HoaDon.count({
    where: {
      id_hop_dong,
      trang_thai: { [Op.ne]: 1 } // != 1 (Chưa thanh toán hoặc còn nợ)
    }
  });

  // Nếu không còn hóa đơn nào chưa thanh toán -> Kích hoạt
  if (pendingInvoices === 0) {
    await hopDong.update({ trang_thai: 1 });
    await Phong.update({ trang_thai: 1 }, { where: { id_phong: hopDong.id_phong } });
  }
};

// GET /api/thanhToan - Danh sách thanh toán
router.get('/', verifyToken, async (req, res) => {
  try {
    let whereHoaDon = {};
    
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro) return res.json([]);
      const activeRooms = await Phong.findAll({ where: { id_chu_tro: chuTro.id_chu_tro }, attributes: ['id_phong'] });
      whereHoaDon.id_phong = activeRooms.map(p => p.id_phong);
    } else if (req.userRole === 'NGUOI_THUE') {
      const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!nguoiThue) return res.json([]);
      const hopDongs = await HopDong.findAll({ where: { id_nguoi_thue: nguoiThue.id_nguoi_thue }, attributes: ['id_phong'] });
      whereHoaDon.id_phong = hopDongs.map(hd => hd.id_phong);
    } else if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const thanhToans = await ThanhToan.findAll({
      include: [
        {
          model: HoaDon,
          as: 'HoaDon',
          where: whereHoaDon,
          attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien'],
          include: [
            { model: Phong, as: 'Phong', attributes: ['ten_phong'] }
          ]
        }
      ],
      order: [['ngay_thanh_toan', 'DESC']]
    });
    res.json(thanhToans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thanhToan/hoa_don/:id_hoa_don - Danh sách thanh toán theo hóa đơn
router.get('/hoa_don/:id_hoa_don', verifyToken, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    if (!hoaDon) return res.status(404).json({ error: 'Hóa đơn không tồn tại' });

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro || hoaDon.Phong.id_chu_tro !== chuTro.id_chu_tro) {
        return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
      }
    } else if (req.userRole === 'NGUOI_THUE') {
      const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      const hopDong = await HopDong.findOne({ where: { id_nguoi_thue: nguoiThue?.id_nguoi_thue, id_phong: hoaDon.id_phong } });
      if (!hopDong) return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
    }

    const thanhToans = await ThanhToan.findAll({
      where: { id_hoa_don: req.params.id_hoa_don },
      include: [
        {
          model: HoaDon,
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'thang_nam', 'tong_tien']
        }
      ],
      order: [['ngay_thanh_toan', 'DESC']]
    });
    res.json(thanhToans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thanhToan/:id_thanh_toan - Chi tiết thanh toán
router.get('/:id_thanh_toan', verifyToken, async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id_thanh_toan, {
      include: [
        {
          model: HoaDon,
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'id_phong', 'thang_nam', 'tong_tien'],
          include: [
            { model: Phong, as: 'Phong', attributes: ['id_chu_tro', 'ten_phong'] }
          ]
        }
      ]
    });

    if (!thanhToan) return res.status(404).json({ error: 'Thanh toán không tồn tại' });

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro || thanhToan.HoaDon.Phong.id_chu_tro !== chuTro.id_chu_tro) {
        return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
      }
    } else if (req.userRole === 'NGUOI_THUE') {
      const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      const hopDong = await HopDong.findOne({ where: { id_nguoi_thue: nguoiThue?.id_nguoi_thue, id_phong: thanhToan.HoaDon.id_phong } });
      if (!hopDong) return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
    }

    res.json(thanhToan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thanhToan - Tạo thanh toán mới (Auth required)
router.post('/', verifyToken, requireAuthenticated, async (req, res) => {
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
        error: 'hinh_thuc phải là một trong: tiền mặt, VietQR - Chuyển khoản'
      });
    }

    // Check if bill exists
    const hoaDon = await HoaDon.findByPk(id_hoa_don, {
      include: [{ model: Phong, as: 'Phong', attributes: ['id_chu_tro'] }]
    });
    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }

    // ✅ Kiểm tra người thanh toán có phải chủ trọ sở hữu hóa đơn này không
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro || hoaDon.Phong.id_chu_tro !== chuTro.id_chu_tro) {
        return res.status(403).json({ error: 'Bạn không có quyền thanh toán hóa đơn này' });
      }
    }

    // Lấy tổng thanh toán hiện tại
    const existingPayments = await ThanhToan.sum('so_tien', { where: { id_hoa_don } });
    const totalPaid = (existingPayments || 0) + parseFloat(so_tien);

    // Kiểm tra số tiền thanh toán không vượt quá tổng hóa đơn
    if (totalPaid > parseFloat(hoaDon.tong_tien)) {
      return res.status(400).json({
        error: `Tổng thanh toán (${totalPaid}) vượt quá tổng tiền hóa đơn (${hoaDon.tong_tien})`
      });
    }

    // Create payment
    const thanhToan = await ThanhToan.create({
      id_hoa_don,
      so_tien,
      hinh_thuc,
      ngay_thanh_toan: new Date()
    });

    // ✅ Chỉ đánh PAID nếu đã thanh toán đủ tổng tiền
    let newStatus = 0; // Chưa thanh toán
    if (totalPaid >= parseFloat(hoaDon.tong_tien)) {
      newStatus = 1; // Đã thanh toán đủ
    }
    await hoaDon.update({ trang_thai: newStatus });

    // Nếu thanh toán xong hoàn toàn (không phải tiền mặt đang chờ duyệt)
    if (newStatus === 1 && hoaDon.id_hop_dong) {
      await checkAndActivateContract(hoaDon.id_hop_dong);
    }

    res.status(201).json({
      message: 'Ghi nhận thanh toán thành công',
      data: thanhToan,
      payment_info: {
        so_tien_thanh_toan: so_tien,
        tong_da_thanh_toan: totalPaid,
        tong_tien_hoa_don: hoaDon.tong_tien,
        trang_thai: totalPaid >= parseFloat(hoaDon.tong_tien) ? 'Đã thanh toán đủ' : 'Chưa thanh toán đủ'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/thanhToan/:id_thanh_toan - Cập nhật thanh toán (Chủ trọ/Admin)
router.put('/:id_thanh_toan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
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

    // Nếu chủ trọ cập nhật thanh toán và hóa đơn được xem là đã hoàn thành
    const hoaDon = await HoaDon.findByPk(thanhToan.id_hoa_don);
    if (hoaDon && hoaDon.trang_thai === 1 && hoaDon.id_hop_dong) {
      await checkAndActivateContract(hoaDon.id_hop_dong);
    }

    res.json({
      message: 'Cập nhật thanh toán thành công',
      data: thanhToan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/thanhToan/:id_thanh_toan - Xóa thanh toán (Chủ trọ/Admin)
router.delete('/:id_thanh_toan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
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

    res.json({
      message: 'Xóa thanh toán thành công',
      id_thanh_toan: parseInt(req.params.id_thanh_toan)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;