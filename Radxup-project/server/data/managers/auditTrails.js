const { AuditTrail } = require('../models/auditTrails');
const errorLib = require('../../lib/errorLib');

module.exports.addLog = (payload) =>{
  return new Promise((resolve, reject)=>{
    AuditTrail.create(payload)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('addAuditTrialLog', err));
    });
  });
}

module.exports.getAuditLogs = (searchQuery) =>{
  return new Promise((resolve, reject)=>{
    AuditTrail.findAll(searchQuery)
    .then((result)=> {
      resolve(result);
    })
    .catch((err)=> {
      reject(errorLib.generateErrorMsg('getAuditLogs', err));
    });
  });
}
