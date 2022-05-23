const asyncLoop = require('node-async-loop');
const { Op } = require("sequelize");
const fs = require('fs');
const userCtrl = require('./users');
const appService = require('../services/appService');
const authService = require('../services/authService');
const blobService = require('../services/fileService');
const formsManager = require('../data/managers/forms');
const eICFManager = require('../data/managers/eICF');
const userManager = require('../data/managers/users');
const { Users } = require('../data/models/users');
const surveyManager = require('../data/managers/survey');
const enums = require('../lib/enums');;
const ROLES = enums.ROLES;
const _ = require('underscore');

/**
* Get eICF get information by name and version.
* This will include all language of same name and version
*/
module.exports.getICF = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if(!req.query.query) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try {
        //Getting query input from request
        let params = await authService.decryptPayload(req.query.query);

        if(appService.isStringEmptyOrSpaces(params.version) || appService.isStringEmptyOrSpaces(params.name)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        //Creating search query
        let searchQuery = {
            where: {'study_id': req.user.study_id, 'version': params.version, 'name': params.name}
        }
        //Fetching data
        eICFManager.getICFList(searchQuery)
        .then( result =>{
            return res.status(200).json({success : true, message: 'Data found', data: result});
        })
        .catch(err =>{
            return res.status(400).json({success : false, message: err.message});
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Get eICF get list
*/
module.exports.getICFList = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    try {

        let params = {};
        if(req.query.query) {
            //Getting query input from request
            params = await authService.decryptPayload(req.query.query);
        }

        //Creating search query
        let searchQuery = {
            where: {'study_id': req.user.study_id},
            include:[
                {
                  model: Users,
                  attributes: ['id', 'first_name', 'last_name']
                }
            ],
            order: [['updated_at', 'DESC'],['name', 'ASC'],['language', 'ASC']],
            required: true
        }
        if(Object.keys(params).length  != 0 && !appService.isStringEmptyOrSpaces(params.status)){
            searchQuery.where['status'] = params.status;
        }
        //Fetching data
        eICFManager.getICFList(searchQuery)
        .then( result =>{
            result = JSON.stringify(result);
            result = result.replace(/\"User\":/ig, '\"updated_by\":');
            result = JSON.parse(result);

            return res.status(200).json({success : true, message: 'Data found', data: result});
        })
        .catch(err =>{
            return res.status(400).json({success : false, message: err.message});
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Get eICF get list
*/
module.exports.getICFPublished = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    try {
        //Creating search query
        let searchQuery = {
            where: {'status': 'Published', 'study_id': req.user.study_id},
            include:[
                {
                  model: Users,
                  attributes: ['id', 'first_name', 'last_name']
                }
            ],
            required: true
        }

        //Fetching data
        eICFManager.getICFList(searchQuery)
        .then( result =>{
            result = JSON.stringify(result);
            result = result.replace(/\"User\":/ig, '\"updated_by\":');
            result = JSON.parse(result);

            return res.status(200).json({success : true, message: 'Data found', data: result});
        })
        .catch(err =>{
            return res.status(400).json({success : false, message: err.message});
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Add eICF
*/
module.exports.addICF = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    try {
        let params = await authService.decryptPayload(req.body.payload);
        let auditPayload = {
            message: `ICF created`,
            personal_email: req.user.personal_email,
            user_id: req.user.id,
            study_id: req.user.study_id
         }
        if(!Array.isArray(params) || params.length == 0){
            throw ('Request information is missing');
        } else {
            //Processing each eICF one by one
            asyncLoop(params,async(eICFObj, next)=> {
                auditPayload.message = `${eICFObj.name} new ICF created`;
                if(appService.isStringEmptyOrSpaces(eICFObj.version) || appService.isStringEmptyOrSpaces(eICFObj.name) || appService.isStringEmptyOrSpaces(eICFObj.language)|| appService.isStringEmptyOrSpaces(eICFObj.body)){
                    return next ('Request information is missing', null);
                }

                //Verify eICF with same name, version and language already exists or not.
                let eICFInfo = await eICFManager.getICF({
                    where: {'name': eICFObj.name,
                    'version': eICFObj.version,
                    'language': eICFObj.language},
                    attributes: ['id', 'name', 'language', 'version'],
                    raw: true
                });

                if(eICFInfo != null && eICFInfo != undefined && Object.keys(eICFInfo).length != 0){
                    return next ('This version already exists', null);
                } else {
                    //Add new version as Draft
                    eICFInfo = {
                        'study_id': req.user.study_id || 1,
                        'name': eICFObj.name.trim(),
                        'language': eICFObj.language.trim(),
                        'version': eICFObj.version,
                        'body': eICFObj.body,
                        'status': 'Draft',
                        'created_by': req.user.id,
                        'updated_by': req.user.id
                    }
                    //Sending reuquest to database
                   await eICFManager.addICF(eICFInfo);
                }

                next();
            },
             async function(err, result){
                 if(err){
                    res.status(400).json({success: false, message: err.message? err.message: err});
                 } else {
                    await appService.addLog(auditPayload);
                    res.status(200).json({success: true, message: 'New ICF successfully created'});
                 }
             }
            );
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }
}

/**
* Update eICF
*/
module.exports.updateICF = async (req, res) => {
    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    try {
        let params = await authService.decryptPayload(req.body.payload);

        if(!Array.isArray(params) || params.length == 0){
            throw Error ('Request information is missing');
        } else {

            //Validating each record must have required information.
            params.forEach((eICFObj)=>{
                if(appService.isStringEmptyOrSpaces(eICFObj.version) || appService.isStringEmptyOrSpaces(eICFObj.name) || appService.isStringEmptyOrSpaces(eICFObj.language)|| appService.isStringEmptyOrSpaces(eICFObj.body)){
                    return res.status(400).json({success: false, message: 'Request information is missing'});
                 }
            });

            //Validate if any form exits with same name and version
            let eICFIDList = _.pluck(params,'id');
            if(eICFIDList.length != 0){
                let searchQuery = {
                    where: {
                        "study_id": req.user.study_id,
                        "id": {
                            [Op.in]:eICFIDList
                        }
                    }
                }
                let eICFList = await eICFManager.getICFList(searchQuery);

                if(!Array.isArray(eICFList) && eICFList.length == 0){
                    return res.status(400).json({success: false, message: "Record not found."});
                }
            }

            //Processing each eICF one by one
            asyncLoop(params,async(eICFObj, next)=> {
                //Verify eICF with same name, version and language already exists or not.
                let eICFInfo = await eICFManager.getICF({
                    where: {'name': eICFObj.name.trim(),
                    'version': eICFObj.version,
                    'language': eICFObj.language.trim()},
                    attributes: ['id', 'name', 'language', 'version'],
                    raw: true
                });

                // if(!eICFInfo && eICFObj.id !=0) {
                //     return res.status(409).json({success: false, message: 'ICF not found'});
                // }

                if(eICFObj.id && eICFObj.id != 0){
                    //Delete existing record.
                    await eICFManager.deleteeICF({
                        where: {'id': eICFObj.id}
                    });
                }

                if(eICFInfo && eICFObj && eICFObj.id != 0 && eICFInfo.id != eICFObj.id && eICFInfo != null && eICFInfo != undefined && Object.keys(eICFInfo).length != 0){
                    return next('This version already exists', null);
                }

                //Updating new version as Draft
                eICFInfo = {
                    'study_id': req.user.study_id || 1,
                    'name': eICFObj.name.trim(),
                    'language': eICFObj.language.trim(),
                    'version': eICFObj.version,
                    'body': eICFObj.body,
                    'status': 'Draft',
                    'created_by': req.user.id,
                    'updated_by': req.user.id
                }
                //Sending reuquest to database
                await eICFManager.addICF(eICFInfo);
                next();
            },
            function(err, result) {
                if(err) {
                    res.status(400).json({success: false, message: err.message? err.message: err});
                } else {
                    res.status(200).json({success: true, message: 'Updated successfully'});
                }
            });
        }
    } catch (err) {
    console.log(err);
    return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Update eICF status
*/
module.exports.updateICFStatus = async (req, res) => {
    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    try {
      //Getting query input from request
      let params = await authService.decryptPayload(req.body.payload);

      if( appService.isStringEmptyOrSpaces(params.version) || appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.status)){
          return res.status(409).json({success: false, message: 'Request information is missing'});
      }

      params.name = params.name.trim();
      params.status = params.status.trim();

      //Creating search query
      let searchQuery = {
          where: {'version': params.version , 'name': params.name},
          attributes: ['name', 'version', 'status'],
          raw: true
      }
      //Fetching data
      let eICFInfo = await eICFManager.getICF(searchQuery);

      if(eICFInfo == null || eICFInfo == undefined || Object.keys(eICFInfo).length === 0 || eICFInfo.name == undefined){
        return res.status(400).json({success: false, message: "Record not found."});
      } else {

        //Checking current and new status correct as per flow or not
        let canUpdate = false;

        if(eICFInfo.status.toLowerCase() == 'draft' && params.status.toLowerCase() == 'published'){
            canUpdate = true;
        }

        if(eICFInfo.status.toLowerCase() == 'published' && params.status.toLowerCase() == 'archive'){
            let recCount = 0;
            let data = await formsManager.getFormsList({
                where:{'eICFName1': params.name, status: 'Published'},
                attributes:['id', 'eICFName1', 'eICFVersion1']
            });
            recCount = data.length || 0;

            data = await formsManager.getFormsList({
                where:{'eICFName2': params.name, status: 'Published'},
                attributes:['id', 'eICFName2', 'eICFVersion2']
            });

            recCount = recCount + data.length || 0;

            data =  await formsManager.getFormsList({
                where:{'eICFName3': params.name, status: 'Published'},
                attributes:['id', 'eICFName3', 'eICFVersion3']
            });
            recCount = recCount + data.length || 0;
            if(recCount > 0 ){
                return res.status(409).json({success: false, message: "e-ICF is in use in other forms, cannot be deleted." || "eICF already attached with forms, So we unable to progress your request"});
            } else {
                canUpdate = true;
            }
            console.log(recCount, canUpdate);
        }

        //If invalid status then send error else update database
        if(!canUpdate){
            return res.status(409).json({success: false, message: "Invalid status"});
        } else {

            //Archive eICF of other version if already Published
            if(params.status.toLowerCase() == 'published'){
                //Fetching other published version
                eICFInfo = await eICFManager.getICF({
                    where: {'name': params.name,
                    'version': {[Op.ne]: params.version},
                    'status': 'Published'},
                    attributes: ['name', 'language', 'version', 'status'],
                    raw: true
                });
                if(eICFInfo != null && eICFInfo != undefined && Object.keys(eICFInfo).length != 0){
                    await eICFManager.updateICF({
                        'status': 'Archive',
                        'updated_by': req.user.id
                    },
                    {
                        where: {'name': eICFInfo.name,'status': 'Published', 'version': eICFInfo.version}
                    });

                    //Update eICF with latest version current version if any form linked with previous publised version
                    //============TBD===================
                    await formsManager.updateForms(
                        {
                            'eICFVersion1': params.version,
                            'updated_by': req.user.id
                        },
                        {where:{'eICFName1': params.name}}

                    );

                    await formsManager.updateForms(
                        {
                            'eICFVersion2': params.version,
                            'updated_by': req.user.id
                        },
                        {where:{'eICFName2': params.name}}
                    );

                    await formsManager.updateForms(
                        {
                            'eICFVersion3': params.version,
                            'updated_by': req.user.id
                        },
                        {where:{'eICFName3': params.name}}
                    );
                }
            }

            searchQuery = {
                where: {'version': params.version, 'name': params.name}
            }

            let updateQuery = {
                'status': params.status,
                'updated_by': req.user.id
            }

            //Updating data
            eICFManager.updateICF(updateQuery, searchQuery)
            .then( result =>{
                return res.status(200).json({success : true, message: 'Updated successfully'});
            })
            .catch(err =>{
                return res.status(400).json({success : false, message: err.message});
            });
        }
      }

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Delete eICF
*/
module.exports.deleteICF = async (req, res) => {
    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    try {
      //Getting query input from request
      let params = await authService.decryptPayload(req.body.payload);

      if(!params.version ||params.version == 0 || appService.isStringEmptyOrSpaces(params.name)){
          return res.status(409).json({success: false, message: 'Request information is missing'});
      }

      params.name = params.name.trim();

      //Creating search query
      let searchQuery = {
          where: {'version': params.version, 'name': params.name},
          attributes: ['name', 'version', 'status']
      }
      //Fetching data
      let eICFFromInfo = await eICFManager.getICF(searchQuery);

      if(eICFFromInfo == null || eICFFromInfo == undefined || Object.keys(eICFFromInfo).length === 0 || eICFFromInfo.name == undefined){
        return res.status(409).json({success: false, message: "Invalid information"});
      } else {

        //If invalid status then send error else update database
        if(eICFFromInfo.status.toLowerCase() != 'draft'){
            return res.status(409).json({success: false, message: "You can't delete this record."});
        } else {

            searchQuery = {
                where: {'version': params.version, 'name': params.name}
            }

            //Deleting data
            eICFManager.deleteeICF(searchQuery)
            .then( result =>{
                return res.status(200).json({success : true, message: 'Deleted successfully'});
            })
            .catch(err =>{
                return res.status(400).json({success : false, message: err.message});
            });
        }
      }

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* This function is use for to upload signature image on blob
*/
module.exports.ICFConsented = async (req, res) => {
  try {
    if(!(req.files && req.files.length > 0)) {
      return res.status(400).json({success: false, message: 'File not attached in request'});
    }
    let form_code = req.body.form_code;
    let user_id = req.body.user_id;
    let filePath = req.files[0].path;
    let fileName = req.files[0].filename;
    let ICFLanguage = req.files[0].language || 'English';

    await blobService.createShareIfNotExists(process.env.BLOB_CONTAINER);
    await blobService.createDirectoryIfNotExists(process.env.BLOB_CONTAINER, process.env.BLOB_SIGNATURE_DIR);
    await blobService.uploadFileOnBlob(process.env.BLOB_CONTAINER, process.env.BLOB_SIGNATURE_DIR, fileName, filePath);
    await blobService.deleteFileFromLocal(filePath);
    let signatureToken = await blobService.generateSignatureToken(process.env.BLOB_CONTAINER, process.env.BLOB_SIGNATURE_DIR, fileName);
    let signatureImageUrl = `${process.env.BLOB_SERVICE_URL}/${process.env.BLOB_CONTAINER}/${process.env.BLOB_SIGNATURE_DIR}/${fileName}?${signatureToken}`;
    //await appService.generateICFPdfTemplate(user_id, form_code, ICFLanguage, signatureImageUrl);

    let payload = {
      form_code: req.body.form_code,
      created_by: user_id,
      updated_by: user_id,
      user_id: user_id,
      eICF_code: req.body.eICF_code,
      study_id: req.body.study_id,
      image_path: `${process.env.BLOB_SERVICE_URL}/${process.env.BLOB_CONTAINER}/${process.env.BLOB_SIGNATURE_DIR}/${fileName}`
    }

    await eICFManager.addImage(payload);
    let searchQuery = {
      where: {
        user_id: user_id,
        form_code: form_code
      }
    }

    payload = {
      status: 'Consented',
      initiated_at: new Date()
    }
    await surveyManager.updateSurveyRecord(searchQuery, payload);

    payload = {
      consented_at: new Date()
    }
    await userManager.updateUserFormMapping(searchQuery, payload);
    let surveyRecord = await surveyManager.getSurveyRecord(searchQuery);

    searchQuery = {
      where: {
        id: user_id
      }
    }

    payload = {
        status: 'Consented',
        updated_at: new Date()
    }
    await userManager.updateUserProfile(payload, searchQuery);
    res.status(200).json({success: true, message: 'E-ICF successfully submitted', image_url: signatureImageUrl, survey_id: surveyRecord.id});
  } catch (error) {
    console.log(error);
    return res.status(409).json({success: false, message: error.message});
  }
}
