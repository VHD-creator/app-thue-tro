import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HoaDon = sequelize.define('HoaDon', {
  id_hoa_don: {
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
  thang_nam: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'MM-YYYY'
  },
  so_dien_cu: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  so_dien_moi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  so_nuoc_cu: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  so_nuoc_moi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tien_dien: {
    type: DataTypes.DECIMAL(12, 2)
  },
  tien_nuoc: {
    type: DataTypes.DECIMAL(12, 2)
  },
  tien_phong: {
    type: DataTypes.DECIMAL(12, 2)
  },
  tong_tien: {
    type: DataTypes.DECIMAL(12, 2)
  },
  id_hop_dong: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'hop_dong',
      key: 'id_hop_dong'
    }
  },
  trang_thai: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0: Chưa trả, 1: Đã trả, 2: Còn nợ'
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hoa_don',
  timestamps: false
}
);

export default HoaDon;