import express from 'express';
import NguoiThue from '../models/NguoiThue.js';
import { 
  verifyToken,
  requireChuTroOrAdmin, 
  requireAuthenticated 
} from '../middlewares/auth.js';

const router = express.Router();

// GET /api/nguoiThue - Lấy danh sách người thuê đang có hợp đồng (Chủ trọ/Admin)
router.get('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const HopDong = (await import('../models/HopDong.js')).default;
    const Phong = (await import('../models/Phong.js')).default;
    const ChuTro = (await import('../models/ChuTro.js')).default;

    let includeOptions = [
      {
        model: HopDong,
        as: 'DanhSachHopDong',
        where: { trang_thai: 1 },
        attributes: ['id_hop_dong', 'id_phong', 'ngay_bat_dau', 'ngay_ket_thuc'],
        required: true // INNER JOIN: chỉ lấy người thuê CÓ hợp đồng active
      }
    ];

    // Nếu là chủ trọ, chỉ lấy người thuê đang ở phòng của mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      const idPhongs = danhSachPhong.map(p => p.id_phong);

      includeOptions[0].where = {
        trang_thai: 1,
        id_phong: idPhongs
      };
    }

    const tenants = await NguoiThue.findAll({
      include: includeOptions,
      order: [['ho_ten', 'ASC']]
    });

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nguoiThue/:id_nguoi_thue - Chi tiết người thuê (Auth required)
router.get('/:id_nguoi_thue', verifyToken, requireAuthenticated, async (req, res) => {
  try {
    const HopDong = (await import('../models/HopDong.js')).default;
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue, {
      include: [
        {
          model: HopDong,
          as: 'DanhSachHopDong',
          where: { trang_thai: 1 },
          attributes: ['id_hop_dong', 'id_phong', 'ngay_bat_dau', 'ngay_ket_thuc'],
          required: false
        }
      ]
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    // Người thuê chỉ xem được thông tin của mình
    if (req.userRole === 'NGUOI_THUE') {
      const selfTenant = await NguoiThue.findOne({ 
        where: { id_tai_khoan: req.userId } 
      });
      
      if (!selfTenant || selfTenant.id_nguoi_thue !== tenant.id_nguoi_thue) {
        return res.status(403).json({ error: 'Bạn chỉ có thể xem thông tin của mình' });
      }
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nguoiThue - Tạo người thuê mới (Chủ trọ/Admin)
router.post('/', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { ho_ten, cccd, so_dien_thoai, email, id_tai_khoan } = req.body;

    // Validation
    if (!ho_ten || !cccd) {
      return res.status(400).json({ error: 'Thiếu dữ liệu: ho_ten, cccd' });
    }

    // Kiểm tra CCCD đã tồn tại chưa
    const existingTenant = await NguoiThue.findOne({ where: { cccd } });
    if (existingTenant) {
      return res.status(400).json({ error: 'CCCD đã tồn tại trong hệ thống' });
    }

    // Validate CCCD format (12 số)
    if (!/^\d{12}$/.test(cccd)) {
      return res.status(400).json({ error: 'CCCD phải là 12 chữ số' });
    }

    const tenant = await NguoiThue.create({
      ho_ten,
      cccd,
      so_dien_thoai,
      email,
      id_tai_khoan
    });

    res.status(201).json({
      message: 'Tạo người thuê thành công',
      data: tenant
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/nguoiThue/:id_nguoi_thue - Cập nhật người thuê (Chủ trọ/Admin)
router.put('/:id_nguoi_thue', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    const { ho_ten, cccd, so_dien_thoai, email } = req.body;

    // Nếu cập nhật CCCD, kiểm tra trùng lặp
    if (cccd && cccd !== tenant.cccd) {
      // Validate format
      if (!/^\d{12}$/.test(cccd)) {
        return res.status(400).json({ error: 'CCCD phải là 12 chữ số' });
      }
      
      const existingTenant = await NguoiThue.findOne({ where: { cccd } });
      if (existingTenant) {
        return res.status(400).json({ error: 'CCCD đã tồn tại trong hệ thống' });
      }
      tenant.cccd = cccd;
    }

    // Update fields
    if (ho_ten) tenant.ho_ten = ho_ten;
    if (so_dien_thoai) tenant.so_dien_thoai = so_dien_thoai;
    if (email) tenant.email = email;

    await tenant.save();
    res.json({
      message: 'Cập nhật người thuê thành công',
      data: tenant
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/nguoiThue/:id_nguoi_thue - Xóa người thuê (Chủ trọ/Admin)
router.delete('/:id_nguoi_thue', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id_nguoi_thue);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Người thuê không tồn tại' });
    }

    // Kiểm tra xem người thuê có hợp đồng đang hoạt động không
    const HopDong = (await import('../models/HopDong.js')).default;
    const activeContract = await HopDong.findOne({
      where: {
        id_nguoi_thue: tenant.id_nguoi_thue,
        trang_thai: 1
      }
    });

    if (activeContract) {
      return res.status(400).json({ 
        error: 'Không thể xóa người thuê đang có hợp đồng hoạt động' 
      });
    }

    await tenant.destroy();
    res.json({ 
      message: 'Xóa người thuê thành công',
      id_nguoi_thue: parseInt(req.params.id_nguoi_thue) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;