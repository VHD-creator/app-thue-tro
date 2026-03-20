import jwt from 'jsonwebtoken';
import TaiKhoan from '../models/TaiKhoan.js';
import ChuTro from '../models/ChuTro.js';

// ============== MIDDLEWARE AUTHENTICATION ==============

/**
 * Kiểm tra và verify JWT token
 * Gắn user info vào req.user
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập' });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lấy thông tin user từ database
    const taiKhoan = await TaiKhoan.findByPk(decoded.id);
    
    if (!taiKhoan) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    if (taiKhoan.trang_thai !== 1) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // Gắn thông tin user vào request
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

/**
 * Middleware kiểm tra auth (alias của verifyToken)
 */
export const checkAuth = verifyToken;

/**
 * Optional auth - không bắt buộc phải có token
 */
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
    // Nếu token không hợp lệ, vẫn cho qua nhưng không set user
    next();
  }
};

// ============== MIDDLEWARE AUTHORIZATION ==============

/**
 * Chỉ ADMIN mới được phép
 * Dùng cho: Quản lý tài khoản hệ thống, cài đặt toàn hệ thống
 */
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

/**
 * CHU_TRO hoặc ADMIN đều được phép
 * Dùng cho: Quản lý phòng, người thuê, hóa đơn, hợp đồng
 */
export const requireChuTroOrAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }
    
    if (req.userRole !== 'CHU_TRO' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ chủ trọ hoặc admin mới có quyền' });
    }
    
    // Nếu là chủ trọ, lấy thêm thông tin id_chu_tro
    if (req.userRole === 'CHU_TRO') {
      const chuTro = await ChuTro.findOne({ 
        where: { id_tai_khoan: req.user.id_tai_khoan } 
      });
      
      if (chuTro) {
        req.idChuTro = chuTro.id_chu_tro;
      } else {
        return res.status(400).json({ 
          error: 'Không tìm thấy thông tin chủ trọ. Vui lòng liên hệ admin.' 
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * NGUOI_THUE, CHU_TRO, hoặc ADMIN đều được phép
 * Dùng cho: Xem thông tin cá nhân, thanh toán
 */
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

/**
 * Kiểm tra xem user có phải chủ sở hữu resource không
 * Hoặc là admin (admin có thể truy cập mọi thứ)
 */
export const requireOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userRole) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập' });
      }
      
      // Admin có thể truy cập mọi thứ
      if (req.userRole === 'ADMIN') {
        return next();
      }
      
      // Kiểm tra ownership
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

// ============== HELPER FUNCTIONS ==============

/**
 * Kiểm tra xem phòng có thuộc về chủ trọ hiện tại không
 */
export const checkPhongOwnership = async (req, res, next) => {
  try {
    // Admin không cần check ownership
    if (req.userRole === 'ADMIN') {
      return next();
    }
    
    const { id_phong } = req.params;
    const { id_phong: bodyIdPhong } = req.body;
    const phongId = id_phong || bodyIdPhong;
    
    if (!phongId) {
      return next(); // Không có id_phong trong request
    }
    
    const Phong = (await import('../models/Phong.js')).default;
    const phong = await Phong.findByPk(phongId);
    
    if (!phong) {
      return res.status(404).json({ error: 'Phòng không tồn tại' });
    }
    
    // Kiểm tra phòng có thuộc chủ trọ này không
    if (req.userRole === 'CHU_TRO' && req.idChuTro && phong.id_chu_tro !== req.idChuTro) {
      return res.status(403).json({ error: 'Bạn không có quyền quản lý phòng này' });
    }
    
    req.phong = phong;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Filter data theo chủ trọ (chỉ xem data của mình)
 * Admin thì xem tất cả
 */
export const filterByOwner = (req, query = {}) => {
  if (req.userRole === 'ADMIN') {
    return query; // Admin xem tất cả
  }
  
  if (req.userRole === 'CHU_TRO' && req.idChuTro) {
    return { ...query, id_chu_tro: req.idChuTro }; // Chủ trọ chỉ xem của mình
  }
  
  return query;
};