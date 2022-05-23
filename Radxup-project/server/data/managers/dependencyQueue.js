const { dependencyQueue } = require('../models/dependencyQueue');
const errorLib = require('../../lib/errorLib');

/**
* Get dependency queue one record
**/
module.exports.getDependencyQueue = (searchQuery) => {
  return new Promise((resolve, reject) => {
    dependencyQueue.findOne(searchQuery)
      .then(result => {
          result = JSON.stringify(result);
          resolve(JSON.parse(result));
      })
      .catch(err => {
          console.log(err);
          reject(errorLib.generateErrorMsg('getDependencyQueue', err));
      });
  });
}


/**
* Get dependency queue List
**/
module.exports.getDependencyQueueList = (searchQuery) => {
    return new Promise((resolve, reject) => {
        dependencyQueue.findAll(searchQuery)
        .then(result => {
            result = JSON.stringify(result);
            resolve(JSON.parse(result));
        })
        .catch(err => {
            console.log(err);
            reject(errorLib.generateErrorMsg('getDependencyQueueList', err));
        });
    });
}


/**
 * Adding new dependency queue
*/
module.exports.createDependencyQueue = (payload) =>{
  return new Promise((resolve, reject)=>{
    dependencyQueue.create(payload)
    .then((result)=> {
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createDependencyQueue', err));
    });
  });
}


/**
 * Update dependency queue
**/
module.exports.updateDependencyQueue = (updateQuery, searchQuery) =>{
    return new Promise((resolve, reject)=>{
        dependencyQueue.update(updateQuery, searchQuery)
        .then((result) => {
            result = JSON.stringify(result);
            resolve(JSON.parse(result));
        })
        .catch((err) => {
            reject(errorLib.generateErrorMsg('updateDependencyQueue', err));
        });
    });
}



/** Delete dependency queue in database */
module.exports.deleteDependencyQueue =(searchQuery) =>{
    return new Promise(async(resolve, reject)=>{
        dependencyQueue.destroy(searchQuery)
        .then(result =>{
            result = JSON.stringify(result);
            resolve(JSON.parse(result));
        })
        .catch(err =>{
            console.log(err);
            reject(errorLib.generateErrorMsg('deleteDependencyQueue', err));
        });
    });
}
