import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const YeuCauThue = sequelize.define('YeuCauThue', {
  id_yeu_cau: {
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
  ngay_bat_dau_mong_muon: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Ngày muốn bắt đầu thuê'
  },
  ghi_chu: {
    type: DataTypes.TEXT,
    comment: 'Ghi chú thêm của người thuê'
  },
  trang_thai: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối'
  },
  ly_do_tu_choi: {
    type: DataTypes.STRING(500),
    comment: 'Lý do từ chối (nếu có)'
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_xu_ly: {
    type: DataTypes.DATE,
    comment: 'Ngày chủ trọ xử lý yêu cầu'
  }
}, {
  tableName: 'yeu_cau_thue',
  timestamps: false
});

export default YeuCauThue;