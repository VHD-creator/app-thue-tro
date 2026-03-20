import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaiKhoan = sequelize.define(
  'TaiKhoan',
  {
    id_tai_khoan: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    ten_dang_nhap: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    mat_khau: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    vai_tro: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    trang_thai: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: 'tai_khoan',
    timestamps: false,
    freezeTableName: true,
  }
);

export default TaiKhoan;
