const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { SurveyDetails } = require('./surveyDetails');
const { Study } = require('./study');
const { Users } = require('./users');
const { Forms } = require('./forms');

class Survey extends Model {};

Survey.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  form_id: {
    type: DataTypes.INTEGER
  },
  form_code: {
    type: DataTypes.STRING
  },
  form_group: {
    type: DataTypes.STRING(50),
    defaultValue: "Form",
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  form_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  event_name:{
    type: DataTypes.STRING(100),
    defaultValue: "",
    allowNull: false
  },
  participant_facing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  has_dependency:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  taken_by: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING(15)
  },
  sync_status: {
    type: DataTypes.STRING(15)
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  completed_at: {
    type: DataTypes.DATE
  },
  updated_by: {
    type: DataTypes.INTEGER,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  initiated_at: {
    type: DataTypes.DATE
  }
},{
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'Survey'
});

SurveyDetails.belongsTo(Survey,{
  foreignKey: 'survey_id',
  targetKey: 'id'
});

Survey.hasMany(SurveyDetails, {
  foreignKey: 'survey_id',
  sourceKey: 'id'
});

Survey.belongsTo(Users,{
  foreignKey: 'user_id',
  targetKey: 'id'
});

Users.hasMany(Survey, {
  foreignKey: 'user_id',
  sourceKey: 'id'
});

Survey.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(Survey, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});



module.exports.Survey = sequelize.models.Survey;
