import Phong from './Phong.js';
import NguoiThue from './NguoiThue.js';
import HoaDon from './HoaDon.js';
import ThanhToan from './ThanhToan.js';
import ChuTro from './ChuTro.js';
import HopDong from './HopDong.js';
import TaiKhoan from './TaiKhoan.js';

// ============== Associations theo schema MySQL ==============

// ChuTro - TaiKhoan
ChuTro.belongsTo(TaiKhoan, { foreignKey: 'id_tai_khoan', as: 'TaiKhoan' });
TaiKhoan.hasOne(ChuTro, { foreignKey: 'id_tai_khoan', as: 'ChuTro' });

// NguoiThue - TaiKhoan
NguoiThue.belongsTo(TaiKhoan, { foreignKey: 'id_tai_khoan', as: 'TaiKhoan' });
TaiKhoan.hasOne(NguoiThue, { foreignKey: 'id_tai_khoan', as: 'NguoiThue' });

// Phong - ChuTro
Phong.belongsTo(ChuTro, { foreignKey: 'id_chu_tro', as: 'ChuTro' });
ChuTro.hasMany(Phong, { foreignKey: 'id_chu_tro', as: 'DanhSachPhong' });

// HopDong - Phong
HopDong.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });
Phong.hasMany(HopDong, { foreignKey: 'id_phong', as: 'DanhSachHopDong' });

// HopDong - NguoiThue
HopDong.belongsTo(NguoiThue, { foreignKey: 'id_nguoi_thue', as: 'NguoiThue' });
NguoiThue.hasMany(HopDong, { foreignKey: 'id_nguoi_thue', as: 'DanhSachHopDong' });

// HoaDon - Phong
HoaDon.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });
Phong.hasMany(HoaDon, { foreignKey: 'id_phong', as: 'DanhSachHoaDon' });

// ThanhToan - HoaDon
ThanhToan.belongsTo(HoaDon, { foreignKey: 'id_hoa_don', as: 'HoaDon' });
HoaDon.hasMany(ThanhToan, { foreignKey: 'id_hoa_don', as: 'DanhSachThanhToan' });

export { Phong, NguoiThue, HoaDon, ThanhToan, ChuTro, HopDong, TaiKhoan };