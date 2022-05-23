const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
const { Study } = require('./study');

class UserStudyMapping extends Model {};

UserStudyMapping.init({
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(15)
  },
  created_by: {
    type: DataTypes.INTEGER
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
  modelName: 'UserStudyMapping'
});

UserStudyMapping.belongsTo(Users, {
  foreignKey: 'user_id',
  targetKey: 'id'
});

Users.hasMany(UserStudyMapping, {
  foreignKey: 'user_id',
  sourceKey: 'id'
});

UserStudyMapping.belongsTo(Study, {
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(UserStudyMapping, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});


module.exports.UserStudyMapping = sequelize.models.UserStudyMapping;
