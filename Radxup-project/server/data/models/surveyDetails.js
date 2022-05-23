const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');

class SurveyDetails extends Model {};

SurveyDetails.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  survey_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_form_map_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  form_code: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  form_group: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(30),
    defaultValue: ""
  },
  question: {
    type: DataTypes.STRING(500)
  },
  variable_name: {
    type: DataTypes.STRING
  },
  shared_variable_name: {
    type: DataTypes.STRING
  },
  shared_question: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  answer: {
    type: DataTypes.STRING(1000)
  },
  value: {
    type: DataTypes.STRING(100)
  },
  not_to_ans: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING(15),
    defaultValue: 'Active'
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
  modelName: 'SurveyDetails'
});

module.exports.SurveyDetails = sequelize.models.SurveyDetails;
