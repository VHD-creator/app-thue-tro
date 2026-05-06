import jwt from 'jsonwebtoken';
import { TaiKhoan, ChuTro, Phong } from '../models/quanHe.js';

// ================= VERIFY TOKEN =================
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await TaiKhoan.findByPk(decoded.id, {
      attributes: ['id_tai_khoan', 'vai_tro', 'trang_thai']
    });

    if (!user) return res.status(401).json({ error: 'Token không hợp lệ' });
    if (user.trang_thai !== 1) return res.status(403).json({ error: 'Tài khoản bị khóa' });

    req.user = user;
    req.userId = user.id_tai_khoan;
    req.userRole = user.vai_tro;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token lỗi hoặc hết hạn' });
  }
};

// ================= OPTIONAL AUTH =================
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await TaiKhoan.findByPk(decoded.id, {
      attributes: ['id_tai_khoan', 'vai_tro', 'trang_thai']
    });

    if (user && user.trang_thai === 1) {
      req.user = user;
      req.userId = user.id_tai_khoan;
      req.userRole = user.vai_tro;
    }

    next();
  } catch (err) {
    next();
  }
};

// ================= LOAD CHU TRO =================
export const loadChuTro = async (req, res, next) => {
  try {
    if (req.userRole !== 'CHU_TRO') return next();

    const chuTro = await ChuTro.findOne({
      where: { id_tai_khoan: req.userId },
      attributes: ['id_chu_tro', 'email_verified', 'phone_verified']
    });

    if (!chuTro) {
      return res.status(404).json({ error: 'Không tìm thấy chủ trọ' });
    }

    req.chuTro = chuTro;
    req.idChuTro = chuTro.id_chu_tro;

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= ROLE =================
export const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ admin' });
  }
  next();
};

export const requireChuTroOrAdmin = (req, res, next) => {
  if (!['CHU_TRO', 'ADMIN'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Không có quyền' });
  }
  next();
};

export const requireAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  next();
};

// ================= VERIFIED =================
export const requireChuTroVerified = (req, res, next) => {
  if (req.userRole === 'ADMIN') return next();

  if (req.userRole !== 'CHU_TRO') {
    return res.status(403).json({ error: 'Không có quyền' });
  }

  if (!req.chuTro?.email_verified) {
    return res.status(403).json({ error: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư.' });
  }

  next();
};

// ================= CHECK PHONG =================
export const checkPhongOwnership = async (req, res, next) => {
  try {
    if (req.userRole === 'ADMIN') return next();

    const phongId = req.params.id_phong || req.body.id_phong;
    if (!phongId) return next();

    const phong = await Phong.findByPk(phongId);
    if (!phong) return res.status(404).json({ error: 'Phòng không tồn tại' });

    if (req.userRole === 'CHU_TRO' && phong.id_chu_tro !== req.idChuTro) {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    req.phong = phong;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};