import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaiKhoan = sequelize.define(
  'TaiKhoan',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'tai_khoan',
    timestamps: false,
    freezeTableName: true, // ⭐ thêm để Sequelize không tự đổi tên bảng
  }
);

export default TaiKhoan;
