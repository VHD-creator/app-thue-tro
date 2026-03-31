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
  },
  // ✅ Thông tin ngân hàng để tạo VietQR
  so_tai_khoan: {
    type: DataTypes.STRING(20),
    comment: 'Số tài khoản ngân hàng'
  },
  ten_ngan_hang: {
    type: DataTypes.STRING(50),
    comment: 'Tên ngân hàng (VD: Vietcombank, BIDV, Techcombank...)'
  },
  ma_ngan_hang: {
    type: DataTypes.STRING(20),
    comment: 'Mã BIN ngân hàng dùng cho VietQR (VD: 970436 là Vietcombank)'
  }
}, {
  tableName: 'chu_tro',
  timestamps: false
});

export default ChuTro;