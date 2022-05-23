const { sequelize } = require('../connections/connection');
const { Survey } = require('../models/survey');
const { SurveyDetails } = require('../models/surveyDetails');
const errorLib = require('../../lib/errorLib');
const { FormDependencyMapping } = require('../models/formDependencyMapping');

module.exports.getSurveyRecord = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Survey.findOne(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getSurveyRecord', err));
    });
  });
}


module.exports.createSurveyRecord = (payload) =>{
  return new Promise((resolve, reject)=>{
    Survey.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createSurveyRecord', err));
    });
  });
}

module.exports.updateSurveyRecord = (searchQuery, updateQuery) =>{
  return new Promise((resolve, reject)=>{
    Survey.update(updateQuery, searchQuery)
    .then((result) => {
      return resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateSurveyRecord', err));
    });
  });
}

module.exports.getSurveyList =(searchQuery) => {
  return new Promise((resolve, reject) => {
    Survey.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      return resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getSurveyList', err));
    });
  });
}

module.exports.addSuveyQuestionAnswer = (payload) =>{
  return new Promise((resolve, reject)=>{
    SurveyDetails.bulkCreate(payload, {validate: false})
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('addSuveyQuestionAnswer', err));
    });
  });
}

module.exports.updateSuveyQuestionAnswer = (searchQuery, payload) =>{
  return new Promise((resolve, reject)=>{
    SurveyDetails.update(payload, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateSuveyQuestionAnswer', err));
    });
  });
}

module.exports.getOneSurveyDetailRecord = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    SurveyDetails.findOne(searchQuery)
    .then((result)=> {
      result = JSON.stringify(result)
      resolve(JSON.parse(result));
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getSurveyQuestionAnswer', err));
    });
  });
}

module.exports.getSurveyQuestionAnswer = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    SurveyDetails.findAll(searchQuery)
    .then((result)=> {
      result = JSON.stringify(result)
      resolve(JSON.parse(result));
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getSurveyQuestionAnswer', err));
    });
  });
}


module.exports.deleteSurveyQuestionAnswer = (query) =>{
  return new Promise((resolve, reject)=>{
    SurveyDetails.destroy(query)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('deleteSurveyQuestionAnswer', err));
    });
  });
}

module.exports.getDepenedencyForm = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    FormDependencyMapping.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getDepenedetForm', err));
    });
  });
}
