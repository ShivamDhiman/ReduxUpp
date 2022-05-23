const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { eICFForms } = require('./eICFForms');
const { Users } = require('./users');

class eICFFQuestions extends Model {};

eICFFQuestions.init({
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
    type: DataTypes.INTEGER,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  question_group: {
    type: DataTypes.STRING(50),
    defaultValue: "eICF",
    allowNull: false
  },
  question_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  question_edited:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cde_variable_name: {
    type: DataTypes.STRING(50)
  },
  cde_version: {
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  cde_status: {
    type: DataTypes.STRING(15),
  },
  shared_question: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  question: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  hint: {
    type: DataTypes.STRING(250)
  },
  variable_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  dependent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  response_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  descriptive:{ 
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  not_to_ans_value:{
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  child_node:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  linked_variable_name: {
    type: DataTypes.ARRAY(DataTypes.STRING(200))
  },
  linked_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  question_attributes_list:{
    type: DataTypes.JSON,
  },
  question_attributes_label:{
    type: DataTypes.STRING(1000),
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
    name: "SFOVCL",
    fields:['study_id','form_id','order','variable_name','category','language']
  }
 ],
    timestamps: true,    
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'eICFFQuestions'
});

eICFFQuestions.belongsTo(eICFForms,{
  foreignKey: 'form_id',
  targetKey: 'id'
});

eICFForms.hasMany(eICFFQuestions,{
  foreignKey: 'form_id',
  sourceKey: 'id'
});


eICFFQuestions.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});
  
Users.hasMany(eICFFQuestions,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

eICFFQuestions.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});
  
Users.hasMany(eICFFQuestions,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});
  
module.exports.eICFFQuestions = sequelize.models.eICFFQuestions;