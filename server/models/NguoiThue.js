import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NguoiThue = sequelize.define('NguoiThue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Rooms',
      key: 'id',
    },
  },
  leaseStart: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  leaseEnd: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'nguoithue'
});

export default NguoiThue;