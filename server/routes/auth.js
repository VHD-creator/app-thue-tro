import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import TaiKhoan from '../models/TaiKhoan.js';
import ChuTro from '../models/ChuTro.js';
import NguoiThue from '../models/NguoiThue.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// ================= ĐĂNG KÝ =================
router.post('/register', async (req, res) => {
  try {
    const { ten_dang_nhap, password, vai_tro, ho_ten, email, so_dien_thoai } = req.body;

    // 1. Validate
    if (!ten_dang_nhap || !password) {
      return res.status(400).json({
        message: 'Thiếu tên đăng nhập hoặc password',
      });
    }

    const allowedVaiTro = ['CHU_TRO', 'NGUOI_THUE'];
    const finalVaiTro = allowedVaiTro.includes(vai_tro) ? vai_tro : 'NGUOI_THUE';

    // 2. Kiểm tra tài khoản tồn tại
    const existedUser = await TaiKhoan.findOne({
      where: { ten_dang_nhap },
    });

    if (existedUser) {
      return res.status(400).json({
        message: 'Tài khoản đã tồn tại',
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Tạo tài khoản
    const newUser = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau: hashedPassword,
      vai_tro: finalVaiTro,
      trang_thai: 1,
    });

    // 5. Tạo profile tương ứng
    if (finalVaiTro === 'CHU_TRO' && ho_ten) {
      await ChuTro.create({
        ho_ten,
        email,
        so_dien_thoai,
        id_tai_khoan: newUser.id_tai_khoan
      });
    } else if (finalVaiTro === 'NGUOI_THUE' && ho_ten) {
      await NguoiThue.create({
        ho_ten,
        email,
        so_dien_thoai,
        id_tai_khoan: newUser.id_tai_khoan
      });
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
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ================= ĐĂNG NHẬP =================
router.post('/login', async (req, res) => {
  try {
    const { ten_dang_nhap, password } = req.body;

    // 1. Validate
    if (!ten_dang_nhap || !password) {
      return res.status(400).json({
        message: 'Thiếu tên đăng nhập hoặc password',
      });
    }

    // 2. Tìm user và include profile
    const user = await TaiKhoan.findOne({
      where: { ten_dang_nhap },
      include: [
        { model: ChuTro, as: 'ChuTro', attributes: ['id_chu_tro', 'ho_ten', 'email'] },
        { model: NguoiThue, as: 'NguoiThue', attributes: ['id_nguoi_thue', 'ho_ten', 'email'] }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Sai tên đăng nhập hoặc mật khẩu',
      });
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.trang_thai !== 1) {
      return res.status(403).json({
        message: 'Tài khoản đã bị khóa',
      });
    }

    // 4. Check password
    const isMatch = await bcrypt.compare(password, user.mat_khau);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Sai tên đăng nhập hoặc mật khẩu',
      });
    }

    // 5. Tạo JWT
    const token = jwt.sign(
      {
        id: user.id_tai_khoan,
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token hết hạn sau 7 ngày
    );

    // 6. Response với thông tin đầy đủ
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

    // Thêm profile info nếu có
    if (user.vai_tro === 'CHU_TRO' && user.ChuTro) {
      responseData.user.chu_tro = user.ChuTro;
    } else if (user.vai_tro === 'NGUOI_THUE' && user.NguoiThue) {
      responseData.user.nguoi_thue = user.NguoiThue;
    }

    return res.json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ================= LẤY THÔNG TIN USER HIỆN TẠI =================
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

    res.json({
      message: 'Lấy thông tin thành công',
      user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ================= ĐỔI MẬT KHẨU =================
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;

    if (!mat_khau_cu || !mat_khau_moi) {
      return res.status(400).json({ 
        message: 'Thiếu mật khẩu cũ hoặc mật khẩu mới' 
      });
    }

    if (mat_khau_moi.length < 6) {
      return res.status(400).json({ 
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      });
    }

    const user = await TaiKhoan.findByPk(req.userId);

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    }

    // Hash và cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
    user.mat_khau = hashedPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ================= REFRESH TOKEN (Optional) =================
router.post('/refresh-token', verifyToken, async (req, res) => {
  try {
    // Tạo token mới
    const newToken = jwt.sign(
      {
        id: req.user.id_tai_khoan,
        ten_dang_nhap: req.user.ten_dang_nhap,
        vai_tro: req.user.vai_tro
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Refresh token thành công',
      token: newToken
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;