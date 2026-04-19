import jwt from 'jsonwebtoken';
import { TaiKhoan, ChuTro, Phong } from '../models/quanHe.js';

// ==================== VERIFY TOKEN ====================
// ✅ Dùng decoded.id — nhất quán với token được tạo trong auth.js
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Tìm user bằng decoded.id
    const taiKhoan = await TaiKhoan.findByPk(decoded.id);

    if (!taiKhoan) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    if (taiKhoan.trang_thai !== 1) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // ✅ Gắn thông tin vào request
    req.user = taiKhoan;
    req.userId = taiKhoan.id_tai_khoan;
    req.userRole = taiKhoan.vai_tro;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Alias
export const checkAuth = verifyToken;

// ==================== OPTIONAL AUTH ====================
// Không bắt buộc có token — nếu có thì parse, không có thì bỏ qua
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const taiKhoan = await TaiKhoan.findByPk(decoded.id);
      if (taiKhoan && taiKhoan.trang_thai === 1) {
        req.user = taiKhoan;
        req.userId = taiKhoan.id_tai_khoan;
        req.userRole = taiKhoan.vai_tro;
      }
    }
    next();
  } catch (error) {
    // Token không hợp lệ → vẫn cho qua nhưng không set user
    next();
  }
};

// ==================== REQUIRE ADMIN ====================
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền thực hiện' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== REQUIRE CHU_TRO HOẶC ADMIN ====================
// ✅ Nếu là CHU_TRO → tự động lấy id_chu_tro gắn vào req.idChuTro
export const requireChuTroOrAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    if (req.userRole !== 'CHU_TRO' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ chủ trọ hoặc admin mới có quyền' });
    }

    // ✅ Lấy id_chu_tro cho chủ trọ
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({
        where: { id_tai_khoan: req.user.id_tai_khoan }
      });

      if (!chuTro) {
        return res.status(400).json({
          error: 'Không tìm thấy thông tin chủ trọ. Vui lòng liên hệ admin.'
        });
      }

      req.idChuTro = chuTro.id_chu_tro;
    }

    next();
  } catch (error) {
    console.error('Middleware requireChuTroOrAdmin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REQUIRE CHU_TRO ĐÃ XÁC THỰC EMAIL + SĐT ====================
export const requireChuTroVerified = async (req, res, next) => {
  try {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    if (req.userRole === 'ADMIN') return next();
    if (req.userRole !== 'CHU_TRO') {
      return res.status(403).json({ error: 'Chỉ chủ trọ mới có quyền truy cập' });
    }

    const chuTro = await ChuTro.findOne({ where: { id_tai_khoan: req.userId } });
    if (!chuTro) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin chủ trọ' });
    }

    if (!chuTro.email_verified || !chuTro.phone_verified) {
      return res.status(403).json({
        error: 'Bạn cần xác thực email và số điện thoại để thực hiện thao tác này'
      });
    }

    next();
  } catch (error) {
    console.error('Middleware requireChuTroVerified error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REQUIRE AUTHENTICATED (bất kỳ vai trò nào) ====================
export const requireAuthenticated = async (req, res, next) => {
  try {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== CHECK PHONG OWNERSHIP ====================
// ✅ Kiểm tra phòng có thuộc chủ trọ hiện tại không
export const checkPhongOwnership = async (req, res, next) => {
  try {
    // Admin không cần check
    if (req.userRole === 'ADMIN') return next();

    const { id_phong } = req.params;
    const { id_phong: bodyIdPhong } = req.body;
    const phongId = id_phong || bodyIdPhong;

    if (!phongId) return next();

    const phong = await Phong.findByPk(phongId);

    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }

    if (req.userRole === 'CHU_TRO' && req.idChuTro && phong.id_chu_tro !== req.idChuTro) {
      return res.status(403).json({ error: 'Bạn không có quyền quản lý phòng này' });
    }

    req.phong = phong;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== REQUIRE OWNER OR ADMIN ====================
export const requireOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userRole) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập' });
      }
      if (req.userRole === 'ADMIN') return next();

      const ownerId = await getOwnerId(req);
      if (req.userId !== ownerId) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập tài nguyên này' });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// ==================== FILTER BY OWNER ====================
export const filterByOwner = (req, query = {}) => {
  if (req.userRole === 'ADMIN') return query;
  if (req.userRole === 'CHU_TRO' && req.idChuTro) {
    return { ...query, id_chu_tro: req.idChuTro };
  }
  return query;
};