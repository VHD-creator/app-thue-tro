import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HopDong = sequelize.define('HopDong', {
  id_hop_dong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_phong: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'phong',
      key: 'id_phong'
    }
  },
  id_nguoi_thue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nguoi_thue',
      key: 'id_nguoi_thue'
    }
  },
  ngay_bat_dau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ngay_ket_thuc: {
    type: DataTypes.DATE
  },
  tien_coc: {
    type: DataTypes.DECIMAL(12, 2)
  },
  trang_thai: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '1: Còn hiệu lực, 0: Hết hạn, 2: Chờ cọc/thanh toán'
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hop_dong',
  timestamps: false
});

export default HopDong;
