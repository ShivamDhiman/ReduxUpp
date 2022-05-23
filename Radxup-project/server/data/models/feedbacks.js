const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');

class Feedbacks extends Model {};

Feedbacks.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  survey_id: {
    type: DataTypes.INTEGER
  },
  easy_use: {
    type: DataTypes.INTEGER
  },
  overall_look: {
    type: DataTypes.INTEGER
  },
  overall_experience: {
    type: DataTypes.INTEGER
  },
  average_rating: {
    type: DataTypes.FLOAT
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
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sequelize,
  modelName: 'Feedbacks'
});
module.exports.Feedbacks = sequelize.models.Feedbacks;
