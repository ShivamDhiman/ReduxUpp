const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
const { Study } = require('./study');
class Forms extends Model {};

Forms.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  form_group: {
    type: DataTypes.STRING(50),
    defaultValue: "Form",
    allowNull: false
  },
  form_code: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(25),
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
  status: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
  },
  has_dependency:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  days_reminder:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  days:{
    type: DataTypes.INTEGER
  },
  hours_reminder:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hours:{
    type: DataTypes.INTEGER
  },
  form_expire:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_expire_time: {
    type: DataTypes.INTEGER
  },
  participant_facing: {
    type: DataTypes.BOOLEAN
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
  indexes:[
    {
      unique: false,
      name: "TNV",
      fields:['category','name','version']
    },
    {
      unique: false,
      name: "has_dependency",
      fields:['has_dependency']
    },
   ],
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'Forms'
});

Forms.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(Forms,{
  foreignKey: 'study_id',
  sourceKey: 'id'
});

Forms.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});

Users.hasMany(Forms,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

Forms.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});

Users.hasMany(Forms,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});

module.exports.Forms = sequelize.models.Forms;
