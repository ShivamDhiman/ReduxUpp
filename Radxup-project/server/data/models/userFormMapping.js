const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
const { Forms } = require('./forms');
const { Arms } = require('./arms');

class UserFormMapping extends Model {};

UserFormMapping.init({
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
  arm_id: {
    type: DataTypes.INTEGER
  },
  order:{
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  form_code: {
    type: DataTypes.STRING(100),
    allowNull: false
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
  assignee:{
    type: DataTypes.INTEGER
  },
  has_dependency:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  eICFName1: {
    type: DataTypes.STRING(100),
  },
  eICFVersion1: {
    type: DataTypes.STRING(30)
  },
  eICFCode1: {
    type: DataTypes.STRING(100),
  },
  eICFName2: {
    type: DataTypes.STRING(100),
  },
  eICFVersion2: {
    type: DataTypes.STRING(30)
  },
  eICFCode2: {
    type: DataTypes.STRING(100),
  },
  eICFName3: {
    type: DataTypes.STRING(100),
  },
  eICFCode3: {
    type: DataTypes.STRING(100),
  },
  eICFVersion3: {
    type: DataTypes.STRING(30)
  },
  revisedEICF:{
    type: DataTypes.JSON,
  },
  survey_link: {
    type: DataTypes.STRING(500)
  },
  participant_facing: {
    type: DataTypes.BOOLEAN
  },
  sendEmailNow:{
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  reminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  days_reminder:{
    type: DataTypes.INTEGER
  },
  hours_reminder:{
    type: DataTypes.INTEGER
  },
  reminder_scheduled_at: {
    type: DataTypes.DATE
  },
  form_expire: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_expire_days: {
    type: DataTypes.INTEGER
  },
  form_expire_at: {
    type: DataTypes.DATE
  },
  scheduled_at: {
    type: DataTypes.DATE
  },
  consented_at: {
    type: DataTypes.DATE
  },
  form_send_type:{
    type: DataTypes.STRING(15),
    defaultValue: 'Event Form'
  },
  form_send_date: {
    type: DataTypes.DATE
  },
  form_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_sent_error: {
    type: DataTypes.STRING(200),
    defaultValue: ''
  },
  initiated_at: {
    type: DataTypes.DATE
  },
  completed_at: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING(15)
  },
  form_mapping_status: {
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
  modelName: 'UserFormMapping'
});

UserFormMapping.belongsTo(Users, {
  foreignKey: 'user_id',
  targetKey: 'id'
});

Users.hasMany(UserFormMapping, {
  foreignKey: 'user_id',
  sourceKey: 'id'
});


UserFormMapping.belongsTo(Users, {
  foreignKey: 'assignee',
  as: "assigneeInfo",
  targetKey: 'id'
});

Users.hasMany(UserFormMapping, {
  foreignKey: 'assignee',
  as: "assigneeInfo",
  sourceKey: 'id'
});

UserFormMapping.belongsTo(Arms, {
  foreignKey: 'arm_id',
  targetKey: 'id'
});

Arms.hasMany(UserFormMapping, {
  foreignKey: 'arm_id',
  sourceKey: 'id'
});



module.exports.UserFormMapping = sequelize.models.UserFormMapping;
