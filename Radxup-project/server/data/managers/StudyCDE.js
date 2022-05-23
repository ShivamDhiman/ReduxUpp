const {StudyCDESections} = require('../models/StudyCDESections');
const {StudyCDEQuestions} = require('../models/StudyCDEQuestions');
const {StudyCDEQuestionsAttributes} = require('../models/StudyCDEQuestionsAttributes');
const errorLib = require('../../lib/errorLib');


/**
* Get Study CDE Sesstions List
**/
module.exports.getStudyCDESectionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDESections.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getStudyCDESectionsList', err));
    });
  });
}


/**
* Get Study CDE Questions List
**/
module.exports.getStudyCDEQuestionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestions.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getStudyCDEQuestionsList', err));
    });
  });
}


/**
* Get Study CDE Questions Attrubutes List
**/
module.exports.getStudyCDEQuestionsAttributesList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestionsAttributes.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getStudyCDEQuestionsAttributesList', err));
    });
  });
}


/**
* Create Study CDE Sesstions List
**/
module.exports.createStudyCDESections = (attributeObj) => {
  return new Promise((resolve, reject) => {
    StudyCDESections.create(attributeObj)
    .then(result =>{
      resolve(result.id);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createStudyCDESections', err));
    });
  });
}


/**
* Create Study Bulk CDE Sesstions List
**/
module.exports.createBulkStudyCDESections = (attributeObjList) => {
  return new Promise((resolve, reject) => {
    StudyCDESections.bulkCreate(attributeObjList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkStudyCDESections', err));
    });
  });
}


/**
* Create Study CDE Questions List
**/
module.exports.createStudyCDEQuestions = (attributeObj) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestions.create(attributeObj)
    .then(result =>{
      resolve(result.id);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createStudyCDEQuestions', err));
    });
  });
}

/**
* Create Study Bulk CDE Questions List
**/
module.exports.createBulkStudyCDEQuestions = (attributeObjList) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestions.bulkCreate(attributeObjList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkStudyCDEQuestions', err));
    });
  });
}

/**
* Create Study CDE Questions Attrubutes List
**/
module.exports.createStudyCDEQuestionsAttributes = (attributeObj) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestionsAttributes.create(attributeObj)
    .then(result =>{
      resolve(result.id);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createStudyCDEQuestionsAttributes', err));
    });
  });
}

/**
* Create Study Bulk CDE Questions Attrubutes List
**/
module.exports.createBulkStudyCDEQuestionsAttributes = (attributeObjList) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestionsAttributes.bulkCreate(attributeObjList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkStudyCDEQuestionsAttributes', err));
    });
  });
}


/**
* Update Study CDE Sesstions List
**/
module.exports.updateStudyCDESections = (updateQuery, searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDESections.update(updateQuery, searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('updateStudyCDESections', err));
    });
  });
}


/**
* Update Study CDE Questions List
**/
module.exports.updateStudyCDEQuestions = (updateQuery, searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestions.update(updateQuery, searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('updateStudyCDEQuestions', err));
    });
  });
}

/**
* Update Study CDE Questions Attrubutes List
**/
module.exports.updateStudyCDEQuestionsAttributes = (updateQuery, searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestionsAttributes.update(updateQuery, searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('updateStudyCDEQuestionsAttributes', err));
    });
  });
}



/**
* Delete Study CDE Sesstions List
**/
module.exports.deleteStudyCDESections = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDESections.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteStudyCDESections', err));
    });
  });
}


/**
* Delete Study CDE Questions List
**/
module.exports.deleteStudyCDEQuestions = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestions.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteStudyCDEQuestions', err));
    });
  });
}

/**
* Delete Study CDE Questions Attrubutes List
**/
module.exports.deleteStudyCDEQuestionsAttributes = (searchQuery) => {
  return new Promise((resolve, reject) => {
    StudyCDEQuestionsAttributes.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteStudyCDEQuestionsAttributes', err));
    });
  });
}