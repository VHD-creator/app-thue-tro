import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phong = sequelize.define('Phong', {
  id_phong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_chu_tro: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chu_tro',
      key: 'id_chu_tro'
    }
  },
  ten_phong: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gia_phong: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0: Trống, 1: Đang thuê, 2: Chờ thanh toán, 3: Đang sửa chữa, 4: Hết hợp đồng'
  },
  mo_ta: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'phong',
  timestamps: false
});

export default Phong;