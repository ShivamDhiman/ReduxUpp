const { FormEmailMapping } = require('../models/formEmailMapping');
const errorLib = require('../../lib/errorLib');


/**
* Get form email details
**/
module.exports.getFormEmail = (searchQuery) => {
  return new Promise((resolve, reject) => {
      FormEmailMapping.findOne(searchQuery)
      .then(result => {
          result = JSON.stringify(result);
          resolve(JSON.parse(result));
      })
      .catch(err => {
          console.log(err);
          reject(errorLib.generateErrorMsg('getFormEmail', err));
      });
  });
}


/**
* Get Form Email List
**/
module.exports.getFormEmailList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    FormEmailMapping.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getFormEmailList', err));
    });
  });
}


/**
* create form email mapping
*/
module.exports.createEmailFormMapping = (payload) =>{
  return new Promise((resolve, reject)=>{
    FormEmailMapping.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createEmailFormMapping', err));
    });
  });
}


/**
* Update form email mapping
**/
module.exports.updateFormEmailMapping = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    FormEmailMapping.update(updateQuery, searchQuery)
    .then((result) => {
        resolve(result);
    })
    .catch((err) => {
        reject(errorLib.generateErrorMsg('updateFormEmailMapping', err));
    });
  });
}


/** Delete form section in database */
module.exports.deleteFormEmailMapping=(searchQuery)=>{
  return new Promise(async(resolve, reject)=>{
    FormEmailMapping.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteFormEmailMapping', err));
    });
  });
}
