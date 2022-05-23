const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Survey } = require('./survey');

class Images extends Model {};

Images.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement :true,
    allowNull: false
  },
  image_path: {
    type: DataTypes.STRING
  },
  form_code: {
    type: DataTypes.STRING
  },
  study_id: {
    type: DataTypes.INTEGER
  },
  survey_id: {
    type: DataTypes.INTEGER
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  eICF_code: {
    type: DataTypes.STRING
  },
  created_by: {
    type: DataTypes.INTEGER
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
  modelName: 'Images'
});

Images.belongsTo(Survey, {
  foreignKey: 'survey_id',
  targetKey: 'id'
});

Survey.hasOne(Images, {
  foreignKey: 'survey_id',
  sourceKey: 'id'
});

module.exports.Images = sequelize.models.Images;
