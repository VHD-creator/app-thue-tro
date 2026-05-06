import express from 'express';
import { HoaDon, ThanhToan, Phong, ChuTro } from '../models/quanHe.js';
import { verifyToken, requireAuthenticated, requireChuTroOrAdmin } from '../middlewares/auth.js';
import { taoVietQR, taoNoiDungChuyenKhoan, DANH_SACH_NGAN_HANG } from '../services/vietQrService.js';

const router = express.Router();

/**
 * =========================================
 * PUBLIC API
 * =========================================
 */

// ✅ Lấy danh sách ngân hàng
router.get('/ngan-hang', (req, res) => {
  res.json(DANH_SACH_NGAN_HANG);
});


/**
 * =========================================
 * NGƯỜI THUÊ
 * =========================================
 */

// ✅ Tạo QR thanh toán từ hóa đơn
router.get('/hoa-don/:id_hoa_don', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{
        model: Phong,
        as: 'Phong',
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
      return res.status(400).json({ error: 'Hóa đơn đã thanh toán' });
    }

    const chuTro = hoaDon.Phong?.ChuTro;

    if (!chuTro || !chuTro.so_tai_khoan || !chuTro.ma_ngan_hang) {
      return res.status(400).json({
        error: 'Chủ trọ chưa cập nhật thông tin ngân hàng'
      });
    }

    // ✅ Tạo nội dung chuyển khoản
    const noiDung = taoNoiDungChuyenKhoan(
      hoaDon.id_hoa_don,
      hoaDon.thang_nam
    );

    // ✅ Tạo QR
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
          '1. Mở app ngân hàng',
          '2. Chọn Quét QR',
          '3. Quét mã',
          '4. Xác nhận thanh toán',
          `Nội dung: ${noiDung}`
        ]
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * =========================================
 * CHỦ TRỌ
 * =========================================
 */

// ✅ Cập nhật thông tin ngân hàng
router.put('/chu-tro/ngan-hang', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { so_tai_khoan, ten_ngan_hang, ma_ngan_hang } = req.body;

    if (!so_tai_khoan || !ten_ngan_hang || !ma_ngan_hang) {
      return res.status(400).json({
        error: 'Thiếu thông tin ngân hàng'
      });
    }

    // ✅ Validate mã ngân hàng
    const hopLe = DANH_SACH_NGAN_HANG.find(
      bank => bank.ma_bin === ma_ngan_hang
    );

    if (!hopLe) {
      return res.status(400).json({
        error: 'Mã ngân hàng không hợp lệ'
      });
    }

    const chuTro = await ChuTro.findOne({
      where: { id_tai_khoan: req.userId }
    });

    if (!chuTro) {
      return res.status(404).json({
        error: 'Không tìm thấy chủ trọ'
      });
    }

    await chuTro.update({
      so_tai_khoan,
      ten_ngan_hang,
      ma_ngan_hang
    });

    // ✅ QR preview
    const qr = taoVietQR(
      ma_ngan_hang,
      so_tai_khoan,
      10000,
      'QR PREVIEW',
      chuTro.ho_ten
    );

    res.json({
      message: 'Cập nhật thành công',
      data: chuTro,
      qr_preview: qr.qr_url
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Lấy thông tin ngân hàng của chủ trọ
router.get('/chu-tro/ngan-hang', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const chuTro = await ChuTro.findOne({
      where: { id_tai_khoan: req.userId },
      attributes: ['ho_ten', 'so_tai_khoan', 'ten_ngan_hang', 'ma_ngan_hang']
    });

    if (!chuTro) {
      return res.status(404).json({
        error: 'Không tìm thấy chủ trọ'
      });
    }

    const daCapNhat = !!(chuTro.so_tai_khoan && chuTro.ma_ngan_hang);

    res.json({
      da_cap_nhat: daCapNhat,
      data: chuTro,
      qr_preview: daCapNhat
        ? taoVietQR(
            chuTro.ma_ngan_hang,
            chuTro.so_tai_khoan,
            10000,
            'QR PREVIEW',
            chuTro.ho_ten
          ).qr_url
        : null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Chủ trọ xác nhận đã nhận tiền
router.post('/xac-nhan/:id_hoa_don', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id_hoa_don, {
      include: [{ model: Phong, as: 'Phong' }]
    });

    if (!hoaDon) {
      return res.status(404).json({
        error: 'Hóa đơn không tồn tại'
      });
    }

    if (hoaDon.trang_thai === 1) {
      return res.status(400).json({
        error: 'Đã thanh toán rồi'
      });
    }

    // ✅ Check quyền
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hoaDon.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({
          error: 'Không có quyền'
        });
      }
    }

    const { so_tien } = req.body;

    await ThanhToan.create({
      id_hoa_don: hoaDon.id_hoa_don,
      so_tien: so_tien || hoaDon.tong_tien,
      hinh_thuc: 'VietQR',
      ngay_thanh_toan: new Date()
    });

    await hoaDon.update({ trang_thai: 1 });

    res.json({
      message: 'Xác nhận thành công',
      data: hoaDon
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;