const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Forms } = require('./forms');
const { Users } = require('./users');

class FormsSections extends Model {};
 FormsSections.init({
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
  category: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  linked_variable_name: {
    type: DataTypes.ARRAY(DataTypes.STRING(500))
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
      name: "order",
      fields:['order']
    }
  ],
    timestamps: true,    
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName:  'FormsSections'
});
 FormsSections.belongsTo(Forms,{
  foreignKey: 'form_id',
  targetKey: 'id'
});

Forms.hasMany (FormsSections,{
  foreignKey: 'form_id',
  sourceKey: 'id'
});


FormsSections.belongsTo(Users,{
  foreignKey: 'created_by',
  targetKey: 'id'
});
  
Users.hasMany (FormsSections,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

 FormsSections.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});
  
Users.hasMany (FormsSections,{
    foreignKey: 'updated_by',
    sourceKeys: 'id'
});
  
module.exports.FormsSections = sequelize.models.FormsSections;