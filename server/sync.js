import sequelize from './config/database.js';
import './models/ChuTro.js';
import './models/HoaDon.js'
import './models/HopDong.js';
import './models/NguoiThue.js';
import './models/Phong.js';
import './models/quanHe.js';
import './models/TaiKhoan.js';
import './models/ThanhToan.js';
import './models/HinhAnhPhong.js';
import dotenv from 'dotenv';

dotenv.config();

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // force: true để xóa và tạo lại tables
    console.log('Database đã được đồng bộ thành công');
  } catch (error) {
    console.error('Lỗi đồng bộ database:', error);
  }
};

syncDatabase();