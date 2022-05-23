const { Forms } = require('../models/forms');
const { FormsSections } = require('../models/formsSections');
const { FormDependencyMapping } = require('../models/formDependencyMapping');
const { FSQuestions } = require('../models/formsSectionsQuestions');
const { FSQAttributes } = require('../models/formsSectionsQuestionsAttributes');
const errorLib = require('../../lib/errorLib');


/** Verify form name with version already exists or not.
 * If exists then return list form id with status
 */
/** Adding new form in database */
module.exports.formVersionIsExists =(formObj)=>{
  return new Promise((resolve, reject)=>{
      Forms.findAll({
        where: {'name': formObj.name, 'version': formObj.version},
        attributes: ['id', 'name', 'language', 'version' , 'status']
      })
      .then( result =>{
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('formVersionIsExists', err));
      });
  });
}

/**
* Get Form information
**/
module.exports.getForms = (searchQuery) => {
  return new Promise((resolve, reject) => {
      Forms.findOne(searchQuery)
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getForms', err));
    });
  });
}

/**
* Get Form List
**/
module.exports.getFormsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    Forms.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getFormsList', err));
    });
  });
}

/**
* Get Form List
**/
module.exports.getFormsQuestionsList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    FSQuestions.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getFormsQuestionsList', err));
    });
  });
}

module.exports.getFormDependencyMappingList = (searchQuery) => {
  return new Promise((resolve, reject) => {
    FormDependencyMapping.findAll(searchQuery)
    .then(result => {
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err => {
      console.log(err);
      reject(errorLib.generateErrorMsg('getFormDependencyMappingList', err));
    });
  });
}


/** Adding new form in database */
module.exports.createForm =(formObj) =>{
  return new Promise(async(resolve, reject)=>{
    Forms.create(formObj)
    .then(result =>{
      resolve(result.id);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createForm', err));
    });
  });
}

/** Adding new form in database */
module.exports.createBulkForm =(formObj) =>{
  return new Promise(async(resolve, reject)=>{
    Forms.bulkCreate(formObj)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkForm', err));
    });
  });
}

/** Adding new form dependency mapping in database */
module.exports.createBulkFormDependencyMapping=(FDependencyList)=>{
  return new Promise(async(resolve, reject)=>{
    FormDependencyMapping.bulkCreate(FDependencyList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkFormDependencyMapping', err));
    });
  });
}

/** Adding new form section in database */

module.exports.createFormsSection=(sectionList)=>{
  return new Promise(async(resolve, reject)=>{
    FormsSections.create(sectionList)
    .then(result =>{
      resolve(result.id);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createFormsSection', err));
    });
  });
}

module.exports.createBulkFormsSection=(sectionList)=>{
  return new Promise(async(resolve, reject)=>{
    FormsSections.bulkCreate(sectionList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkFormsSection', err));
    });
  });
}

/** Adding new form section question in database */
module.exports.createBulkFSQuestions=(questionList)=>{
  return new Promise(async(resolve, reject)=>{
    FSQuestions.bulkCreate(questionList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkFSQuestions', err));
    });
  });
}

/** Adding new form section question attribute in database */
module.exports.createBulkFSQAttributes=(attributeList)=>{
  return new Promise(async(resolve, reject)=>{
    FSQAttributes.bulkCreate(attributeList)
    .then(result =>{
      result = JSON.stringify(result);
      resolve(JSON.parse(result));
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('createBulkFSQAttributes', err));
    });
  });
}

/**
* Update form Form
**/
module.exports.updateForms = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Forms.update(updateQuery, searchQuery)
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      reject(errorLib.generateErrorMsg('updateForms', err));
    });
  });
}

/**
 * Update form dependency
 **/
 module.exports.updateFormDependency = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    FormDependencyMapping.update(updateQuery, searchQuery)
      .then((result) => {
          resolve(result);
      })
      .catch((err) => {
          reject(errorLib.generateErrorMsg('updateFormDependency', err));
      });
  });
}

/** Delete form in database */
module.exports.deleteForm =(searchQuery) =>{
  return new Promise(async(resolve, reject)=>{
    Forms.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteForm', err));
    });
  });
}

/** Delete form dependency in database */
module.exports.deleteFormDependencyMapping=(searchQuery)=>{
  return new Promise(async(resolve, reject)=>{
    FormDependencyMapping.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteFormDependencyMapping', err));
    });
  });
}


/** Delete form section in database */
module.exports.deleteFormsSection=(searchQuery)=>{
  return new Promise(async(resolve, reject)=>{
    FormsSections.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteFormsSection', err));
    });
  });
}

/** Delete form section question in database */
module.exports.deleteFSQuestions=(searchQuery)=>{
  return new Promise(async(resolve, reject)=>{
    FSQuestions.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteFSQuestions', err));
    });
  });
}

/** Delete form section question attribute in database */
module.exports.deleteFSQAttributes=(searchQuery)=>{
  return new Promise(async(resolve, reject)=>{
    FSQAttributes.destroy(searchQuery)
    .then(result =>{
      resolve(result);
    })
    .catch(err =>{
      console.log(err);
      reject(errorLib.generateErrorMsg('deleteFSQAttributes', err));
    });
  });
}
