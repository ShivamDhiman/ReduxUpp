const { sequelize } = require('../connections/connection');
const { Arms } = require('../models/arms');
const errorLib = require('../../lib/errorLib');


module.exports.addArms = (payload) =>{
  return new Promise((resolve, reject)=>{
    Arms.bulkCreate(payload, {validate: false})
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('addArms', err));
    });
  });
}

module.exports.updateArms = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Arms.update(updateQuery, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateArms', err));
    });
  });
}

module.exports.deleteArms = (arms) =>{
  return new Promise((resolve, reject)=>{
    Arms.destroy(arms)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('deleteArms', err));
    });
  });
}

module.exports.getArmsList =(searchQuery) => {
  return new Promise((resolve, reject) => {
    Arms.findAll(searchQuery)
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getArmsList', err));
    });
  });
}
