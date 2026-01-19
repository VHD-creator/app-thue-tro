import sequelize from './config/database.js';
import './models/quanHe.js';

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // force: true để xóa và tạo lại tables
    console.log('Database đã được đồng bộ thành công');
  } catch (error) {
    console.error('Lỗi đồng bộ database:', error);
  }
};

syncDatabase();