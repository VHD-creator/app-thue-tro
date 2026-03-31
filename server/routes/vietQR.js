import express from 'express';
import { HoaDon, ThanhToan, Phong, ChuTro } from '../models/quanHe.js';
import { verifyToken, requireAuthenticated, requireChuTroOrAdmin } from '../middlewares/auth.js';
import { taoVietQR, taoNoiDungChuyenKhoan, DANH_SACH_NGAN_HANG } from '../services/vietQrService.js';

const router = express.Router();

// ==================== PUBLIC ====================

// GET /api/vietqr/ngan-hang - Lấy danh sách ngân hàng hỗ trợ
router.get('/ngan-hang', (req, res) => {
  res.json(DANH_SACH_NGAN_HANG);
});

// ==================== NGƯỜI THUÊ ====================

// GET /api/vietqr/hoa-don/:id_hoa_don - Tạo QR thanh toán cho hóa đơn
router.get('/hoa-don/:id_hoa_don', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    // Lấy thông tin hóa đơn
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{
        model: Phong,
        as: 'Phong',
        attributes: ['id_phong', 'ten_phong', 'id_chu_tro'],
        include: [{
          model: ChuTro,
          as: 'ChuTro',
          attributes: ['ho_ten', 'so_tai_khoan', 'ten_ngan_hang', 'ma_ngan_hang']
        }]
      }]
    });

    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }

    if (hoaDon.trang_thai === 1) {
      return res.status(400).json({ error: 'Hóa đơn này đã được thanh toán rồi' });
    }

    const chuTro = hoaDon.Phong?.ChuTro;

    // Kiểm tra chủ trọ đã cập nhật thông tin ngân hàng chưa
    if (!chuTro?.so_tai_khoan || !chuTro?.ma_ngan_hang) {
      return res.status(400).json({ 
        error: 'Chủ trọ chưa cập nhật thông tin ngân hàng. Vui lòng liên hệ chủ trọ để thanh toán.' 
      });
    }

    // ✅ Tạo QR VietQR
    const noiDung = taoNoiDungChuyenKhoan(hoaDon.id_hoa_don, hoaDon.thang_nam);
    const qrData = taoVietQR(
      chuTro.ma_ngan_hang,
      chuTro.so_tai_khoan,
      hoaDon.tong_tien,
      noiDung,
      chuTro.ho_ten
    );

    res.json({
      hoa_don: {
        id_hoa_don: hoaDon.id_hoa_don,
        thang_nam: hoaDon.thang_nam,
        tong_tien: hoaDon.tong_tien,
        trang_thai: hoaDon.trang_thai
      },
      thanh_toan: {
        ...qrData,
        huong_dan: [
          '1. Mở app ngân hàng hoặc ví điện tử',
          '2. Chọn chức năng Quét QR hoặc Chuyển khoản',
          '3. Quét mã QR bên trên',
          '4. Kiểm tra thông tin và xác nhận thanh toán',
          `5. Nội dung chuyển khoản: ${noiDung}`
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHỦ TRỌ ====================

// PUT /api/vietqr/chu-tro/ngan-hang - Chủ trọ cập nhật thông tin ngân hàng
router.put('/chu-tro/ngan-hang', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { so_tai_khoan, ten_ngan_hang, ma_ngan_hang } = req.body;

    if (!so_tai_khoan || !ten_ngan_hang || !ma_ngan_hang) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: so_tai_khoan, ten_ngan_hang, ma_ngan_hang' 
      });
    }

    // Validate mã ngân hàng có trong danh sách không
    const nganhHangHopLe = DANH_SACH_NGAN_HANG.find(nh => nh.ma_bin === ma_ngan_hang);
    if (!nganhHangHopLe) {
      return res.status(400).json({ 
        error: 'Mã ngân hàng không hợp lệ. Vui lòng chọn từ danh sách ngân hàng hỗ trợ.' 
      });
    }

    const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
    if (!chuTro) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });
    }

    await chuTro.update({ so_tai_khoan, ten_ngan_hang, ma_ngan_hang });

    // ✅ Trả về QR mẫu để chủ trọ preview
    const qrMau = taoVietQR(
      ma_ngan_hang,
      so_tai_khoan,
      10000, // 10,000 VND để preview
      'QR MAU THANH TOAN',
      chuTro.ho_ten
    );

    res.json({
      message: 'Cập nhật thông tin ngân hàng thành công',
      data: {
        so_tai_khoan: chuTro.so_tai_khoan,
        ten_ngan_hang: chuTro.ten_ngan_hang,
        ma_ngan_hang: chuTro.ma_ngan_hang
      },
      qr_mau: qrMau.qr_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vietqr/chu-tro/ngan-hang - Chủ trọ xem thông tin ngân hàng hiện tại
router.get('/chu-tro/ngan-hang', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findOne({ 
      where: { id_tai_khoan: req.userId },
      attributes: ['ho_ten', 'so_tai_khoan', 'ten_ngan_hang', 'ma_ngan_hang']
    });

    if (!chuTro) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });
    }

    const daCapNhat = !!(chuTro.so_tai_khoan && chuTro.ma_ngan_hang);

    res.json({
      da_cap_nhat: daCapNhat,
      data: chuTro,
      // Nếu đã cập nhật thì trả về QR preview
      qr_preview: daCapNhat ? taoVietQR(
        chuTro.ma_ngan_hang,
        chuTro.so_tai_khoan,
        10000,
        'QR PREVIEW',
        chuTro.ho_ten
      ).qr_url : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST /api/vietqr/xac-nhan/:id_hoa_don - Chủ trọ xác nhận đã nhận tiền
router.post('/xac-nhan/:id_hoa_don', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong' }]
    });

    if (!hoaDon) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
    }

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hoaDon.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xác nhận hóa đơn này' });
      }
    }

    if (hoaDon.trang_thai === 1) {
      return res.status(400).json({ error: 'Hóa đơn này đã được xác nhận thanh toán rồi' });
    }

    const { so_tien, ghi_chu } = req.body;

    // ✅ Tạo bản ghi thanh toán
    await ThanhToan.create({
      id_hoa_don: hoaDon.id_hoa_don,
      so_tien: so_tien || hoaDon.tong_tien,
      hinh_thuc: 'VietQR - Chuyển khoản',
      ngay_thanh_toan: new Date()
    });

    // ✅ Cập nhật trạng thái hóa đơn → Đã thanh toán
    await hoaDon.update({ trang_thai: 1 });

    res.json({
      message: '✅ Xác nhận thanh toán thành công!',
      data: {
        id_hoa_don: hoaDon.id_hoa_don,
        thang_nam: hoaDon.thang_nam,
        so_tien: so_tien || hoaDon.tong_tien,
        ngay_thanh_toan: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;