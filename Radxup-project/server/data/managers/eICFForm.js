const { eICFForms } = require('../models/eICFForms');
const { FormEmailMapping } = require('../models/formEmailMapping');
const { eICFFormsDependency } = require('../models/eICFFormsDependency');
const { eICFFQuestions } = require('../models/eICFFQuestions');
const { eICFFQAttributes } = require('../models/eICFFQAttributes');
const { Images } = require('../models/images');
const errorLib = require('../../lib/errorLib');



/**
* Get eICF Form List
**/
module.exports.getEICFForm = (searchQuery) => {
  return new Promise((resolve, reject) => {
      eICFForms.findOne(searchQuery)
      .then(result => {
          result = JSON.stringify(result);
          resolve(JSON.parse(result));
      })
      .catch(err => {
          console.log(err);
          reject(errorLib.generateErrorMsg('getEICFForm', err));
      });
  });
}


/**
* Get eICF Form List
**/
module.exports.getEICFFormsList = (searchQuery) => {
    return new Promise((resolve, reject) => {
        eICFForms.findAll(searchQuery)
        .then(result => {
            result = JSON.stringify(result);
            resolve(JSON.parse(result));
        })
        .catch(err => {
            console.log(err);
            reject(errorLib.generateErrorMsg('getEICFFormsList', err));
        });
    });
}


/**
* Get eICF Form List
**/
module.exports.getEICFDependencys = (searchQuery) => {
  return new Promise((resolve, reject) => {
    eICFFormsDependency.findAll(searchQuery)
      .then(result => {
          result = JSON.stringify(result);
          resolve(JSON.parse(result));
      })
      .catch(err => {
          console.log(err);
          reject(errorLib.generateErrorMsg('getEICFFormsList', err));
      });
  });
}


/**
* Get eICF Form List
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
          reject(errorLib.generateErrorMsg('geteICFFormsList', err));
      });
  });
}

/**
* Get eICF Form List
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
            reject(errorLib.generateErrorMsg('geteICFFormsList', err));
        });
    });
}

/** Adding bulk eICF form in database */
module.exports.createBulkEICFForm =(formObj) =>{
    return new Promise(async(resolve, reject)=>{
        eICFForms.bulkCreate(formObj)
      .then(result =>{
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('createBulkEICFForm', err));
      });
    });
}

/** Adding bulk form dependency mapping in database */
module.exports.createBulkEICFFormDependencyMapping=(FDependencyList)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFormsDependency.bulkCreate(FDependencyList)
        .then(result =>{
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
        })
        .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('createBulkEICFFormDependencyMapping', err));
        });
    });
}

/** Adding bulk form email mapping in database */
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

/** Adding bulk eICF form question in database */
module.exports.createBulkEICFFQuestions=(questionList)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFQuestions.bulkCreate(questionList)
      .then(result =>{
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('createBulkEICFFQuestions', err));
      });
    });
  }

/** Adding bulk eICF form question attribute in database */
module.exports.createBulkEICFFQAttributes=(attributeList)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFQAttributes.bulkCreate(attributeList)
        .then(result =>{
        result = JSON.stringify(result);
        resolve(JSON.parse(result));
        })
        .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('createBulkEICFFQAttributes', err));
        });
    });
}

/**
 * Update form Form
 **/
module.exports.updateEICFForms = (updateQuery, searchQuery) =>{
    return new Promise((resolve, reject)=>{
        eICFForms.update(updateQuery, searchQuery)
        .then((result) => {
            resolve(result);
        })
        .catch((err) => {
            reject(errorLib.generateErrorMsg('updateEICFForms', err));
        });
    });
}

/**
 * Update form dependency
 **/
 module.exports.updateEICFDependency = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    eICFFormsDependency.update(updateQuery, searchQuery)
      .then((result) => {
          resolve(result);
      })
      .catch((err) => {
          reject(errorLib.generateErrorMsg('updateEICFDependency', err));
      });
  });
}

/**
 * Update form Form
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

/** Delete form in database */
module.exports.deleteEICFForm =(searchQuery) =>{
    return new Promise(async(resolve, reject)=>{
        eICFForms.destroy(searchQuery)
        .then(result =>{
            resolve(result);
        })
        .catch(err =>{
            console.log(err);
            reject(errorLib.generateErrorMsg('deleteEICFForm', err));
        });
    });
}

  /** Delete form dependency in database */
  module.exports.deleteEICFFormsDependency=(searchQuery)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFormsDependency.destroy(searchQuery)
      .then(result =>{
        resolve(result);
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('deleteEICFFormsDependency', err));
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

  /** Delete form section question in database */
  module.exports.deleteEICFFQuestions=(searchQuery)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFQuestions.destroy(searchQuery)
      .then(result =>{
        resolve(result);
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('deleteEICFFQuestions', err));
      });
    });
  }

  /** Delete form section question attribute in database */
  module.exports.deleteEICFFQAttributes=(searchQuery)=>{
    return new Promise(async(resolve, reject)=>{
        eICFFQAttributes.destroy(searchQuery)
      .then(result =>{
        resolve(result);
      })
      .catch(err =>{
        console.log(err);
        reject(errorLib.generateErrorMsg('deleteEICFFQAttributes', err));
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
