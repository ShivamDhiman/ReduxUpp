const { sequelize } = require('../connections/connection');
const { Schedular } = require('../models/scheduler');
const errorLib = require('../../lib/errorLib');

module.exports.getSchedulers = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Schedular.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getSchedulers', err));
    });
  });
}


module.exports.createBulkScheduler = (payload) =>{
  return new Promise((resolve, reject)=>{
    Schedular.bulkCreate(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createBulkScheduler', err));
    });
  });
}

module.exports.updateScheduler = (searchQuery, updateQuery) =>{
  return new Promise((resolve, reject)=>{
    Schedular.update(updateQuery, searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateScheduler', err));
    });
  });
}
