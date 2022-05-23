const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const _ = require('underscore');
const asyncLoop = require('node-async-loop');
const validator = require('../lib/validator');
const enums = require('../lib/enums');
const authService = require('../services/authService');
const appService = require('../services/appService');
const moment = require('moment');
const ROLES = enums.ROLES;
const uuid = require('uuid');

const { Users } = require('../data/models/users');
const { FormsSections } = require('../data/models/formsSections');
const { FormDependencyMapping } = require('../data/models/formDependencyMapping');
const { FSQuestions } = require('../data/models/formsSectionsQuestions');
const { FSQAttributes } = require('../data/models/formsSectionsQuestionsAttributes');
const { eICFFormsDependency } = require('../data/models/eICFFormsDependency');
const { eICFFQuestions } = require('../data/models/eICFFQuestions');
const { eICFFQAttributes } = require('../data/models/eICFFQAttributes');

const userManager = require('../data/managers/users');

const eICFFormManager = require('../data/managers/eICFForm');
const FormManager = require('../data/managers/forms');


function geteICFList(searchPayload){
    return new Promise(async (resolve, reject)=>{
        try{
            resolve(await eICFFormManager.getEICFFormsList({
                where: searchPayload,
                attributes:['id', 'study_id', 'form_group', 'form_code', 'category', 'name', 'language', 'version', 'status','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing'],
                order: [
                    [ 'name', 'ASC'],
                ],
                required: true
            }));

        } catch(err){
            reject(err);
        }
    });
}

function getMappedEmailList(formId){
    return new Promise(async (resolve, reject)=>{
        try{
            resolve(await eICFFormManager.getFormEmail({
                where: {form_id: formId},
                attributes:['id','study_id', 'form_group', 'form_id','form_code', 'version', 'email_code', 'email_version','email_reminder_code', 'email_reminder_version' ]
            }));

        } catch(err){
            reject(err);
        }
    });
}

function getFormList (searchPayload){
    return new Promise(async(resolve, reject)=>{
        try {
             //Creating search query
            let searchQuery = {
                where: searchPayload,
                attributes: ['id', 'study_id', 'form_group', 'form_code', 'category', 'name', 'language', 'version', 'status','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing'],
                order: [
                    [ 'name', 'ASC'],
                ],
                required: true
            }
            //Fetching data
            resolve( await FormManager.getFormsList(searchQuery));
        } catch (err){
            reject(err);
        }
    });
}


/**
* Get eICF get information by name and version.
* This will include all language of same name and version
*/
module.exports.getParicipantForms = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDY_COORDINATOR])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    try {
        //Getting query input from request
        let params = {};

        if(req.query.query){
            params = await authService.decryptPayload(req.query.query);
        }

        let data = [];

        let searchPayload = {
            'study_id': req.user.study_id || 1,
            'language': 'English',
            'status': 'Published',
            "has_dependency": false
        }

        let eICFList = await geteICFList(searchPayload);
        if(eICFList && eICFList.length > 0 ){
            data =  data.concat(eICFList);
        }

        let formList = await getFormList (searchPayload);
        if(formList && formList.length > 0 ){
            data =  data.concat(formList);
        }
        if(data && data.length >0 ){
            let finalList = _.sortBy(data,'name' );
            return res.status(200).json({success : true, message: 'Data found', data: finalList});
        } else {
            return res.status(200).json({success : true, message: 'Data found', data: []});
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}
