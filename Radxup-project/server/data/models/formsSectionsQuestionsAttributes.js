const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Forms } = require('./forms');
const { FormsSections } = require('./formsSections');
const { FSQuestions } = require('./formsSectionsQuestions');
const { Users } = require('./users');

class FSQAttributes extends Model {};

FSQAttributes.init({
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
  form_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sections_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questions_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  response_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  attribute_edited:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  not_to_ans: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  max_current_datetime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  choice_key: {
    type: DataTypes.STRING(100),
  },
  choice_label: {
    type: DataTypes.STRING(200),
  },
  choice_value: {
    type: DataTypes.STRING(25),
  },
  text_min_char: {
    type: DataTypes.INTEGER,
  },
  text_max_char: {
    type: DataTypes.INTEGER,
  },
  num_min_value: {
    type: DataTypes.INTEGER,
  },
  num_max_value: {
    type: DataTypes.INTEGER,
  },
  num_flot_max: {
    type: DataTypes.INTEGER,
  },
  min_datetime: {
    type: DataTypes.DATE
  },
  max_datetime: {
    type: DataTypes.DATE
  },
  min_date: {
    type: DataTypes.DATEONLY
  },
  max_date: {
    type: DataTypes.DATEONLY
  },
  min_time: {
    type: DataTypes.TIME
  },
  max_time: {
    type: DataTypes.TIME
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
      name: "SFSQO",
      fields:['study_id','form_id','sections_id','questions_id','order']
    }
   ],
    timestamps: true,    
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'FSQAttributes'
});

FSQAttributes.belongsTo(Forms,{
  foreignKey: 'form_id',
  targetKey: 'id'
});

Forms.hasMany(FSQAttributes,{
  foreignKey: 'form_id',
  sourceKey: 'id'
});

FSQAttributes.belongsTo(FormsSections,{
  foreignKey: 'sections_id',
  targetKey: 'id'
});

FormsSections.hasMany(FSQAttributes,{
  foreignKey: 'sections_id',
  sourceKey: 'id'
});

FSQAttributes.belongsTo(FSQuestions,{
  foreignKey: 'questions_id',
  targetKey: 'id'
});

FSQuestions.hasMany(FSQAttributes,{
  foreignKey: 'questions_id',
  sourceKey: 'id'
});

FSQAttributes.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});
  
Users.hasMany(FSQAttributes,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

FSQAttributes.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});
  
Users.hasMany(FSQAttributes,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});
  
module.exports.FSQAttributes = sequelize.models.FSQAttributes;