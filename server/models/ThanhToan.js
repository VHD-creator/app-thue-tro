import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThanhToan = sequelize.define('ThanhToan', {
  id_thanh_toan: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_hoa_don: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'hoa_don',
      key: 'id_hoa_don'
    }
  },
  so_tien: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  ngay_thanh_toan: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  hinh_thuc: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'thanh_toan',
  timestamps: false
});

export default ThanhToan;