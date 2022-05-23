const { sequelize } = require('../connections/connection');
const { AppInfo } = require('../models/appInfo');
const errorLib = require('../../lib/errorLib');


module.exports.getAppInfo = (searchQuery) => {
  return new Promise((resolve, reject) => {
    AppInfo.findOne(searchQuery)
    .then(result => {
      resolve(JSON.parse(JSON.stringify(result)));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getUserFormMapping', err));
    });
  });
}

module.exports.getAppInfoList =(searchQuery) => {
  return new Promise((resolve, reject) => {
    AppInfo.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getAppInfoList', err));
    });
  });
}


module.exports.addAppInfo = (payload) =>{
  return new Promise((resolve, reject)=>{
    AppInfo.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('addAuditTrialLog', err));
    });
  });
}

module.exports.updateAppInfo = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    AppInfo.update(updateQuery, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateAppInfo', err));
    });
  });
}

module.exports.deleteAppInfo = (arms) =>{
  return new Promise((resolve, reject)=>{
    AppInfo.destroy(arms)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('deleteAppInfo', err));
    });
  });
}

