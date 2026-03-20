import Phong from './Phong.js';
import NguoiThue from './NguoiThue.js';
import HoaDon from './HoaDon.js';
import ThanhToan from './ThanhToan.js';
import ChuTro from './ChuTro.js';
import TaiKhoan from './TaiKhoan.js';
import HopDong from './HopDong.js';

// Associations
// Phong.hasMany(NguoiThue, { foreignKey: 'id_phong', as: 'DanhSachNguoiThue' }); // Bỏ vì NguoiThue không có id_phong
// NguoiThue.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' }); // Bỏ vì NguoiThue không có id_phong

Phong.hasMany(HopDong, { foreignKey: 'id_phong', as: 'DanhSachHopDong' });
HopDong.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });

NguoiThue.hasMany(HopDong, { foreignKey: 'id_nguoi_thue', as: 'DanhSachHopDong' });
HopDong.belongsTo(NguoiThue, { foreignKey: 'id_nguoi_thue', as: 'NguoiThue' });

Phong.hasMany(HoaDon, { foreignKey: 'id_phong', as: 'DanhSachHoaDon' });
HoaDon.belongsTo(Phong, { foreignKey: 'id_phong', as: 'Phong' });

HoaDon.hasMany(ThanhToan, { foreignKey: 'id_hoa_don', as: 'DanhSachThanhToan' });
ThanhToan.belongsTo(HoaDon, { foreignKey: 'id_hoa_don', as: 'HoaDon' });

TaiKhoan.hasOne(ChuTro, {foreignKey: 'id_tai_khoan',as: 'ChuTro'});
ChuTro.belongsTo(TaiKhoan, {foreignKey: 'id_tai_khoan',as: 'TaiKhoan'});

ChuTro.hasMany(Phong, {foreignKey: 'id_chu_tro',as: 'DanhSachPhong'});
Phong.belongsTo(ChuTro, {foreignKey: 'id_chu_tro',as: 'ChuTro'});

TaiKhoan.hasOne(NguoiThue, {foreignKey: 'id_tai_khoan',as: 'NguoiThue'});
NguoiThue.belongsTo(TaiKhoan, {foreignKey: 'id_tai_khoan',as: 'TaiKhoan'});

export { Phong, NguoiThue, HoaDon, ThanhToan, ChuTro, TaiKhoan, HopDong };