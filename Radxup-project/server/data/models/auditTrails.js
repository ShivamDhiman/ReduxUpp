const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');

class AuditTrail extends Model {};

AuditTrail.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  personal_email: {
    type: DataTypes.STRING(200)
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  message: {
    type: DataTypes.STRING(200)
  },
  created_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  },
  updated_at:{
    type: DataTypes.DATE,
    defaultValue: sequelize.now
  }
}, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'AuditTrail'
});

AuditTrail.belongsTo(Study, {
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(AuditTrail, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});

module.exports.AuditTrail = sequelize.models.AuditTrail;
