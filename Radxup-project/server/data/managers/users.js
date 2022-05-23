const { sequelize } = require('../connections/connection');
const { Users } = require('../models/users');
const { UserFormMapping } = require('../models/userFormMapping');
const { UserStudyMapping } = require('../models/userStudyMapping')
const errorLib = require('../../lib/errorLib');


/** Adding user and study mapping in database */
module.exports.createUserStudyMapping = (payload) =>{
  return new Promise((resolve, reject)=>{
    UserStudyMapping.create(payload)
    .then((result)=> {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createUserStudyMapping', err));
    });
  });
}

module.exports.getUserProfile =(searchQuery) => {
  return new Promise((resolve, reject) => {
    Users.findOne(searchQuery)
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getUserProfile', err));
    });
  });
}

module.exports.getUsersList =(searchQuery) => {
  return new Promise((resolve, reject) => {
    Users.findAll(searchQuery)
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getUsersList', err));
    });
  });
}


module.exports.createUserProfile = (payload) =>{
  return new Promise((resolve, reject)=>{
    Users.build(payload).save()
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('createUserProfile', err));
    });
  });
}


module.exports.updateUserProfile = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Users.update(updateQuery, searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateUserProfile', err));
    });
  });
}


module.exports.deleteUserProfile = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Users.destroy(searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('deleteUserProfile', err));
    });
  });
}


module.exports.createBulkUsersProfile = (profiles, options) =>{
  return new Promise((resolve, reject)=>{
    Users.bulkCreate(profiles, options)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('createBulkUsersProfile', err));
    });
  });
}


module.exports.createUserFormMapping = (payload) =>{
  return new Promise(async(resolve, reject)=>{
    UserFormMapping.create(payload)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createUserFormMapping', err));
    });
  });
}


module.exports.updateUserFormMapping = (searchQuery, updateQuery) =>{
  return new Promise((resolve, reject)=>{
    UserFormMapping.update(updateQuery, searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateUserFormMapping', err));
    });
  });
}


module.exports.getUserFormMapping = (searchQuery) => {
  return new Promise((resolve, reject) => {
    UserFormMapping.findOne(searchQuery)
    .then(result => {
      resolve(JSON.parse(JSON.stringify(result)));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getUserFormMapping', err));
    });
  });
}

module.exports.getUserFormMappingList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    UserFormMapping.findAll(searchQuery)
    .then(result => {
      resolve(JSON.parse(JSON.stringify(result)));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getUserFormMappings', err));
    });
  });
}
