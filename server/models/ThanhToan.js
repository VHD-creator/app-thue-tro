import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThanhToan = sequelize.define('ThanhToan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  billId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'hoadon',
      key: 'id',
    },
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nguoithue',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  method: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'credit_card'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'thanhtoan'
});

export default ThanhToan;