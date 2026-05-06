import express from 'express';
import { HopDong, Phong, NguoiThue, ChuTro, HoaDon } from '../models/quanHe.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  requireAuthenticated,
  loadChuTro
} from '../middlewares/auth.js';
import { validateDate, isEndDateAfterStartDate, validateAmount } from '../utils/validators.js';
import { generateContractPdf } from '../services/pdfService.js';

const router = express.Router();

// GET /api/hopDong - Danh sách hợp đồng
// ✅ Đã sửa: Cho phép Người thuê xem hợp đồng của chính mình
router.get('/', verifyToken, loadChuTro, async (req, res) => {
  try {
    let whereCondition = {};

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      // Chủ trọ xem hợp đồng của các phòng mình quản lý
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      whereCondition.id_phong = danhSachPhong.map(p => p.id_phong);
    } 
    else if (req.userRole === 'NGUOI_THUE') {
      // Người thuê chỉ xem hợp đồng của chính mình
      const nguoiThue = await NguoiThue.findOne({
        where: { id_tai_khoan: req.userId }
      });

      if (!nguoiThue) {
        return res.json([]); // Không có profile người thuê
      }

      whereCondition.id_nguoi_thue = nguoiThue.id_nguoi_thue;
    } 
    else if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const hopDongs = await HopDong.findAll({
      where: whereCondition,
      include: [
        { model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten', 'so_dien_thoai'] }
      ],
      order: [['ngay_bat_dau', 'DESC']]
    });

    res.json(hopDongs);
  } catch (error) {
    console.error('Error in GET /api/hopDong:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hopDong/:id_hop_dong - Chi tiết hợp đồng
router.get('/:id_hop_dong', verifyToken, requireAuthenticated, loadChuTro, async (req, res) => {
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

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    } else if (req.userRole === 'NGUOI_THUE') {
      const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!nguoiThue || hopDong.id_nguoi_thue !== nguoiThue.id_nguoi_thue) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    }

    res.json(hopDong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hopDong/:id_hop_dong/pdf - Xuất PDF hợp đồng
router.get('/:id_hop_dong/pdf', verifyToken, requireAuthenticated, loadChuTro, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [
        { 
          model: Phong, 
          as: 'Phong',
          include: [{ model: ChuTro, as: 'ChuTro' }]
        },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    // Kiểm tra quyền
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    } else if (req.userRole === 'NGUOI_THUE') {
      const nguoiThue = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!nguoiThue || hopDong.id_nguoi_thue !== nguoiThue.id_nguoi_thue) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    }

    const chuTro = hopDong.Phong?.ChuTro || {};
    const nguoiThue = hopDong.NguoiThue || {};
    const phong = hopDong.Phong || {};

    await generateContractPdf(hopDong, chuTro, nguoiThue, phong, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hopDong - Tạo hợp đồng mới
router.post('/', verifyToken, requireAuthenticated, loadChuTro, async (req, res) => {
  try {
    const { id_phong, ngay_bat_dau, ngay_ket_thuc, tien_coc } = req.body;
    let { id_nguoi_thue } = req.body;

    if (req.userRole === 'NGUOI_THUE') {
      const nguoiThueOfUser = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!nguoiThueOfUser) {
        return res.status(403).json({ error: 'Không tìm thấy hồ sơ người thuê của bạn' });
      }
      id_nguoi_thue = nguoiThueOfUser.id_nguoi_thue;
    }

    if (!id_phong || !id_nguoi_thue || !ngay_bat_dau || !ngay_ket_thuc || !tien_coc) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: id_phong, id_nguoi_thue, ngay_bat_dau, ngay_ket_thuc, tien_coc' 
      });
    }

    if (!validateDate(ngay_bat_dau) || !validateDate(ngay_ket_thuc)) {
      return res.status(400).json({ error: 'Ngày phải có định dạng DD-MM-YYYY' });
    }

    if (!isEndDateAfterStartDate(ngay_bat_dau, ngay_ket_thuc)) {
      return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    if (!validateAmount(tien_coc)) {
      return res.status(400).json({ error: 'tien_coc phải là số dương' });
    }

    const phong = await Phong.findByPk(id_phong);
    if (!phong) return res.status(404).json({ error: 'Phòng không tồn tại' });

    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro || phong.id_chu_tro !== chuTro.id_chu_tro) {
        return res.status(403).json({ error: 'Bạn không có quyền tạo hợp đồng cho phòng này' });
      }
    }

    if (phong.trang_thai === 1) {
      return res.status(400).json({ error: 'Phòng đã có người thuê' });
    }

    if (phong.trang_thai === 2) {
      return res.status(400).json({ error: 'Phòng đang có yêu cầu chờ duyệt' });
    }

    const nguoiThue = await NguoiThue.findByPk(id_nguoi_thue);
    if (!nguoiThue) return res.status(404).json({ error: 'Người thuê không tồn tại' });

    const existingContract = await HopDong.findOne({
      where: { id_nguoi_thue, trang_thai: 1 }
    });

    if (existingContract) {
      return res.status(400).json({ error: 'Người thuê đã có hợp đồng đang hoạt động' });
    }

    const formatForMySQL = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr; // Đã là YYYY-MM-DD
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    };

    const hopDong = await HopDong.create({
      id_phong,
      id_nguoi_thue,
      ngay_bat_dau: formatForMySQL(ngay_bat_dau),
      ngay_ket_thuc: formatForMySQL(ngay_ket_thuc),
      tien_coc,
      trang_thai: 2
    });

    await phong.update({ trang_thai: 2 });

    // Tự động tạo 2 hóa đơn
    const now = new Date();
    const thangNay = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    await HoaDon.create({
      id_phong,
      id_hop_dong: hopDong.id_hop_dong,
      thang_nam: thangNay,
      tien_phong: tien_coc,
      tong_tien: tien_coc,
      trang_thai: 0,
      ghi_chu: `Tiền cọc phòng ${phong.ten_phong}`
    });

    await HoaDon.create({
      id_phong,
      id_hop_dong: hopDong.id_hop_dong,
      thang_nam: thangNay,
      tien_phong: phong.gia_phong,
      tong_tien: phong.gia_phong,
      trang_thai: 0,
      ghi_chu: `Tiền phòng tháng đầu tiên - ${phong.ten_phong}`
    });

    res.status(201).json({ message: 'Tạo hợp đồng thành công', data: hopDong });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hopDong/:id_hop_dong/ket-thuc
router.put('/:id_hop_dong/ket-thuc', verifyToken, requireChuTroOrAdmin, loadChuTro, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [
        { model: Phong, as: 'Phong' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    if (!hopDong) return res.status(404).json({ error: 'Hợp đồng không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền kết thúc hợp đồng này' });
      }
    }

    if (hopDong.trang_thai === 0) {
      return res.status(400).json({ error: 'Hợp đồng này đã kết thúc rồi' });
    }

    hopDong.trang_thai = 0;
    hopDong.ngay_ket_thuc = new Date();
    await hopDong.save();

    await Phong.update({ trang_thai: 0 }, { where: { id_phong: hopDong.id_phong } });

    res.json({
      message: 'Kết thúc hợp đồng thành công',
      data: {
        id_hop_dong: hopDong.id_hop_dong,
        id_phong: hopDong.id_phong,
        ten_phong: hopDong.Phong.ten_phong,
        nguoi_thue: hopDong.NguoiThue?.ho_ten,
        ngay_ket_thuc: hopDong.ngay_ket_thuc
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hopDong/:id_hop_dong - Cập nhật hợp đồng
router.put('/:id_hop_dong', verifyToken, requireChuTroOrAdmin, loadChuTro, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    
    if (!hopDong) return res.status(404).json({ error: 'Hợp đồng không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa hợp đồng này' });
      }
    }

    const { ngay_bat_dau, ngay_ket_thuc, tien_coc, trang_thai } = req.body;

    if (ngay_bat_dau && !validateDate(ngay_bat_dau)) {
      return res.status(400).json({ error: 'ngay_bat_dau phải có định dạng DD-MM-YYYY' });
    }

    if (ngay_ket_thuc && !validateDate(ngay_ket_thuc)) {
      return res.status(400).json({ error: 'ngay_ket_thuc phải có định dạng DD-MM-YYYY' });
    }

    const formatForMySQL = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr; // Đã là YYYY-MM-DD
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    };

    if (ngay_bat_dau) hopDong.ngay_bat_dau = formatForMySQL(ngay_bat_dau);
    if (ngay_ket_thuc) hopDong.ngay_ket_thuc = formatForMySQL(ngay_ket_thuc);
    if (tien_coc) hopDong.tien_coc = tien_coc;
    if (trang_thai !== undefined) {
      hopDong.trang_thai = trang_thai;
      if (trang_thai === 0) {
        await Phong.update({ trang_thai: 0 }, { where: { id_phong: hopDong.id_phong } });
      }
    }

    await hopDong.save();
    res.json({ message: 'Cập nhật hợp đồng thành công', data: hopDong });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hopDong/:id_hop_dong
router.delete('/:id_hop_dong', verifyToken, requireChuTroOrAdmin, loadChuTro, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    
    if (!hopDong) return res.status(404).json({ error: 'Hợp đồng không tồn tại' });

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa hợp đồng này' });
      }
    }

    const phong = await Phong.findByPk(hopDong.id_phong);
    await hopDong.destroy();

    if (phong) await phong.update({ trang_thai: 0 });

    res.json({ message: 'Xóa hợp đồng thành công', id_hop_dong: parseInt(req.params.id_hop_dong) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;