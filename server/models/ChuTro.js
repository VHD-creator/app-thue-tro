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
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_verification_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  phone_verification_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  verification_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true
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
  },
  verification_status: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0: Chưa gửi, 1: Đang chờ duyệt, 2: Đã xác thực, 3: Bị từ chối'
  }
}, {
  tableName: 'chu_tro',
  timestamps: false
});

export default ChuTro;