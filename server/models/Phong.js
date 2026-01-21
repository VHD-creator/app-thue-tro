import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phong = sequelize.define('phong', {
  id_phong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_chu_tro: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ten_phong: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gia_phong: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mo_ta: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'phong',
  timestamps: false
});

export default Phong;
