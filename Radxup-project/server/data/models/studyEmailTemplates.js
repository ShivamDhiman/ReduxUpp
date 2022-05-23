const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Study } = require('./study');
const { Users } = require('./users');

class StudyEmailTemplates extends Model {};

StudyEmailTemplates.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  version: {
    type: DataTypes.STRING(30),
    defaultValue: 'Version 1'
  },
  language: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100)
  },
  email_code: {
    type: DataTypes.STRING(100)
  },
  subject: {
    type: DataTypes.STRING(200)
  },
  header: {
    type: DataTypes.STRING(200)
  },
  body_content: {
    type: DataTypes.STRING(2000)
  },
  language: {
    type: DataTypes.STRING(50),
    defaultValue: 'English'
  },
  status: {
    type: DataTypes.STRING(25),
    defaultValue: 'Active'
  },
  created_by: {
    type: DataTypes.INTEGER
  },
  updated_by: {
    type: DataTypes.INTEGER
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
  indexes:[
    {
      unique: false,
      name: "email_code",
      fields:['study_id','email_code']
    }
  ],
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'StudyEmailTemplates'
});

StudyEmailTemplates.belongsTo(Study,{
  foreignKey: 'study_id',
  targetKey: 'id'
});

Study.hasMany(StudyEmailTemplates, {
  foreignKey: 'study_id',
  sourceKey: 'id'
});

StudyEmailTemplates.belongsTo(Users,{
  foreignKey: 'created_by',
  targetKey: 'id'
});

Users.hasMany(StudyEmailTemplates,{
  foreignKey: 'created_by',
  sourceKey: 'id'
});

StudyEmailTemplates.belongsTo(Users,{
  foreignKey: 'updated_by',
  targetKey: 'id'
});

Users.hasMany(StudyEmailTemplates,{
  foreignKey: 'updated_by',
  sourceKey: 'id'
});



module.exports.StudyEmailTemplates = sequelize.models.StudyEmailTemplates;
