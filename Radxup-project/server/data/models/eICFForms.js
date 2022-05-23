const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
const { Study } = require('./study');
class eICFForms extends Model {};

eICFForms.init({
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
    defaultValue: "eICF",
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
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  disclaimer: {
    type: DataTypes.TEXT,
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
      name: "eICFForms_CNV",
      fields:['category','name','version']
    },
    {
      unique: false,
      name: "eICFForms_has_dependency",
      fields:['has_dependency']
    }
   ],
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'eICFForms'
});

eICFForms.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(eICFForms,{
  foreignKey: 'study_id',
  sourceKey: 'id'
});

eICFForms.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});

Users.hasMany(eICFForms,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

eICFForms.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});

Users.hasMany(eICFForms,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});

module.exports.eICFForms = sequelize.models.eICFForms;
