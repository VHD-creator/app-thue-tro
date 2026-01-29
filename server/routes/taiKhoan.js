import express from 'express';
import TaiKhoan from '../models/TaiKhoan.js';
import { validateUsername, validatePassword, validateRole, validateStatus, validateStringLength } from '../utils/validators.js';

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

// GET /api/taiKhoan - Danh sách tài khoản (admin only)
router.get('/', checkAdminRole, async (req, res) => {
  try {
    const taiKhoans = await TaiKhoan.findAll({
      attributes: { exclude: ['mat_khau'] } // Hide passwords
    });
    res.json(taiKhoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/taiKhoan/:id_tai_khoan - Chi tiết tài khoản
router.get('/:id_tai_khoan', checkUser, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan, {
      attributes: { exclude: ['mat_khau'] }
    });

    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // Users can only view their own account unless admin
    if (req.session.userId !== parseInt(req.params.id_tai_khoan)) {
      const currentUser = await TaiKhoan.findByPk(req.session.userId);
      if (currentUser.vai_tro !== 'ADMIN') {
        return res.status(403).json({ error: 'Bạn chỉ có thể xem tài khoản của mình' });
      }
    }

    res.json(taiKhoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/taiKhoan - Tạo tài khoản mới (admin only)
router.post('/', checkAdminRole, async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

    // Validate required fields
    if (!ten_dang_nhap || !mat_khau || !vai_tro) {
      return res.status(400).json({ 
        error: 'Thiếu dữ liệu: ten_dang_nhap, mat_khau, vai_tro' 
      });
    }

    // Validate username
    if (!validateUsername(ten_dang_nhap)) {
      return res.status(400).json({ 
        error: 'ten_dang_nhap phải từ 4-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới' 
      });
    }

    // Validate password
    if (!validatePassword(mat_khau)) {
      return res.status(400).json({ 
        error: 'mat_khau phải ít nhất 6 ký tự, chứa ít nhất 1 chữ cái và 1 số' 
      });
    }

    // Validate role
    if (!validateRole(vai_tro)) {
      return res.status(400).json({ 
        error: 'vai_tro phải là một trong: ADMIN, CHU_TRO, NGUOI_THUE' 
      });
    }

    // Check if username already exists
    const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Create account
    const taiKhoan = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau, // Note: In production, should hash password
      vai_tro,
      trang_thai: trang_thai !== undefined ? trang_thai : 1
    });

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      taiKhoan: {
        id_tai_khoan: taiKhoan.id_tai_khoan,
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        vai_tro: taiKhoan.vai_tro,
        trang_thai: taiKhoan.trang_thai,
        ngay_tao: taiKhoan.ngay_tao
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/taiKhoan/:id_tai_khoan - Cập nhật tài khoản
router.put('/:id_tai_khoan', checkUser, async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // Check authorization
    const currentUser = await TaiKhoan.findByPk(req.session.userId);
    
    // Users can only update their own account unless admin
    if (req.session.userId !== parseInt(req.params.id_tai_khoan) && currentUser.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Bạn chỉ có thể cập nhật tài khoản của mình' });
    }

    // Only admin can change vai_tro and trang_thai
    if ((vai_tro || trang_thai !== undefined) && currentUser.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể thay đổi vai_tro hoặc trang_thai' });
    }

    // Check if new username already exists (if changing)
    if (ten_dang_nhap && ten_dang_nhap !== taiKhoan.ten_dang_nhap) {
      const existingUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
      if (existingUser) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }
      taiKhoan.ten_dang_nhap = ten_dang_nhap;
    }

    // Update fields if provided
    if (mat_khau) taiKhoan.mat_khau = mat_khau; // Note: should hash in production
    if (vai_tro) taiKhoan.vai_tro = vai_tro;
    if (trang_thai !== undefined) taiKhoan.trang_thai = trang_thai;

    await taiKhoan.save();

    res.json({
      message: 'Cập nhật tài khoản thành công',
      taiKhoan: {
        id_tai_khoan: taiKhoan.id_tai_khoan,
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        vai_tro: taiKhoan.vai_tro,
        trang_thai: taiKhoan.trang_thai
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/taiKhoan/:id_tai_khoan - Xóa tài khoản (admin only)
router.delete('/:id_tai_khoan', checkAdminRole, async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.params.id_tai_khoan);
    if (!taiKhoan) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // Prevent deleting the last admin
    if (taiKhoan.vai_tro === 'ADMIN') {
      const adminCount = await TaiKhoan.count({ where: { vai_tro: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Không thể xóa tài khoản admin cuối cùng' });
      }
    }

    await taiKhoan.destroy();

    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
