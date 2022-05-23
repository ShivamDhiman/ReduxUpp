const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');

class StudyDocuments extends Model {};

StudyDocuments.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  document_name: {
    type: DataTypes.STRING(200)
  },
  document_type: {
    type: DataTypes.STRING(100)
  },
  url: {
    type: DataTypes.STRING(200)
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING(25),
    defaultValue: 'Pending'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
},{
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'StudyDocuments'
});

StudyDocuments.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(StudyDocuments, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});



module.exports.StudyDocuments = sequelize.models.StudyDocuments;
