const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');
const { Users } = require('./users');

class StudyCDESections extends Model {};
StudyCDESections.init({
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
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    sequelize,
    modelName:  'StudyCDESections'
});

StudyCDESections.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(StudyCDESections,{
  foreignKey: 'study_id',
  sourceKey: 'id'
});

StudyCDESections.belongsTo(Users,{
  foreignKey: 'created_by',
  targetKey: 'id'
});

Users.hasMany (StudyCDESections,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

StudyCDESections.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});

Users.hasMany (StudyCDESections,{
    foreignKey: 'updated_by',
    sourceKeys: 'id'
});

module.exports.StudyCDESections = sequelize.models.StudyCDESections;
