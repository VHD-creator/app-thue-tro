import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phong = sequelize.define('Phong', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('single', 'double', 'suite'),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
    defaultValue: 'available',
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'phong'
});

export default Phong;