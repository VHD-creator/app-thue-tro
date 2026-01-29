import Phong from './Phong.js';
import NguoiThue from './NguoiThue.js';
import HoaDon from './HoaDon.js';
import ThanhToan from './ThanhToan.js';

// Associations
Phong.hasMany(NguoiThue, { foreignKey: 'roomId', as: 'DanhSachNguoiThue' });
NguoiThue.belongsTo(Phong, { foreignKey: 'roomId', as: 'Phong' });

NguoiThue.hasMany(HoaDon, { foreignKey: 'tenantId', as: 'DanhSachHoaDon' });
HoaDon.belongsTo(NguoiThue, { foreignKey: 'tenantId', as: 'NguoiThue' });

Phong.hasMany(HoaDon, { foreignKey: 'roomId', as: 'DanhSachHoaDon' });
HoaDon.belongsTo(Phong, { foreignKey: 'roomId', as: 'Phong' });

HoaDon.hasMany(ThanhToan, { foreignKey: 'billId', as: 'DanhSachThanhToan' });
ThanhToan.belongsTo(HoaDon, { foreignKey: 'billId', as: 'HoaDon' });

NguoiThue.hasMany(ThanhToan, { foreignKey: 'tenantId', as: 'DanhSachThanhToan' });
ThanhToan.belongsTo(NguoiThue, { foreignKey: 'tenantId', as: 'NguoiThue' });

export { Phong, NguoiThue, HoaDon, ThanhToan };