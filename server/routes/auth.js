import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TaiKhoan, ChuTro, NguoiThue } from '../models/quanHe.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// ==================== ĐĂNG KÝ ====================
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { ten_dang_nhap, password, vai_tro, ho_ten, email, so_dien_thoai } = req.body;

    // Validate bắt buộc
    if (!ten_dang_nhap || !password) {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Chỉ cho phép đăng ký CHU_TRO hoặc NGUOI_THUE
    const allowedVaiTro = ['CHU_TRO', 'NGUOI_THUE'];
    const finalVaiTro = allowedVaiTro.includes(vai_tro) ? vai_tro : 'NGUOI_THUE';

    // Kiểm tra tài khoản đã tồn tại
    const existedUser = await TaiKhoan.findOne({ where: { ten_dang_nhap } });
    if (existedUser) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản
    const newUser = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau: hashedPassword,
      vai_tro: finalVaiTro,
      trang_thai: 1
    });

    // ✅ Tạo profile tương ứng nếu có ho_ten
    if (ho_ten) {
      if (finalVaiTro === 'CHU_TRO') {
        await ChuTro.create({
          ho_ten,
          email: email || null,
          so_dien_thoai: so_dien_thoai || null,
          id_tai_khoan: newUser.id_tai_khoan
        });
      } else if (finalVaiTro === 'NGUOI_THUE') {
        await NguoiThue.create({
          ho_ten,
          email: email || null,
          so_dien_thoai: so_dien_thoai || null,
          id_tai_khoan: newUser.id_tai_khoan
        });
      }
    }

    return res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        id_tai_khoan: newUser.id_tai_khoan,
        ten_dang_nhap: newUser.ten_dang_nhap,
        vai_tro: newUser.vai_tro
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== ĐĂNG NHẬP ====================
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { ten_dang_nhap, password } = req.body;

    if (!ten_dang_nhap || !password) {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }

    // ✅ Tìm user kèm profile (hỗ trợ đăng nhập bằng username hoặc email)
    let user = await TaiKhoan.findOne({
      where: { ten_dang_nhap },
      include: [
        { model: ChuTro, as: 'ChuTro', attributes: ['id_chu_tro', 'ho_ten', 'email', 'so_dien_thoai', 'dia_chi'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['id_nguoi_thue', 'ho_ten', 'email', 'so_dien_thoai', 'cccd'] }
      ]
    });

    // Nếu không tìm được, thử tìm bằng email trong bảng ChuTro
    if (!user) {
      const chuTro = await ChuTro.findOne({ where: { email: ten_dang_nhap } });
      if (chuTro?.id_tai_khoan) {
        user = await TaiKhoan.findByPk(chuTro.id_tai_khoan, {
          include: [
            { model: ChuTro, as: 'ChuTro', attributes: ['id_chu_tro', 'ho_ten', 'email', 'so_dien_thoai', 'dia_chi'] },
            { model: NguoiThue, as: 'NguoiThue', attributes: ['id_nguoi_thue', 'ho_ten', 'email', 'so_dien_thoai', 'cccd'] }
          ]
        });
      }
    }

    // Thử tìm bằng email trong bảng NguoiThue
    if (!user) {
      const nguoiThue = await NguoiThue.findOne({ where: { email: ten_dang_nhap } });
      if (nguoiThue?.id_tai_khoan) {
        user = await TaiKhoan.findByPk(nguoiThue.id_tai_khoan, {
          include: [
            { model: ChuTro, as: 'ChuTro', attributes: ['id_chu_tro', 'ho_ten', 'email', 'so_dien_thoai', 'dia_chi'] },
            { model: NguoiThue, as: 'NguoiThue', attributes: ['id_nguoi_thue', 'ho_ten', 'email', 'so_dien_thoai', 'cccd'] }
          ]
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    // ✅ Kiểm tra tài khoản bị khóa
    if (user.trang_thai !== 1) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' });
    }

    // ✅ Kiểm tra mật khẩu (hỗ trợ cả bcrypt và plaintext cũ)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.mat_khau);
    } catch (e) {
      console.error('Bcrypt error:', e);
    }

    // Fallback: password plaintext (dữ liệu cũ)
    if (!isMatch && password === user.mat_khau) {
      isMatch = true;
      // Tự động hash lại để bảo mật hơn
      try {
        user.mat_khau = await bcrypt.hash(password, 10);
        await user.save();
      } catch (e) {
        console.error('Auto-hash error:', e);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    // ✅ Tạo JWT — dùng 'id' để nhất quán với middleware verifyToken
    const token = jwt.sign(
      {
        id: user.id_tai_khoan,          // ✅ key 'id' — middleware dùng decoded.id
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Build response data
    const responseData = {
      message: 'Đăng nhập thành công',
      token,
      user: {
        id_tai_khoan: user.id_tai_khoan,
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro,
        trang_thai: user.trang_thai
      }
    };

    // Thêm thông tin profile theo vai trò
    if (user.vai_tro === 'CHU_TRO' && user.ChuTro) {
      responseData.user.profile = user.ChuTro;
    } else if (user.vai_tro === 'NGUOI_THUE' && user.NguoiThue) {
      responseData.user.profile = user.NguoiThue;
    }

    return res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== LẤY THÔNG TIN USER HIỆN TẠI ====================
// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await TaiKhoan.findByPk(req.userId, {
      attributes: { exclude: ['mat_khau'] },
      include: [
        { model: ChuTro, as: 'ChuTro' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    const userData = user.toJSON();
    const result = {
      id_tai_khoan: userData.id_tai_khoan,
      ten_dang_nhap: userData.ten_dang_nhap,
      vai_tro: userData.vai_tro,
      trang_thai: userData.trang_thai
    };

    if (userData.vai_tro === 'CHU_TRO') result.profile = userData.ChuTro;
    if (userData.vai_tro === 'NGUOI_THUE') result.profile = userData.NguoiThue;

    res.json({ message: 'Lấy thông tin thành công', user: result });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== ĐỔI MẬT KHẨU ====================
// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;

    if (!mat_khau_cu || !mat_khau_moi) {
      return res.status(400).json({ message: 'Thiếu mật khẩu cũ hoặc mới' });
    }

    if (mat_khau_moi.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await TaiKhoan.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    }

    user.mat_khau = await bcrypt.hash(mat_khau_moi, 10);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== REFRESH TOKEN ====================
// POST /api/auth/refresh-token
router.post('/refresh-token', verifyToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      {
        id: req.user.id_tai_khoan,
        ten_dang_nhap: req.user.ten_dang_nhap,
        vai_tro: req.user.vai_tro
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Refresh token thành công', token: newToken });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;