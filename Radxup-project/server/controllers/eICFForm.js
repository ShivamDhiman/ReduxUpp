const asyncLoop = require('node-async-loop');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const fs = require('fs');
const uuid = require('uuid');
const userCtrl = require('./users');
const appService = require('../services/appService');
const authService = require('../services/authService');
const blobService = require('../services/fileService');
const formsManager = require('../data/managers/forms');
const eICFFormManager = require('../data/managers/eICFForm');

const { eICFForms } = require('../data/models/eICFForms');
const { eICFFormsDependency } = require('../data/models/eICFFormsDependency');
const { eICFFQuestions } = require('../data/models/eICFFQuestions');
const { eICFFQAttributes } = require('../data/models/eICFFQAttributes');

const userManager = require('../data/managers/users');
const { Users } = require('../data/models/users');
const surveyManager = require('../data/managers/survey');
const enums = require('../lib/enums');;
const ROLES = enums.ROLES;
const _ = require('underscore');
const { promisify } = require('util');
const promise = require('redux-promise');


/**
* Create froms
**/
function createForms (data, otherInfo){
    return new Promise(async(resolve, reject)=>{
        try {

            let formList = [];

            data.forEach(formInfo =>{

                formInfo["study_id"] = otherInfo.study_id;
                formInfo["form_code"] = otherInfo.formCode;
                formInfo["status"] = otherInfo.status;
                formList.push({
                    "study_id": otherInfo.study_id,
                    "form_code": otherInfo.formCode,
                    "category": formInfo.category,
                    "name": formInfo.name.trim(),
                    "language": formInfo.language,
                    "version": formInfo.version.trim(),
                    "event_name": (formInfo.event_name? formInfo.event_name: ""),
                    "status": otherInfo.status,
                    "description" : formInfo.description,
                    "has_dependency": formInfo.has_dependency,
                    "days_reminder": (formInfo.days_reminder? formInfo.days_reminder: false),
                    "days":  ((formInfo.days  && formInfo.days != "") ?parseInt(formInfo.days) : 0),
                    "hours_reminder": (formInfo.hours_reminder ?formInfo.hours_reminder : false),
                    "hours": ((formInfo.hours  && formInfo.hours != "") ?parseInt(formInfo.hours) : 0),
                    "form_expire": (formInfo.form_expire? formInfo.form_expire: false),
                    "form_expire_time": ((formInfo.form_expire_time && formInfo.form_expire_time != "") ? formInfo.form_expire_time: 0),
                    "participant_facing": formInfo.participant_facing,
                    "disclaimer": formInfo.disclaimer,
                    "created_by": otherInfo.userId,
                    "updated_by": otherInfo.userId
                });
            });
            let formDependencyList = [];
            if(formList.length > 0){
                formList = await eICFFormManager.createBulkEICFForm(formList);

                //Mapping Id and creating sections and dependency objects
                data.forEach(formInfo =>{
                    let formObj = _.findWhere(formList,{"language": formInfo.language});
                    formInfo["id"] = formObj.id;
                    //Creating form dependency list
                    if(formInfo.FormDependencyMapping && Array.isArray(formInfo.FormDependencyMapping)){
                        formInfo.FormDependencyMapping.forEach(dependencyInfo =>{

                            dependencyInfo["study_id"] = formInfo.study_id;
                            dependencyInfo["form_code"] = formInfo.form_code;

                            formDependencyList.push({
                                "study_id" : formInfo.study_id,
                                "form_id": formInfo.id,
                                "form_code": formInfo.form_code,
                                "name": formInfo.name.trim(),
                                "version": formInfo.version.trim(),
                                "status": formInfo.status,
                                "language": formInfo.language,
                                "order": dependencyInfo.order,
                                "condition": dependencyInfo.condition,
                                "dependent_form_code": dependencyInfo.dependent_form_code,
                                "form_group": dependencyInfo.form_group,
                                "response_type": dependencyInfo.response_type,
                                "variable_name": dependencyInfo.variable_name,
                                "operator": dependencyInfo.operator,
                                "values": dependencyInfo.values,
                                "label": dependencyInfo.label,
                                "created_by": otherInfo.userId,
                                "updated_by": otherInfo.userId
                            });
                        });
                    }
                });


                //Creating form dependency mapping
                if(formDependencyList.length > 0){
                    await eICFFormManager.createBulkEICFFormDependencyMapping(formDependencyList);
                }

                //Creating form Questions and email Temaplates

                asyncLoop(data, async (formInfo, next)=>{
                    await createEmailMapping (formInfo, otherInfo);
                    await createQuestions(formInfo, otherInfo);
                    next();
                },(err, result)=>{
                    if(err){
                        console.log(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            }
        } catch(err){
            console.log(err);
            reject(err);
        }
    })
}

function createEmailMapping(formInfo, otherInfo){
    return new Promise (async(resolve, reject)=>{
        try {
            let emailMapInfo = {
                'study_id': otherInfo.study_id,
                'form_group': 'eICF',
                'form_id': formInfo.id,
                'form_code': formInfo.form_code,
                'version': formInfo.version,
                'status': 'Published',
                'email_code': formInfo.email_code,
                'email_version': formInfo.email_version,
                'email_reminder_code': formInfo.email_reminder_code,
                'email_reminder_version' : formInfo.email_reminder_version,
                "created_by": otherInfo.userId,
                "updated_by": otherInfo.userId
            }

           await eICFFormManager.createEmailFormMapping(emailMapInfo);
           resolve();

        } catch(err){
            reject(err);
        }
    })
}


/**
* Get form questions
**/
function createQuestions (formInfo, otherInfo){
    return new Promise(async(resolve, reject)=>{
        try {

            let formQuestionsList= [];

            formInfo.FSQuestions.forEach(questionObj =>{
                questionObj["study_id"] = otherInfo.study_id;
                questionObj["form_id"] = formInfo.id;
                questionObj["language"] = formInfo.language;
                questionObj["category"] = formInfo.category;

                formQuestionsList.push({
                    "study_id": questionObj.study_id,
                    "form_id": questionObj.form_id,
                    "order": questionObj.order,
                    "category": questionObj.category,
                    "language": questionObj.language,
                    "question_group": (questionObj.question_group? questionObj.question_group:"eICF"),
                    "question_type": questionObj.question_type,
                    "question_edited": (questionObj.question_edited? questionObj.question_edited : false),
                    "cde_variable_name": questionObj.cde_variable_name,
                    "cde_version": questionObj.cde_version,
                    "cde_status": questionObj.cde_status,
                    "shared_question": (questionObj.shared_question? questionObj.shared_question: false),
                    "question": questionObj.question,
                    "hint": questionObj.hint,
                    "variable_name": questionObj.variable_name,
                    "response_type": questionObj.response_type,
                    "descriptive": questionObj.descriptive,
                    "not_to_ans_value": questionObj.not_to_ans_value,
                    "child_node": questionObj.child_node,
                    "linked_variable_name": questionObj.linked_variable_name,
                    "linked_level": questionObj.linked_level,
                    "question_attributes_list": questionObj.question_attributes_list,
                    "question_attributes_label": questionObj.question_attributes_label,
                    "created_by": otherInfo.userId,
                    "updated_by": otherInfo.userId
                });
            });
            if(formQuestionsList.length >0){
                let questionList =  await eICFFormManager.createBulkEICFFQuestions(formQuestionsList);
                await createAttributes(formInfo.FSQuestions, questionList, otherInfo);
            }
            resolve();
        } catch(err){
            console.log(err);
            reject(err);
        }
    })
}

/**
* Get form attributes
**/
function createAttributes (questions, questionList, otherInfo){
    return new Promise(async(resolve, reject)=>{
        try {

            asyncLoop(questions,async(questionInfo, next)=>{
                let questionObj = _.findWhere(questionList, {"order":questionInfo.order, "language":questionInfo.language, "variable_name":questionInfo.variable_name});

                questionInfo["id"] = questionObj.id;
                if(!questionInfo.FSQAttributes || !Array.isArray(questionInfo.FSQAttributes)){
                    return next();
                }

                //Creating attributes list
                let attributeList = [];
                questionInfo.FSQAttributes.forEach(attributeObj =>{
                    attributeList.push({
                        "study_id": questionInfo.study_id,
                        "form_id": questionInfo.form_id,
                        "questions_id": questionInfo.id,
                        "response_type": questionInfo.response_type,
                        "attribute_edited": (attributeObj.attribute_edited? attributeObj.attribute_edited: false),
                        "order": attributeObj.order,
                        "not_to_ans": attributeObj.not_to_ans,
                        "max_current_datetime": attributeObj.max_current_datetime,
                        "choice_key": attributeObj.choice_key,
                        "choice_label": attributeObj.choice_label,
                        "choice_value": attributeObj.choice_value,
                        "text_min_char": attributeObj.text_min_char,
                        "text_max_char": attributeObj.text_max_char,
                        "num_min_value": attributeObj.num_min_value,
                        "num_max_value": attributeObj.num_max_value,
                        "num_flot_max": attributeObj.num_flot_max,
                        "min_datetime": attributeObj.min_datetime,
                        "max_datetime": attributeObj.max_datetime,
                        "min_date": attributeObj.min_date,
                        "max_date": attributeObj.max_date,
                        "min_time": attributeObj.min_time,
                        "max_time": attributeObj.max_time,
                        "created_by": otherInfo.userId,
                        "updated_by": otherInfo.userId
                    });
                });

                if(attributeList.length >0){
                   await eICFFormManager.createBulkEICFFQAttributes(attributeList);
                }

                next();
            },(err, result)=>{
                if(err){
                    console.log(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch(err){
            console.log(err);
            reject(err);
        }
    })
}

function deleteFormsData (formId){
    return new Promise (async(resolve, reject)=>{
        try {
            //Delete question attribute
            await eICFFormManager.deleteEICFFQAttributes({where:{'form_id': formId}});
            //Delete question
            await eICFFormManager.deleteEICFFQuestions({where:{'form_id': formId}});
            //Delete mapped email
            await eICFFormManager.deleteFormEmailMapping({where:{'form_id': formId, 'form_group': 'eICF'}});
            //Delete form dependency mapping
            await eICFFormManager.deleteEICFFormsDependency({where:{'form_id': formId}});
            //Delete form
            await eICFFormManager.deleteEICFForm({where:{'id': formId}});
            resolve('Deleted successfully');
        } catch (err){
            console.log(err);
            reject(errorLib.generateErrorMsg('deleteFormsData', err));
        }
    });
}

function getMappedEmailList(formId){
    return new Promise(async (resolve, reject)=>{
        try{
            resolve(await eICFFormManager.getFormEmail({
                where: {form_id: formId, 'form_group': 'eICF'},
                attributes:['id','study_id', 'form_group', 'form_id','form_code', 'version', 'email_code', 'email_version','email_reminder_code', 'email_reminder_version' ]
            }));

        } catch(err){
            reject(err);
        }
    });
}


function getCurrentFormUsedDependentVariables(form_code){
    return new Promise(async(resolve, reject)=>{
        try {

            let variablesList = [];

            let searchQuery = {
                where:{
                    language: 'English',
                    status: 'Published',
                    dependent_form_code: form_code
                },
                attributes: ['variable_name',[Sequelize.fn('COUNT', Sequelize.col('variable_name')), 'count']],
                group:['variable_name']
            }

            let usedVariablesInEICF = await formsManager.getFormDependencyMappingList(searchQuery);
            if(usedVariablesInEICF && usedVariablesInEICF.length >0){
                variablesList = usedVariablesInEICF;
            }

            let usedVariablesInForm = await eICFFormManager.getEICFDependencys(searchQuery);
            if(usedVariablesInForm && usedVariablesInForm.length >0){
                variablesList = [...variablesList, ...usedVariablesInForm];
            }

            resolve(variablesList);

        } catch(err){
            console.log(err);
            reject(err);
        }
    });
}

function updateUserFormMapping(payload){
    return new Promise(async(resolve, reject)=>{
        try{
            if(!payload){
                resolve();
            }
            let searchQuery ={
                where: {
                    'form_group': payload.form_group,
                    'form_code': payload.form_code,
                    "status": {[Op.notIn]:['Completed', 'Expired']}
                }
            }
    
            let sendReminder = false;
    
            if(payload.days_reminder || payload.hours_reminder){
                sendReminder = true;
            }
    
            let updateQuery = {
                'participant_facing': payload.participant_facing || true,
                'version': payload.version,
                'event_name': payload.event_name,
                'participant_facing': payload.participant_facing || true,
                'has_dependency': payload.has_dependency,
                'eICFName1': (payload.form_group == "Form"? payload.eICFName1: ""),
                'eICFVersion1': (payload.form_group == "Form"? payload.eICFVersion1: ""),
                'eICFCode1': (payload.form_group == "Form"? payload.eICFCode1: ""),
                'eICFName2': (payload.form_group == "Form"? payload.eICFName2: ""),
                'eICFVersion2': (payload.form_group == "Form"? payload.eICFVersion2: ""),
                'eICFCode2': (payload.form_group == "Form"? payload.eICFCode2: ""),
                'eICFName3': (payload.form_group == "Form"? payload.eICFName3: ""),
                'eICFVersion3': (payload.form_group == "Form"? payload.eICFVersion3: ""),
                'eICFCode3': (payload.form_group == "Form"? payload.eICFCode3: ""),
                'reminder': sendReminder,
                'days_reminder': payload.days,
                'hours_reminder': payload.hours,
                'form_expire': payload.form_expire,
                'form_expire_days': payload.form_expire_days,
            }

            await userManager.updateUserFormMapping(searchQuery, updateQuery);
            resolve();

        }catch(err){
            console.log({"updateUserFormMapping_Err": err});
            resolve();
        }
    });
}

/**
* Get eICF get information by name and version.
* This will include all language of same name and version
*/
module.exports.geteICFFList = async (req, res) => {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    try {
        //Getting query input from request
        let params = {};

        if(req.query.query){
            params = await authService.decryptPayload(req.query.query);
        }

        //Creating search query
        let searchQuery = {
            where: {'study_id': req.user.study_id},
            attributes:['id', 'study_id', 'form_code','form_group', 'category', 'name', 'language', 'version', 'event_name', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer', 'created_at', 'updated_at'],
            include:[
                {
                    model: Users,
                    attributes: ['id', 'first_name', 'last_name']
                }]
        }

        if(!appService.isStringEmptyOrSpaces(params.status)){
            searchQuery.where['status'] = params.status;
        }

        if(!appService.isStringEmptyOrSpaces(params.category)){
            searchQuery.where['category'] = params.category;
        }

        //Fetching data
        let eICFForms = await eICFFormManager.getEICFFormsList(searchQuery)

        if(eICFForms && eICFForms.length >0){
            asyncLoop(eICFForms, async(eICFInfo, next)=>{

                let emailInfo = await getMappedEmailList(eICFInfo.id);

                if(emailInfo){
                    eICFInfo['email_code'] = emailInfo.email_code;
                    eICFInfo['email_version'] = emailInfo.email_version;
                    eICFInfo['email_reminder_code'] = emailInfo.email_reminder_code;
                    eICFInfo['email_reminder_version'] = emailInfo.email_reminder_version;
                } else {
                    eICFInfo['email_code'] = null;
                    eICFInfo['email_version'] = null;
                    eICFInfo['email_reminder_code'] = null;
                    eICFInfo['email_reminder_version'] = null;
                }

                next();
            });
        }
        return res.status(200).json({success : true, message: 'Data found', data: eICFForms});

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Get eICF get information by name and version.
* This will include all language of same name and version
*/
module.exports.geteICFFInfo = async (req, res) => {
    if(!req.query.query) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try {
        //Getting query input from request
        let params = await authService.decryptPayload(req.query.query);

        params["dependent"] = (params["dependent"]? params["dependent"]: false);

        if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.version)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        console.log({" params['dependent']":  params["dependent"]})
        //Creating search query
        let searchQuery = {
            where: {
                'study_id': params.study_id,
                'name': params.name.trim(),
                'version': params.version.trim()
            },
            attributes:['id', 'study_id', 'form_code', 'form_group','category', 'name', 'language', 'version', 'event_name', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer', 'created_at', 'updated_at'],
            include:[
                {
                    model: Users,
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: eICFFormsDependency,
                    attributes:['id', 'form_id', 'form_code','language', 'order', 'condition','dependent_form_code', 'form_group', 'response_type', 'variable_name', 'operator', 'values', 'label' ]
                },
                {
                    model: eICFFQuestions,
                    attributes: ['id', 'form_id',  'order', 'category', 'language', 'question_group', 'question_type','question_edited', 'cde_variable_name', 'dependent', 'shared_question', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label'],
                    include:[{
                        model: eICFFQAttributes,
                        attributes: ['id', 'form_id', 'questions_id', 'response_type', 'attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
                    }],
                    required: true
                }
            ],
            order: [
                [{model: eICFFQuestions, as: 'FSQuestions'}, 'order', 'ASC'],
                [{model: eICFFQuestions, as: 'FSQuestions'}, {model: eICFFQAttributes, as: 'FSQAttributes'},'order', 'ASC'],
                [ 'language', 'ASC'],
            ],
            required: true

        }

        //Fetching data
        let eICFForms = await eICFFormManager.getEICFFormsList(searchQuery);
       if(eICFForms && eICFForms.length > 0 ){

            let dependentVariables = [];
            if(params.dependent){
                dependentVariables = await getCurrentFormUsedDependentVariables(eICFForms[0].form_code);
            }

            asyncLoop(eICFForms, async(eICFInfo, next)=>{
                //Updating dependent flag
                if(dependentVariables && dependentVariables.length >0){
                    eICFInfo.eICFFQuestions.forEach(qObj =>{
                        isUsed = _.findWhere(dependentVariables,{'variable_name': qObj.variable_name});
                        if(isUsed && qObj['dependent'] == false){
                            qObj['dependent'] = true;
                        } else {
                            qObj['dependent'] = false;
                        }
                    });
                }

                let emailMapInfo = await getMappedEmailList(eICFInfo.id);
                if(emailMapInfo){
                    eICFInfo['email_code'] = emailMapInfo.email_code;
                    eICFInfo['email_version'] = emailMapInfo.email_version;
                    eICFInfo['email_reminder_code'] = emailMapInfo.email_reminder_code;
                    eICFInfo['email_reminder_version'] = emailMapInfo.email_reminder_version;
                } else {
                    eICFInfo['email_code'] = null;
                    eICFInfo['email_version'] = null;
                    eICFInfo['email_reminder_code'] = null;
                    eICFInfo['email_reminder_version'] = null;
                }
                next();
            },(err, result)=>{
                if(err){
                    console.log(err);
                    return res.status(400).jsons({success: false, message: err.message});
                } else {
                    eICFForms = JSON.stringify(eICFForms);
                    eICFForms =  eICFForms.replace(/\"eICFFQuestions\":/ig, '\"FSQuestions\":').replace(/\"eICFFQAttributes\":/ig, '\"FSQAttributes\":').replace(/\"eICFFormsDependencies\":/ig, '\"FormDependencyMapping\":');
                    eICFForms = JSON.parse(eICFForms);
                    return res.status(200).json({success : true, message: 'Data found', data: eICFForms});
                }
            });
       } else {

        eICFForms = JSON.stringify(eICFForms);
        eICFForms =  eICFForms.replace(/\"eICFFQuestions\":/ig, '\"FSQuestions\":').replace(/\"eICFFQAttributes\":/ig, '\"FSQAttributes\":').replace(/\"eICFFormsDependencies\":/ig, '\"FormDependencyMapping\":');
        eICFForms = JSON.parse(eICFForms);
        return res.status(200).json({success : true, message: 'Data found', data: eICFForms});
       }




    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Add new eICF
*/
module.exports.addNeweICFFInfo = async (req, res) => {

    try {
            if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
                return res.status(403).json({ success: false, message: `You don't have these rights.` });
            }


            //Getting input from request
            let params = req.body.payload;

            if(!Array.isArray(params) || params.length == 0){
                return res.status(406).json({success: false, message: 'Request information is missing'});
            }

            let isFormExists =   await eICFFormManager.getEICFForm({
                where: {
                "study_id": req.user.study_id || 1,
                'name': params[0].name.trim(),
                'version': params[0].version,
                'language': "English"
                },
                attributes: ['id', 'name', 'language', 'version'],
                raw: true
            });

            if(isFormExists){
                return res.status(400).json({success: false, message: "Version already exits, Please change form version"});
            }

            let otherInfo = {
                "userId": req.user.id,
                "formCode": params[0].form_code || uuid.v1({msecs: Date.now()}),
                "status": "Draft",
                "study_id": req.user.study_id
            }

            await createForms (params, otherInfo);

            res.status(200).json({success: true, message: 'Successfully added.'});

    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }

}

/**
* Update form
**/
module.exports.updateForm = async(req, res) => {
    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        //Getting input from request
        let params = req.body.payload;
        if(!Array.isArray(params) || params.length == 0){
            return res.status(406).json({success: false, message: 'Request information is missing'});
        }

        let existsFormList =  await eICFFormManager.getEICFFormsList({
            where: {
            "study_id": req.user.study_id || 1,
            'name': params[0].name.trim(),
            'version': params[0].version
            },
            attributes: ['id', 'name', 'language', 'version','form_code'],
            raw: true
        });


        //Delete exitsting records
        asyncLoop(existsFormList,async(formInfo, next)=> {
            await deleteFormsData(formInfo.id);
            next();
        },(err, result)=>{
            if(err){
                console.log(err);
                res.status(400).json({success: false, message: err.message? err.message: err});
            }
        });

        let otherInfo = {
            "userId": req.user.id,
            "formCode": params[0].form_code,
            "status": "Draft",
            "study_id": req.user.study_id
        }

        await createForms (params, otherInfo);
        res.status(200).json({success: true, message: 'Updated successfully'});
    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }
}

/**
* Update eICF status by name and version.
* This will include all language of same name and version
*/
module.exports.updateeICFFStatus = async (req, res) =>{
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try{

         //Getting query input from request
         let params = await authService.decryptPayload(req.body.payload);

         if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.version) || appService.isStringEmptyOrSpaces(params.status)){
             return res.status(409).json({success: false, message: 'Request information is missing'});
         }

         let searchQuery = {
            where: {
                'study_id': req.user.study_id || 1,
                'name': params.name.trim(),
                'version': params.version.trim()
            },
            attributes:['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'status']
         }

         let eICFInfo = await eICFFormManager.getEICFForm(searchQuery);

         if(eICFInfo){
            params.status = params.status.trim();

            //Checking current and new status correct as per flow or not
            let canUpdate = false;
            if(eICFInfo.status.toLowerCase() == 'draft' && params.status.toLowerCase() == 'published'){
                canUpdate = true;
            }

            if(eICFInfo.status.toLowerCase() == 'published' && params.status.toLowerCase() == 'archive'){
                //Check is current form is mapped with and published form or direct with
                let recCount = 0;
                let data = await formsManager.getFormsList({
                    where:{'study_id': req.user.study_id || 1,'eICFName1': params.name.trim(), status: 'Published'},
                    attributes:['id', 'eICFName1', 'eICFVersion1']
                });
                recCount = data.length || 0;

                data = await formsManager.getFormsList({
                    where:{'study_id': req.user.study_id || 1,'eICFName2': params.name.trim(), status: 'Published'},
                    attributes:['id', 'eICFName2', 'eICFVersion2']
                });
                recCount = recCount + data.length || 0;

                data =  await formsManager.getFormsList({
                    where:{'study_id': req.user.study_id || 1,'eICFName3': params.name.trim(), status: 'Published'},
                    attributes:['id', 'eICFName3', 'eICFVersion3']
                });
                recCount = recCount + data.length || 0;

                //Used in Form Dependency
                data =  await eICFFormManager.getEICFDependencys({
                    where:{'study_id': req.user.study_id || 1,'dependent_form_code': eICFInfo.form_code, status: 'Published' },
                    attributes:['id','study_id', 'dependent_form_code']
                });
                recCount = recCount + data.length || 0;

                //Used in Form Dependency
                data =  await formsManager.getFormDependencyMappingList({
                    where:{'study_id': req.user.study_id || 1,'dependent_form_code': eICFInfo.form_code, status: 'Published' },
                    attributes:['id','study_id', 'dependent_form_code']
                });
                recCount = recCount + data.length || 0;

                if(recCount > 0 ){
                    return res.status(409).json({success: false, message: "eICF already attached with eicf/forms, So we unable to progress your request"});
                } else {
                    canUpdate = true;
                }

            }

            if(!canUpdate){
                return res.status(409).json({success: false, message: "Invalid status"});
            }

            if(params.status.toLowerCase() == 'published'){
                //Fetching other published version
                eICFInfo = await eICFFormManager.getEICFForm({
                    where: {
                    'study_id': req.user.study_id || 1,
                    'name': params.name.trim(),
                    'version': {[Op.ne]: params.version},
                    'status': 'Published'},
                    attributes: ['name', 'form_code', 'language', 'version', 'status'],
                    raw: true
                });
                if(eICFInfo != null && eICFInfo != undefined && Object.keys(eICFInfo).length != 0){
                    await eICFFormManager.updateEICFForms({
                        'status': 'Archive',
                        'updated_by': req.user.id
                    },
                    {
                        where: {'study_id': req.user.study_id || 1,'name': eICFInfo.name.trim(),'status': 'Published', 'version': eICFInfo.version}
                    });

                    await eICFFormManager.updateEICFDependency({
                        'status': 'Archive',
                        'updated_by': req.user.id
                    },
                    {
                        where: {'study_id': req.user.study_id || 1,'name': eICFInfo.name.trim(),'status': 'Published', 'version': eICFInfo.version}
                    });

                    //Update eICF with latest version current version if any form linked with previous publised version
                    //============TBD===================
                    await formsManager.updateForms(
                        {
                            'eICFVersion1': params.version,
                            'updated_by': req.user.id
                        },
                        {
                            where:{
                                'study_id': req.user.study_id || 1,
                                'status': 'Published',
                                'eICFCode1': eICFInfo.form_code, 
                                'eICFName1': params.name
                            }
                        }

                    );

                    await formsManager.updateForms(
                        {
                            'eICFVersion2': params.version,
                            'updated_by': req.user.id
                        },
                        {
                            where:{
                                'study_id': req.user.study_id || 1,
                                'status': 'Published',
                                'eICFCode2': eICFInfo.form_code, 
                                'eICFName2': params.name
                            }
                        }
                    );

                    await formsManager.updateForms(
                        {
                            'eICFVersion3': params.version,
                            'updated_by': req.user.id
                        },
                        {
                            where:{
                                'study_id': req.user.study_id || 1,
                                'status': 'Published',
                                'eICFCode3': eICFInfo.form_code, 
                                'eICFName3': params.name
                            }
                        }
                    );
                }

                await eICFFormManager.updateEICFForms({
                    'status': 'Published',
                    'updated_by': req.user.id
                },
                {
                    where: {'study_id': req.user.study_id || 1,'name': params.name.trim(),'status': 'Draft', 'version': params.version}
                });

                await eICFFormManager.updateEICFDependency({
                    'status': 'Published',
                    'updated_by': req.user.id
                },
                {
                    where: {'study_id': req.user.study_id || 1,'name': params.name.trim(),'status': 'Draft', 'version': params.version}
                });

                eICFInfo = await eICFFormManager.getEICFForm({
                    where: {
                    'study_id': req.user.study_id || 1,
                    'name': params.name.trim(),
                    'version':  params.version,
                    'status': 'Published'
                    }
                });

                await updateUserFormMapping(eICFInfo);
            }

            if(params.status.toLowerCase() == 'archive'){

                await eICFFormManager.updateEICFForms({
                    'status': 'Archive',
                    'updated_by': req.user.id
                },
                {
                    where: {'study_id': req.user.study_id || 1,'name': eICFInfo.name.trim(),'status': 'Published', 'version': eICFInfo.version}
                });

                await eICFFormManager.updateEICFDependency({
                    'status': 'Archive',
                    'updated_by': req.user.id
                },
                {
                    where: {'study_id': req.user.study_id || 1,'name': eICFInfo.name.trim(),'status': 'Published', 'version': eICFInfo.version}
                });
            }

            return res.status(200).json({success: true, message: "Updated successfully"});

         } else {
            return res.status(400).json({success: false, message: "Record not found."});
         }

    }catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Update eICF status by name and version.
* This will include all language of same name and version
*/
module.exports.deleteeICForm = async (req, res) =>{
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try{

        //Getting query input from request
        let params = await authService.decryptPayload(req.body.payload);

        if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.version)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        let searchQuery = {
            where: {
                'study_id': req.user.study_id || 1,
                'name': params.name.trim(),
                'version': params.version.trim()
            },
            attributes:['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'status']
        }

        let eICFList = await eICFFormManager.getEICFFormsList(searchQuery);
        if(eICFList && eICFList.length > 0){
            if(eICFList[0].status.toLowerCase() != 'draft'){
                return res.status(400).json({success: false, message: "You can't delete this record."});
            } else {
                asyncLoop(eICFList, async(eICFInfo, next)=>{
                    await deleteFormsData(eICFInfo.id);
                    next();
                });
                return res.status(200).json({success: true, message: "Record successfully deleted."});
            }
        } else {
            return res.status(400).json({success: false, message: "Record not found."});
        }

    }catch (err) {
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

      let form_group = req.files[0].form_group || req.body.form_group;
      let form_code = req.files[0].form_code || req.body.form_code;
      let user_id = req.files[0].user_id || req.body.user_id;
      let study_id = req.files[0].study_id || req.body.study_id;
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

      let searchQuery = {
        where: {
          user_id: user_id,
          form_code: form_code,
          form_group: form_group
        }
      }

      let userMappedForm = await userManager.getUserFormMapping(searchQuery);
      //If direct mapping not found and form_group is 'Form' then search for eICF1, eICF2 or eICF3
        //To get Survey Id
        if(!userMappedForm){
            //Checking eICF1
            userMappedForm = await userManager.getUserFormMapping ({
                where:{
                    user_id: user_id,
                    eICFCode1: params.form_code
                }
            });
        }
        if(!userMappedForm){
            //Checking eICF2
            userMappedForm =  await userManager.getUserFormMapping ({
                where:{
                    user_id: user_id,
                    eICFCode2: params.form_code
                }
            });
        }

        if(!userMappedForm){
            //Checking eICF3
            userMappedForm =  await userManager.getUserFormMapping ({
                where:{
                    user_id: user_id,
                    eICFCode3: params.form_code
                }
            });
        }

        let userSurveyRecord;
        //Fetching survey information
        if(userMappedForm){
            searchQuery = {
                where: {
                    user_id: user_id,
                    form_code: userMappedForm.form_code,
                    form_group: userMappedForm.form_group,
                    category: userMappedForm.category
                }
            }
            userSurveyRecord =  await surveyManager.getSurveyRecord(searchQuery);
        }

        if(!userSurveyRecord){
            return res.status(403).json({status: false, message: 'User not part of this survey'});
        } else {
            userSurveyRecord = JSON.parse(JSON.stringify(userSurveyRecord));
        }

        let payload = {
          user_id: user_id,
          eICF_code: req.body.eICF_code,
          form_group: form_group,
          form_code: form_code,
          created_by: user_id,
          updated_by: user_id,
          survey_id: userSurveyRecord.id,
          study_id: study_id || 1,
          image_path: `${process.env.BLOB_SERVICE_URL}/${process.env.BLOB_CONTAINER}/${process.env.BLOB_SIGNATURE_DIR}/${fileName}`
        }

        await eICFFormManager.addImage(payload);

        payload = {
            status: 'Consented',
            initiated_at: new Date()
        }
        await surveyManager.updateSurveyRecord({
          where: {
            id: userSurveyRecord.id
          }
        }, payload);

        payload = {
          status: 'CONSENTED',
          consented_at: new Date()
        }
        await userManager.updateUserFormMapping({
            where: {id: userMappedForm.id}
        }, payload);

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

        res.status(200).json({success: true, message: 'E-ICF successfully submitted', image_url: signatureImageUrl, survey_id: userSurveyRecord.id});
    } catch (error) {
      console.log(error);
      return res.status(409).json({success: false, message: error.message});
    }
  }


/**
* This function is use to get ICF dropdown listing
*/
module.exports.getICFListing = async (req, res) => {
    try {
        let params = [];
        if(req.query.query) {
            params = await authService.decryptPayload(req.query.query);
        }
        let searchQuery = {
            where: {form_code: params},
            attributes: ['form_code', 'name'],
            language: 'English'
        }

        let result = await eICFFormManager.getEICFFormsList(searchQuery);
        res.status(200).json({success : true, message: 'Data found', data: result});
    }catch(error){
        console.log(error);
        return res.status(409).json({success: false, message: error.message});
    }
}
