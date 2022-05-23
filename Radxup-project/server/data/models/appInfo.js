const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');

class AppInfo extends Model {};

AppInfo.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    defaultValue: ''
  },
  value:{
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
},{
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'AppInfo'
});




module.exports.AppInfo = sequelize.models.AppInfo;
