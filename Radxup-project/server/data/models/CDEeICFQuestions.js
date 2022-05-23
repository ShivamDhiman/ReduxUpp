const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');

class CDEeICFQuestions extends Model {};

CDEeICFQuestions.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
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
    type: DataTypes.ARRAY(DataTypes.STRING(500))
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
  cde_version: {
    type: DataTypes.STRING(100),
    defaultValue: '',
    allowNull: false
  },
  cde_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'Active',
    allowNull: false
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
      name: "CDEeICFQuestions_OVCL",
      fields:['order', 'variable_name', 'category', 'language']
    }
   ],
    timestamps: true,    
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'CDEeICFQuestions'
});

CDEeICFQuestions.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});
  
Users.hasMany(CDEeICFQuestions,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

CDEeICFQuestions.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});
  
Users.hasMany(CDEeICFQuestions,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});
  
module.exports.CDEeICFQuestions = sequelize.models.CDEeICFQuestions;