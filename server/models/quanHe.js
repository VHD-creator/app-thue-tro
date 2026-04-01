import Phong from './Phong.js';
import NguoiThue from './NguoiThue.js';
import HoaDon from './HoaDon.js';
import ThanhToan from './ThanhToan.js';
import ChuTro from './ChuTro.js';
import TaiKhoan from './TaiKhoan.js';
import HopDong from './HopDong.js';
import HinhAnhPhong from './HinhAnhPhong.js';
import YeuCauThue from './YeuCauThue.js';

// ==================== ASSOCIATIONS ====================

HinhAnhPhong.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });
Phong.hasMany(HinhAnhPhong, { foreignKey: 'id_phong', as: 'DanhSachHinhAnh' });

Phong.hasMany(HopDong, { foreignKey: 'id_phong', as: 'DanhSachHopDong' });
HopDong.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });

NguoiThue.hasMany(HopDong, { foreignKey: 'id_nguoi_thue', as: 'DanhSachHopDong' });
HopDong.belongsTo(NguoiThue, { foreignKey: 'id_nguoi_thue', as: 'NguoiThue' });

Phong.hasMany(HoaDon, { foreignKey: 'id_phong', as: 'DanhSachHoaDon' });
HoaDon.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });

HopDong.hasMany(HoaDon, { foreignKey: 'id_hop_dong', as: 'DanhSachHoaDon' });
HoaDon.belongsTo(HopDong, { foreignKey: 'id_hop_dong', as: 'HopDong' });

HoaDon.hasMany(ThanhToan, { foreignKey: 'id_hoa_don', as: 'DanhSachThanhToan' });
ThanhToan.belongsTo(HoaDon, { foreignKey: 'id_hoa_don', as: 'HoaDon' });

TaiKhoan.hasOne(ChuTro, { foreignKey: 'id_tai_khoan', as: 'ChuTro' });
ChuTro.belongsTo(TaiKhoan, { foreignKey: 'id_tai_khoan', as: 'TaiKhoan' });

ChuTro.hasMany(Phong, { foreignKey: 'id_chu_tro', as: 'DanhSachPhong' });
Phong.belongsTo(ChuTro, { foreignKey: 'id_chu_tro', as: 'ChuTro' });

TaiKhoan.hasOne(NguoiThue, { foreignKey: 'id_tai_khoan', as: 'NguoiThue' });
NguoiThue.belongsTo(TaiKhoan, { foreignKey: 'id_tai_khoan', as: 'TaiKhoan' });

// ✅ YeuCauThue associations
Phong.hasMany(YeuCauThue, { foreignKey: 'id_phong', as: 'DanhSachYeuCau' });
YeuCauThue.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });

NguoiThue.hasMany(YeuCauThue, { foreignKey: 'id_nguoi_thue', as: 'DanhSachYeuCau' });
YeuCauThue.belongsTo(NguoiThue, { foreignKey: 'id_nguoi_thue', as: 'NguoiThue' });

export { Phong, NguoiThue, HoaDon, ThanhToan, ChuTro, TaiKhoan, HopDong, HinhAnhPhong, YeuCauThue };