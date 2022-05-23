const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');
class Users extends Model {};

Users.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  UID: {
    type: DataTypes.STRING(15)
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  first_name: {
    type: DataTypes.STRING(30),
    defaultValue: ""
  },
  last_name: {
    type: DataTypes.STRING(30),
    defaultValue: ""
  },
  personal_email: {
    type: DataTypes.STRING(60)
  },
  mobile_phone: {
    type: DataTypes.STRING(10)
  },
  participant_id: {
    type: DataTypes.STRING(10)
  },
  is_anonymous_user: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  role_id: {
    type: DataTypes.INTEGER
  },
  otp: {
    type: DataTypes.INTEGER
  },
  password: {
    type: DataTypes.STRING
  },
  salt: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING(15)
  },
  initiated_by: {
    type: DataTypes.STRING
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
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'Users'
});

Users.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(Users,{
  foreignKey: 'study_id',
  sourceKey: 'id'
});

module.exports.Users = sequelize.models.Users;
