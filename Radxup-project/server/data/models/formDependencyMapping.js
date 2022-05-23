const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Forms } = require('./forms');

class FormDependencyMapping extends Model {};

FormDependencyMapping.init({
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
  form_code: {
    type: DataTypes.STRING(100)
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  condition: {
    type: DataTypes.STRING(5)
  },
  dependent_form_code: {
    type: DataTypes.STRING(100)
  },
  form_group: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  response_type: {
    type: DataTypes.STRING(50)
  },
  variable_name: {
    type: DataTypes.STRING(50)
  },
  operator: {
    type: DataTypes.STRING(50)
  },
  values: {
    type: DataTypes.STRING(50)
  },
  label: {
    type: DataTypes.STRING(500)
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
      name: "formId_Code",
      fields:['form_id', 'form_code']
    },
    {
      unique: false,
      name: "dependent_form_code",
      fields:['dependent_form_code']
    }
  ],
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'FormDependencyMapping'
});

FormDependencyMapping.belongsTo(Forms,{
  foreignKey: 'form_id',
  targetKey: 'id'
});

Forms.hasMany (FormDependencyMapping,{
  foreignKey: 'form_id',
  sourceKey: 'id'
});

module.exports.FormDependencyMapping = sequelize.models.FormDependencyMapping;
