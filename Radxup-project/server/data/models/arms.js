const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');

class Arms extends Model {};

Arms.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  name: {
    type: DataTypes.STRING(50)
  },
  description: {
    type: DataTypes.STRING(500)
  },
  status: {
    type: DataTypes.STRING(15)
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_by: {
    type: DataTypes.INTEGER,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
},{
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'Arms'
});

Arms.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(Arms, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});



module.exports.Arms = sequelize.models.Arms;
