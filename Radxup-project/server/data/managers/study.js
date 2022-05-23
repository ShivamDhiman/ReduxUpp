const { Study } = require('../models/study');
const { StudyDocuments } = require('../models/StudyDocuments');
const { StudyEmailTemplates } = require('../models/studyEmailTemplates');
const errorLib = require('../../lib/errorLib');

module.exports.getStudyDetails = (searchQuery) =>{
  return new Promise((resolve, reject)=> {
    Study.findOne(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getStudyDetails', err));
    });
  });
}


module.exports.updateStudy = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Study.update(updateQuery, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateStudy', err));
    });
  });
}


module.exports.createStudyRecord = (payload) =>{
  return new Promise((resolve, reject)=>{
    Study.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createStudyRecord', err));
    });
  });
}

module.exports.getStudyList = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    Study.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getStudyList', err));
    });
  });
}

module.exports.getStudyDocuments = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyDocuments.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getStudyDocuments', err));
    });
  });
}

module.exports.updateStudyDocument = (payload) =>{
  return new Promise((resolve, reject)=>{
    StudyDocuments.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateStudyDocument', err));
    });
  });
}

module.exports.updateStudyDocumentStatus = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyDocuments.update(updateQuery, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateStudyDocumentsStatus', err));
    });
  });
}

module.exports.createStudyEmailTemplate = (payload) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createStudyEmailTemplate', err));
    });
  });
}

module.exports.createBulkEmailTemplate = (payload) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.bulkCreate(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('createBulkEmailTemplate', err));
    });
  });
}


module.exports.updateStudyEmailTemplate = (updateQuery, searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.update(updateQuery, searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('updateStudyEmailTemplate', err));
    });
  });
}

module.exports.getStudyEmailTemplatesList = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getStudyEmailTemplatesList', err));
    });
  });
}

module.exports.getStudyEmailTemplate = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.findOne(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getStudyEmailTemplate', err));
    });
  });
}

module.exports.deleteStudyEmailTemplate = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    StudyEmailTemplates.destroy(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('deleteStudyEmailTemplate', err));
    });
  });
}
