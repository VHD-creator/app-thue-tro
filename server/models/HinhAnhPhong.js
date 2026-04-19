import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HinhAnhPhong = sequelize.define('HinhAnhPhong', {
  id_hinh_anh: {
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
  ten_file: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Tên file gốc'
  },
  duong_dan: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Đường dẫn file trên server hoặc cloud'
  },
  loai_hinh: {
    type: DataTypes.ENUM('phong_ngu', 'phong_tam', 'phong_khach', 'ban_cong', 'bep', 'khac'),
    defaultValue: 'khac',
    comment: 'Loại hình ảnh'
  },
  la_anh_dai_dien: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Ảnh đại diện của phòng'
  },
  thu_tu: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Thứ tự hiển thị'
  },
  mo_ta: {
    type: DataTypes.STRING(500),
    comment: 'Mô tả hình ảnh'
  },
  kich_thuoc: {
    type: DataTypes.INTEGER,
    comment: 'Kích thước file (bytes)'
  },
  file_hash: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: false,
    comment: 'SHA-256 hash của file ảnh để phát hiện trùng lặp'
  },
  ngay_upload: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hinh_anh_phong',
  timestamps: false
});

export default HinhAnhPhong;