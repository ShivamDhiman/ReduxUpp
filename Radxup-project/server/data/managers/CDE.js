const {CDESections} = require('../models/CDESections');
const {CDEQuestions} = require('../models/CDEQuestions');
const {CDEQuestionsAttributes} = require('../models/CDEQuestionsAttributes');
const {CDEeICFQuestions} = require('../models/CDEeICFQuestions');
const {CDEeICFAttributes} = require('../models/CDEeICFAttributes');
const errorLib = require('../../lib/errorLib');


/**
* Get CDE Sesstions List
**/
module.exports.getCDESectionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    CDESections.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getCDESectionsList', err));
    });
  });
}


/**
* Get CDE Questions List
**/
module.exports.getCDEQuestionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    CDEQuestions.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getCDEQuestionsList', err));
    });
  });
}


/**
* Get CDE Questions Attrubutes List
**/
module.exports.getCDEQuestionsAttributesList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    CDEQuestionsAttributes.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getCDEQuestionsAttributesList', err));
    });
  });
}


/**
 * Get eICF CDE Questions
 */
 module.exports.geteICFCDEQuestionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    CDEeICFQuestions.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('geteICFCDEQuestionsList', err));
    });
  });
}


/**
* Get eICF CDE Questions Attrubutes List
**/
module.exports.geteICFCDEAttributesList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    CDEeICFAttributes.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('geteICFCDEAttributesList', err));
    });
  });
}

