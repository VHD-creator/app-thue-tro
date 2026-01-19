import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HoaDon = sequelize.define('HoaDon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nguoithue',
      key: 'id',
    },
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'phong',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue'),
    defaultValue: 'pending',
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'hoadon'
});

export default HoaDon;