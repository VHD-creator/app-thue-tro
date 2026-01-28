import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaiKhoan = sequelize.define('TaiKhoan', {
  id_tai_khoan: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_dang_nhap: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  mat_khau: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  vai_tro: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'CHU_TRO / NGUOI_THUE'
  },
  trang_thai: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tai_khoan',
  timestamps: false
});

export default TaiKhoan;
