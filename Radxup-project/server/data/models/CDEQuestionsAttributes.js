const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { CDESections } = require('./CDESections');
const { CDEQuestions } = require('./CDEQuestions');
const { Users } = require('./users');

class CDEQuestionsAttributes extends Model {};

CDEQuestionsAttributes.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
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
      name: "CDEQuestionsAttributes_order",
      fields:['order']
    },
    {
      unique: false,
      name: "CDEQuestionsAttributes_SQ",
      fields:['sections_id','questions_id']
    }
   ],
    timestamps: true,    
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'CDEQuestionsAttributes'
});

CDEQuestionsAttributes.belongsTo(CDESections,{
  foreignKey: 'sections_id',
  targetKey: 'id'
});

CDESections.hasMany(CDEQuestionsAttributes,{
  foreignKey: 'sections_id',
  sourceKey: 'id'
});

CDEQuestionsAttributes.belongsTo(CDEQuestions,{
  foreignKey: 'questions_id',
  targetKey: 'id'
});

CDEQuestions.hasMany(CDEQuestionsAttributes,{
  foreignKey: 'questions_id',
  sourceKey: 'id'
});

CDEQuestionsAttributes.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});
  
Users.hasMany(CDEQuestionsAttributes,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

CDEQuestionsAttributes.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});
  
Users.hasMany(CDEQuestionsAttributes,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});
  
module.exports.CDEQuestionsAttributes = sequelize.models.CDEQuestionsAttributes;