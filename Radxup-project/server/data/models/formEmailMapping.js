const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');

class FormEmailMapping extends Model {};

FormEmailMapping.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  form_group: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  form_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  form_code: {
    type: DataTypes.STRING(100)
  },
  version: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  email_code:{
    type: DataTypes.STRING(100)
  },
  email_version: {
    type: DataTypes.STRING(30)
  },
  email_reminder_code: {
    type: DataTypes.STRING(100)
  },
  email_reminder_version: {
    type: DataTypes.STRING(30)
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  created_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_by: {
    type: DataTypes.INTEGER,
  },
  updated_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
},{
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'FormEmailMapping'
});

FormEmailMapping.belongsTo(Users,{
  foreignKey: 'created_by',
  targetKey: 'id'
});

Users.hasMany(FormEmailMapping,{
  foreignKey: 'created_by',
  sourceKey: 'id'
});

FormEmailMapping.belongsTo(Users,{
  foreignKey: 'updated_by',
  targetKey: 'id'
});

Users.hasMany(FormEmailMapping,{
  foreignKey: 'updated_by',
  sourceKey: 'id'
});

module.exports.FormEmailMapping = sequelize.models.FormEmailMapping;
