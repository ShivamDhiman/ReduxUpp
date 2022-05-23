const { eICF } = require('../models/eICF');
const { Images } = require('../models/images');
const errorLib = require('../../lib/errorLib');

/**
* Get eICF Form
**/
module.exports.getICF = (searchQuery) => {
  return new Promise((resolve, reject) => {
    eICF.findOne(searchQuery)
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getICF', err));
    });
  });
}

/**
* Get eICF Form List without body
**/
module.exports.getICFList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    eICF.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      return resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getICFList', err));
    });
  });
}

/**
* Add eICF Form
**/
module.exports.addICF = (payload) =>{
  return new Promise((resolve, reject)=>{
    eICF.create(payload)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('addICF', err));
    });
  });
}

/**
* Update eICF Form
**/
module.exports.updateICF = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    eICF.update(updateQuery, searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateICF', err));
    });
  });
}

/**
* Delete eICF Form
**/
module.exports.deleteeICF = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    eICF.destroy(searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('deleteeICF', err));
    });
  });
}

/**
* Add image path
**/
module.exports.addImage = (payload) =>{
  return new Promise((resolve, reject)=>{
    Images.create(payload)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('addImage', err));
    });
  });
}

module.exports.getImage = (payload) =>{
  return new Promise((resolve, reject)=>{
    Images.findOne(payload)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('getImage', err));
    });
  });
}
