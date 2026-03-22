import express from 'express';
import HopDong from '../models/HopDong.js';
import Phong from '../models/Phong.js';
import NguoiThue from '../models/NguoiThue.js';
import ChuTro from '../models/ChuTro.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  requireAuthenticated
} from '../middlewares/auth.js';
import { validateDate, isEndDateAfterStartDate, validateAmount } from '../utils/validators.js';

const router = express.Router();

// GET /api/hopDong - Danh sách hợp đồng (Chủ trọ/Admin)
router.get('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereCondition = {};
    
    // Chủ trọ chỉ xem hợp đồng của phòng mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      // Lấy danh sách phòng của chủ trọ
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      
      const idPhongs = danhSachPhong.map(p => p.id_phong);
      whereCondition.id_phong = idPhongs;
    }
    
    const hopDongs = await HopDong.findAll({
      where: whereCondition,
      include: [
        { model: Phong, as: 'Phong' },
        { model: NguoiThue, as: 'NguoiThue' }
      ],
      order: [['ngay_bat_dau', 'DESC']]
    });
    
    res.json(hopDongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hopDong/:id_hop_dong - Chi tiết hợp đồng (Auth required)
router.get('/:id_hop_dong', verifyToken, requireAuthenticated, async (req, res) => {
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

    // Kiểm tra quyền xem hợp đồng
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      // Chủ trọ chỉ xem hợp đồng của phòng mình
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    } else if (req.userRole === 'NGUOI_THUE') {
      // Người thuê chỉ xem hợp đồng của mình
      const nguoiThue = await NguoiThue.findOne({ 
        where: { id_tai_khoan: req.userId } 
      });
      
      if (!nguoiThue || hopDong.id_nguoi_thue !== nguoiThue.id_nguoi_thue) {
        return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' });
      }
    }

    res.json(hopDong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hopDong - Tạo hợp đồng mới (Auth required)
router.post('/', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const { id_phong, ngay_bat_dau, ngay_ket_thuc, tien_coc } = req.body;
    let { id_nguoi_thue } = req.body;

    // Tự động phân giải id_nguoi_thue nếu user là NGUOI_THUE
    if (req.userRole === 'NGUOI_THUE') {
      const nguoiThueOfUser = await NguoiThue.findOne({ where: { id_tai_khoan: req.userId } });
      if (!nguoiThueOfUser) {
        return res.status(403).json({ error: 'Không tìm thấy hồ sơ người thuê của bạn' });
      }
      id_nguoi_thue = nguoiThueOfUser.id_nguoi_thue;
    }

    // Validate required fields
    if (!id_phong || !id_nguoi_thue || !ngay_bat_dau || !ngay_ket_thuc || !tien_coc) {
      console.log(1);
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: id_phong, id_nguoi_thue, ngay_bat_dau, ngay_ket_thuc, tien_coc' 
      });
      
    }

    // Validate date format
    if (!validateDate(ngay_bat_dau) || !validateDate(ngay_ket_thuc)) {
      console.log(2);
      return res.status(400).json({ error: 'Ngày phải có định dạng DD-MM-YYYY' });
    }

    // Validate end date after start date
    if (!isEndDateAfterStartDate(ngay_bat_dau, ngay_ket_thuc)) {
      console.log(3);
      return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    // Validate amount
    if (!validateAmount(tien_coc)) {
      console.log(4);
      return res.status(400).json({ error: 'tien_coc phải là số dương' });
    }

    // Check if room exists
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    // Kiểm tra quyền tạo hợp đồng cho phòng này
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
      if (!chuTro || phong.id_chu_tro !== chuTro.id_chu_tro) {
        return res.status(403).json({ error: 'Bạn không có quyền tạo hợp đồng cho phòng này' });
      }
    }

    // Check if room is available
    if (phong.trang_thai === 1) {
      return res.status(400).json({ error: 'Phòng đã có người thuê' });
    }

    // Check if tenant exists
    const nguoiThue = await NguoiThue.findByPk(id_nguoi_thue);
    if (!nguoiThue) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    // Kiểm tra người thuê đã có hợp đồng đang hoạt động chưa
    const existingContract = await HopDong.findOne({
      where: {
        id_nguoi_thue,
        trang_thai: 1
      }
    });

    if (existingContract) {
      console.log("Người thuê đang có phòng");
      return res.status(400).json({ 
        error: 'Người thuê đã có hợp đồng đang hoạt động' 
      });
    }

    // Filter to YYYY-MM-DD for MySQL
    const formatForMySQL = (dateStr) => {
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    };

    // Create contract
    const hopDong = await HopDong.create({
      id_phong,
      id_nguoi_thue,
      ngay_bat_dau: formatForMySQL(ngay_bat_dau),
      ngay_ket_thuc: formatForMySQL(ngay_ket_thuc),
      tien_coc,
      trang_thai: 1
    });

    // Update room status to occupied
    await phong.update({ trang_thai: 1 });

    res.status(201).json({
      message: 'Tạo hợp đồng thành công',
      data: hopDong
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hopDong/:id_hop_dong - Cập nhật hợp đồng (Chủ trọ/Admin)
router.put('/:id_hop_dong', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    
    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    // Kiểm tra quyền sửa hợp đồng
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa hợp đồng này' });
      }
    }

    const { ngay_bat_dau, ngay_ket_thuc, tien_coc, trang_thai } = req.body;

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

    const formatForMySQL = (dateStr) => {
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    };

    // Update fields
    if (ngay_bat_dau) hopDong.ngay_bat_dau = formatForMySQL(ngay_bat_dau);
    if (ngay_ket_thuc) hopDong.ngay_ket_thuc = formatForMySQL(ngay_ket_thuc);
    if (tien_coc) hopDong.tien_coc = tien_coc;
    if (trang_thai !== undefined) {
      hopDong.trang_thai = trang_thai;
      
      // Nếu kết thúc hợp đồng, cập nhật trạng thái phòng
      if (trang_thai === 0) {
        const phong = await Phong.findByPk(hopDong.id_phong);
        if (phong) {
          await phong.update({ trang_thai: 0 });
        }
      }
    }

    await hopDong.save();
    res.json({
      message: 'Cập nhật hợp đồng thành công',
      data: hopDong
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hopDong/:id_hop_dong - Xóa hợp đồng (Chủ trọ/Admin)
router.delete('/:id_hop_dong', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const hopDong = await HopDong.findByPk(req.params.id_hop_dong, {
      include: [{ model: Phong, as: 'Phong' }]
    });
    
    if (!hopDong) {
      return res.status(404).json({ error: 'Hợp đồng không tồn tại' });
    }

    // Kiểm tra quyền xóa hợp đồng
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      if (hopDong.Phong.id_chu_tro !== req.idChuTro) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa hợp đồng này' });
      }
    }

    // Get the room to update its status
    const phong = await Phong.findByPk(hopDong.id_phong);
    
    // Delete contract
    await hopDong.destroy();

    // Update room status back to vacant
    if (phong) {
      await phong.update({ trang_thai: 0 });
    }

    res.json({ 
      message: 'Xóa hợp đồng thành công',
      id_hop_dong: parseInt(req.params.id_hop_dong) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;