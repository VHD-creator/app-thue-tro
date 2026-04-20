import express from 'express';
import { YeuCauThue, Phong, NguoiThue, HopDong, HoaDon } from '../models/quanHe.js';
import {
  verifyToken,
  requireChuTroOrAdmin,
  requireAuthenticated
} from '../middlewares/auth.js';

const router = express.Router();

// ==================== NGƯỜI THUÊ ====================

// POST /api/yeuCauThue - Gửi yêu cầu thuê phòng
// Luồng: Người thuê gửi → Phòng chuyển sang "Chờ duyệt" (trang_thai = 2)
router.post('/', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    // Chỉ người thuê mới được gửi yêu cầu
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới có thể gửi yêu cầu thuê phòng' });
    }

    const { id_phong, ngay_bat_dau_mong_muon, ngay_ket_thuc, tien_coc, ghi_chu } = req.body;

    if (!id_phong || !ngay_bat_dau_mong_muon || !tien_coc) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: id_phong, ngay_bat_dau_mong_muon, tien_coc' });
    }

    // Lấy thông tin người thuê từ tài khoản
    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });
    }

    // Kiểm tra phòng tồn tại và còn trống
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    if (phong.trang_thai === 1) {
      return res.status(400).json({ error: 'Phòng này đã có người thuê' });
    }

    if (phong.trang_thai === 2) {
      return res.status(400).json({ error: 'Phòng này đang có người chờ duyệt, vui lòng chọn phòng khác' });
    }

    // Kiểm tra người thuê có yêu cầu đang chờ duyệt không
    const yeuCauDangCho = await YeuCauThue.findOne({
      where: {
        id_nguoi_thue: nguoiThue.id_nguoi_thue,
        trang_thai: 0
      }
    });

    if (yeuCauDangCho) {
      return res.status(400).json({
        error: 'Bạn đang có yêu cầu thuê phòng chờ duyệt. Vui lòng chờ phản hồi trước khi gửi yêu cầu mới.'
      });
    }

    // Kiểm tra người thuê có hợp đồng đang hoạt động không
    const hopDongHienTai = await HopDong.findOne({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue, trang_thai: 1 }
    });

    if (hopDongHienTai) {
      return res.status(400).json({ error: 'Bạn đang có hợp đồng thuê phòng. Không thể gửi yêu cầu mới.' });
    }

    // ✅ Tạo yêu cầu thuê
    const yeuCau = await YeuCauThue.create({
      id_phong,
      id_nguoi_thue: nguoiThue.id_nguoi_thue,
      ngay_bat_dau_mong_muon,
      ghi_chu: ghi_chu || '',
      trang_thai: 0
    });

    // ✅ Cập nhật trạng thái phòng → Chờ duyệt (2)
    await phong.update({ trang_thai: 2 });

    // ✅ Tự động tạo 2 hóa đơn: Tiền cọc và Tiền phòng tháng đầu
    const HoaDon = (await import('../models/HoaDon.js')).default;
    const now = new Date();
    const thangNay = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    // 1. Hóa đơn tiền cọc
    await HoaDon.create({
      id_phong,
      thang_nam: thangNay,
      so_dien_cu: 0,
      so_dien_moi: 0,
      so_nuoc_cu: 0,
      so_nuoc_moi: 0,
      tien_dien: 0,
      tien_nuoc: 0,
      tien_phong: tien_coc,
      tong_tien: tien_coc,
      trang_thai: 0, // Chưa thanh toán
      ngay_tao: now,
      ghi_chu: `Tiền cọc phòng ${phong.ten_phong}`
    });

    // 2. Hóa đơn tiền phòng tháng đầu
    await HoaDon.create({
      id_phong,
      thang_nam: thangNay,
      so_dien_cu: 0,
      so_dien_moi: 0,
      so_nuoc_cu: 0,
      so_nuoc_moi: 0,
      tien_dien: 0,
      tien_nuoc: 0,
      tien_phong: phong.gia_phong,
      tong_tien: phong.gia_phong,
      trang_thai: 0, // Chưa thanh toán
      ngay_tao: now,
      ghi_chu: `Tiền phòng tháng đầu tiên - ${phong.ten_phong}`
    });

    res.status(201).json({
      message: 'Gửi yêu cầu thuê phòng thành công! Vui lòng chờ chủ trọ xác nhận.',
      data: yeuCau
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/yeuCauThue/cua-toi - Người thuê xem yêu cầu của mình
router.get('/cua-toi', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Chỉ người thuê mới có thể xem yêu cầu của mình' });
    }

    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    if (!nguoiThue) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người thuê' });
    }

    const yeuCaus = await YeuCauThue.findAll({
      where: { id_nguoi_thue: nguoiThue.id_nguoi_thue },
      include: [{
        model: Phong,
        as: 'Phong',
        attributes: ['id_phong', 'ten_phong', 'gia_phong', 'mo_ta']
      }],
      order: [['ngay_tao', 'DESC']]
    });

    res.json(yeuCaus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/yeuCauThue/:id_yeu_cau/huy - Người thuê hủy yêu cầu
router.delete('/:id_yeu_cau/huy', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    if (req.userRole !== 'NGUOI_THUE') {
      return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }

    const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
    const yeuCau = await YeuCauThue.findByPk(req.params.id_yeu_cau, {
      include: [{ model: Phong, as: 'Phong' }]
    });

    if (!yeuCau) return res.status(404).json({ error: 'Yêu cầu không tồn tại' });

    if (yeuCau.id_nguoi_thue !== nguoiThue.id_nguoi_thue) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy yêu cầu này' });
    }

    if (yeuCau.trang_thai !== 0) {
      return res.status(400).json({ error: 'Chỉ có thể hủy yêu cầu đang chờ duyệt' });
    }

    // ✅ Hủy yêu cầu → Phòng về trạng thái trống (0)
    await yeuCau.update({ trang_thai: 2, ly_do_tu_choi: 'Người thuê tự hủy', ngay_xu_ly: new Date() });
    await Phong.update({ trang_thai: 0 }, { where: { id_phong: yeuCau.id_phong } });

    res.json({ message: 'Hủy yêu cầu thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHỦ TRỌ ====================

// GET /api/yeuCauThue - Chủ trọ xem danh sách yêu cầu
router.get('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let phongIds = null;

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      phongIds = danhSachPhong.map(p => p.id_phong);
    }

    const whereClause = {};
    if (phongIds) whereClause.id_phong = phongIds;

    // Lọc theo trạng thái nếu có
    const { trang_thai } = req.query;
    if (trang_thai !== undefined && trang_thai !== '') {
      whereClause.trang_thai = parseInt(trang_thai);
    }

    const yeuCaus = await YeuCauThue.findAll({
      where: whereClause,
      include: [
        { model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['id_nguoi_thue', 'ho_ten', 'so_dien_thoai', 'email', 'cccd'] }
      ],
      order: [['ngay_tao', 'DESC']]
    });

    res.json(yeuCaus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/yeuCauThue/:id_yeu_cau/duyet - Chủ trọ DUYỆT yêu cầu → Tạo hợp đồng + phòng → Đã thuê
router.put('/:id_yeu_cau/duyet', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const yeuCau = await YeuCauThue.findByPk(req.params.id_yeu_cau, {
      include: [
        { model: Phong, as: 'Phong' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    if (!yeuCau) return res.status(404).json({ error: 'Yêu cầu không tồn tại' });

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (yeuCau.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền duyệt yêu cầu này' });
      }
    }

    if (yeuCau.trang_thai !== 0) {
      return res.status(400).json({ error: 'Yêu cầu này đã được xử lý rồi' });
    }

    const { ngay_ket_thuc, tien_coc } = req.body;

    if (!ngay_ket_thuc || !tien_coc) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: ngay_ket_thuc, tien_coc để tạo hợp đồng' });
    }

    // ✅ Tạo hợp đồng tự động
    const hopDong = await HopDong.create({
      id_phong: yeuCau.id_phong,
      id_nguoi_thue: yeuCau.id_nguoi_thue,
      ngay_bat_dau: yeuCau.ngay_bat_dau_mong_muon,
      ngay_ket_thuc: new Date(ngay_ket_thuc),
      tien_coc,
      trang_thai: 2 // Chờ cọc/thanh toán
    });

    // ✅ Cập nhật yêu cầu → Đã duyệt
    await yeuCau.update({ trang_thai: 1, ngay_xu_ly: new Date() });

    // ✅ Cập nhật trạng thái phòng → Chờ duyệt cọc (2)
    await Phong.update({ trang_thai: 2 }, { where: { id_phong: yeuCau.id_phong } });

    // ✅ Liên kết các hóa đơn (Tiền cọc & Tiền tháng đầu) với hợp đồng vừa tạo
    await HoaDon.update(
      { id_hop_dong: hopDong.id_hop_dong },
      { 
        where: { 
          id_phong: yeuCau.id_phong, 
          id_hop_dong: null,
          trang_thai: 0 // Chỉ hóa đơn chưa thanh toán
        } 
      }
    );

    res.json({
      message: 'Duyệt yêu cầu thành công! Hợp đồng đã được tạo.',
      hop_dong: hopDong,
      yeu_cau: yeuCau
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT /api/yeuCauThue/:id_yeu_cau/tu-choi - Chủ trọ TỪ CHỐI → Phòng về trống
router.put('/:id_yeu_cau/tu-choi', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const yeuCau = await YeuCauThue.findByPk(req.params.id_yeu_cau, {
      include: [{ model: Phong, as: 'Phong' }]
    });

    if (!yeuCau) return res.status(404).json({ error: 'Yêu cầu không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (yeuCau.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền từ chối yêu cầu này' });
      }
    }

    if (yeuCau.trang_thai !== 0) {
      return res.status(400).json({ error: 'Yêu cầu này đã được xử lý rồi' });
    }

    const { ly_do_tu_choi } = req.body;

    // ✅ Cập nhật yêu cầu → Từ chối
    await yeuCau.update({
      trang_thai: 2,
      ly_do_tu_choi: ly_do_tu_choi || 'Không phù hợp',
      ngay_xu_ly: new Date()
    });

    // ✅ Cập nhật trạng thái phòng → Còn trống (0)
    await Phong.update({ trang_thai: 0 }, { where: { id_phong: yeuCau.id_phong } });

    res.json({
      message: 'Đã từ chối yêu cầu. Phòng trở về trạng thái còn trống.',
      data: yeuCau
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;