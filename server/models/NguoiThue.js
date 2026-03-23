import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NguoiThue = sequelize.define('NguoiThue', {
  id_nguoi_thue: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ho_ten: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cccd: {
    type: DataTypes.STRING(20)
  },
  so_dien_thoai: {
    type: DataTypes.STRING(15)
  },
  email: {
    type: DataTypes.STRING(100)
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
  tableName: 'nguoi_thue',
  timestamps: false
});

export default NguoiThue;