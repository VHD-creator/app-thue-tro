import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChuTro = sequelize.define('ChuTro', {
  id_chu_tro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ho_ten: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  so_dien_thoai: {
    type: DataTypes.STRING(15)
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true
  },
  dia_chi: {
    type: DataTypes.STRING(255)
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  id_tai_khoan: {
    type: DataTypes.INTEGER,
    unique: true,
    references: {
      model: 'tai_khoan',
      key: 'id_tai_khoan'
    }
  }
}, {
  tableName: 'chu_tro',
  timestamps: false
});

export default ChuTro;
