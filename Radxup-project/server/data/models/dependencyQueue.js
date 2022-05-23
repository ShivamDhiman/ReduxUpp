const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../connections/connection');
const { Users } = require('./users');
const { Study } = require('./study');

class dependencyQueue extends Model {};
dependencyQueue.init({
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
    survey_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    form_group: {
        type: DataTypes.STRING(50),
        defaultValue: "Form",
        allowNull: false
    },
    form_code: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    version: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    status:{
        type: DataTypes.STRING(50),
        defaultValue: "Pending",
    },
    retry_counter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sys_remarks:{
        type: DataTypes.STRING(100),
        defaultValue: "",
    },
    error_msg:{
        type: DataTypes.JSON
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
          name: "QueueStatus",
          fields:['status']
        },
       ],
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        sequelize,
        modelName: 'dependencyQueue'
});


dependencyQueue.belongsTo(Users,{
    foreignKey: 'created_by',
    targetKey: 'id'
});

Users.hasMany(dependencyQueue,{
    foreignKey: 'created_by',
    sourceKey: 'id'
});

dependencyQueue.belongsTo(Users,{
    foreignKey: 'updated_by',
    targetKey: 'id'
});

Users.hasMany(dependencyQueue,{
    foreignKey: 'updated_by',
    sourceKey: 'id'
});

module.exports.dependencyQueue = sequelize.models.dependencyQueue;
    