import express from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TaiKhoan, ChuTro, NguoiThue } from '../models/quanHe.js';
import { verifyToken } from '../middlewares/auth.js';
import { guiEmailXacThuc, guiEmailQuenMatKhau } from '../services/emailService.js';

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

    // Kiểm tra email/phone trùng nếu có
    if (email) {
      const sameEmailInChuTro = await ChuTro.findOne({ where: { email } });
      const sameEmailInNguoiThue = await NguoiThue.findOne({ where: { email } });
      if (sameEmailInChuTro || sameEmailInNguoiThue) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    if (so_dien_thoai) {
      const samePhoneInChuTro = await ChuTro.findOne({ where: { so_dien_thoai } });
      const samePhoneInNguoiThue = await NguoiThue.findOne({ where: { so_dien_thoai } });
      if (samePhoneInChuTro || samePhoneInNguoiThue) {
        return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
      }
    }

    // Nếu là chủ trọ, buộc email để xác thực
    const isChuTro = finalVaiTro === 'CHU_TRO';
    if (isChuTro && !email) {
      return res.status(400).json({ message: 'Chủ trọ phải cung cấp email để xác thực' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản
    const newUser = await TaiKhoan.create({
      ten_dang_nhap,
      mat_khau: hashedPassword,
      vai_tro: finalVaiTro,
      trang_thai: isChuTro ? 0 : 1
    });

    // Tạo token xác thực email cho chủ trọ
    const verificationToken = isChuTro ? crypto.randomBytes(32).toString('hex') : null;
    const verificationExpiry = isChuTro ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    // ✅ Tạo profile tương ứng
    if (isChuTro) {
      await ChuTro.create({
        ho_ten: ho_ten || null,
        email,
        so_dien_thoai: so_dien_thoai || null,
        id_tai_khoan: newUser.id_tai_khoan,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expiry: verificationExpiry
      });
    } else if (finalVaiTro === 'NGUOI_THUE') {
      await NguoiThue.create({
        ho_ten: ho_ten || null,
        email: email || null,
        so_dien_thoai: so_dien_thoai || null,
        id_tai_khoan: newUser.id_tai_khoan
      });
    }

    if (isChuTro && email) {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
      await guiEmailXacThuc(email, ho_ten, verifyUrl);
    }

    return res.status(201).json({
      message: isChuTro
        ? 'Đăng ký chủ trọ thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
        : 'Đăng ký thành công',
      data: {
        id_tai_khoan: newUser.id_tai_khoan,
        ten_dang_nhap: newUser.ten_dang_nhap,
        vai_tro: newUser.vai_tro,
        trang_thai: newUser.trang_thai
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

    // ✅ Kiểm tra tài khoản bị khóa hoặc chưa được phê duyệt
    if (user.trang_thai !== 1) {
      return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa. Vui lòng kiểm tra email hoặc liên hệ admin.' });
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

    // Thêm thông tin profile nếu có
    responseData.user.profile = user.ChuTro || user.NguoiThue || null;

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

    result.profile = userData.ChuTro || userData.NguoiThue || null;

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

// ==================== XÁC THỰC EMAIL ====================
// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }

    const chuTro = await ChuTro.findOne({ where: { verification_token: token } });

    if (!chuTro) {
      return res.status(404).json({ message: 'Token không tồn tại hoặc đã hết hạn' });
    }

    if (chuTro.email_verified) {
      return res.status(400).json({ message: 'Email đã được xác thực rồi' });
    }

    if (chuTro.verification_token_expiry && new Date() > new Date(chuTro.verification_token_expiry)) {
      return res.status(400).json({ message: 'Token đã hết hạn. Vui lòng yêu cầu gửi lại.' });
    }

    // ✅ Cập nhật xác thực email
    await chuTro.update({
      email_verified: true,
      verification_token: null,
      verification_token_expiry: null
    });

    // ✅ Kích hoạt tài khoản
    const taiKhoan = await TaiKhoan.findByPk(chuTro.id_tai_khoan);
    if (taiKhoan && taiKhoan.trang_thai === 0) {
      await taiKhoan.update({ trang_thai: 1 });
    }

    return res.json({
      message: 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== GỬI LẠI EMAIL XÁC THỰC ====================
// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email' });
    }

    const chuTro = await ChuTro.findOne({ where: { email } });

    if (!chuTro) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    if (chuTro.email_verified) {
      return res.status(400).json({ message: 'Email đã được xác thực rồi' });
    }

    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await chuTro.update({
      verification_token: newVerificationToken,
      verification_token_expiry: newExpiry
    });

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email/${newVerificationToken}`;

    await guiEmailXacThuc(email, chuTro.ho_ten, verifyUrl);

    return res.json({
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== QUÊN MẬT KHẨU ====================
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email' });
    }

    // 1. Tìm email trong ChuTro hoặc NguoiThue
    let person = await ChuTro.findOne({ where: { email } });
    if (!person) {
      person = await NguoiThue.findOne({ where: { email } });
    }

    if (!person || !person.id_tai_khoan) {
      return res.status(404).json({ message: 'Email không tồn tại trên hệ thống' });
    }

    const user = await TaiKhoan.findByPk(person.id_tai_khoan);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản liên kết' });
    }

    // 2. Tạo mã OTP 6 số và hết hạn (15 phút)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = new Date(Date.now() + 15 * 60000); // 15 phút

    await user.update({
      reset_password_token: resetToken,
      reset_password_expiry: resetExpiry
    });

    // 3. Gửi email
    await guiEmailQuenMatKhau(email, person.ho_ten, resetToken);

    return res.json({
      message: 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== ĐẶT LẠI MẬT KHẨU ====================
// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ message: 'Thiếu token hoặc mật khẩu mới' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // 1. Tìm user với token hợp lệ
    const user = await TaiKhoan.findOne({
      where: {
        reset_password_token: token,
        reset_password_expiry: { [Op.gt]: new Date() } // Chưa hết hạn
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // 2. Hash mật khẩu mới và cập nhật
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update({
      mat_khau: hashedPassword,
      reset_password_token: null,
      reset_password_expiry: null
    });

    return res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;