const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
class eICF extends Model {};
const { Study } = require('./study');

eICF.init({
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
    type: DataTypes.STRING(100),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  consent_ident: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consent_ssn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consent_zip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consent_recontact: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  version: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  body: {
      type: DataTypes.TEXT
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
    modelName: 'eICF'
});

eICF.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(eICF,{
  foreignKey: 'study_id',
  sourceKey: 'id'
});

eICF.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});

Users.hasMany(eICF,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

eICF.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});

Users.hasMany(eICF,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});

module.exports.eICF = sequelize.models.eICF;
