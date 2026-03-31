// ✅ Import dotenv/config trước tất cả - đúng cách với ES Modules
import 'dotenv/config';

import sequelize from './config/database.js';
import './models/TaiKhoan.js';
import './models/ChuTro.js';
import './models/NguoiThue.js';
import './models/Phong.js';
import './models/HopDong.js';
import './models/HoaDon.js';
import './models/ThanhToan.js';
import './models/HinhAnhPhong.js';
import './models/YeuCauThue.js';
import './models/quanHe.js';

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ Database đã được đồng bộ thành công');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi đồng bộ database:', error);
    process.exit(1);
  }
};

syncDatabase();