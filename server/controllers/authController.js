import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import TaiKhoan from '../models/TaiKhoan.js';

// ================= ĐĂNG KÝ =================
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate
    if (!email || !password) {
      return res.status(400).json({
        message: 'Thiếu email hoặc password',
      });
    }

    // 2. Kiểm tra tài khoản tồn tại
    const existedUser = await TaiKhoan.findOne({
      where: { email },
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
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        id: newUser.id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// ================= ĐĂNG NHẬP =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate
    if (!email || !password) {
      return res.status(400).json({
        message: 'Thiếu email hoặc password',
      });
    }

    // 2. Tìm user
    const user = await TaiKhoan.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Sai email hoặc mật khẩu',
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Sai email hoặc mật khẩu',
      });
    }

    // 4. Tạo JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Đăng nhập thành công',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};
