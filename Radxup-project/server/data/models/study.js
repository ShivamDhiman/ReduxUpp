const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');

class Study extends Model {};

Study.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.STRING(35)
  },
  awardee_org: {
    type: DataTypes.STRING(100)
  },
  name: {
    type: DataTypes.STRING(50)
  },
  description: {
    type: DataTypes.STRING(2000)
  },
  registration_description: {
    type: DataTypes.STRING(2000)
  },
  feedback_description: {
    type: DataTypes.STRING(2000)
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER
  },
  created_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_by: {
    type: DataTypes.INTEGER
  },
  updated_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
},{
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'Study'
});

module.exports.Study = sequelize.models.Study;
