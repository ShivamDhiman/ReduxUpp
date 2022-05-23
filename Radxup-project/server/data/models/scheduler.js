const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');

class Schedular extends Model {};

Schedular.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  form_send_date: {
    type: DataTypes.DATE
  },
  form_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_code: {
    type: DataTypes.STRING,
  },
  survey_link: {
    type: DataTypes.STRING(500)
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  email: {
    type: DataTypes.STRING(60),
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  reminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_expire: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  form_expire_time: {
    type: DataTypes.STRING(10),
  },
  scheduled_at: {
    type: DataTypes.DATE,
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
  modelName: 'Schedular'
});

Schedular.belongsTo(Users,{
    foreignKey: 'user_id',
    targetKey: 'id'
});

Users.hasMany(Schedular, {
    foreignKey: 'user_id',
    sourceKey: 'id'
});

module.exports.Schedular = sequelize.models.Schedular;
