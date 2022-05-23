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
const { SurveyDetails } = require("../data/models/surveyDetails");
const { eICFFormsDependency } = require('../data/models/eICFFormsDependency');
const { eICFFQuestions } = require('../data/models/eICFFQuestions');
const { eICFFQAttributes } = require('../data/models/eICFFQAttributes');

const userManager = require('../data/managers/users');

const eICFFormManager = require('../data/managers/eICFForm');
const FormManager = require('../data/managers/forms');
const surveyManager = require('../data/managers/survey');
const promise = require('redux-promise');

/**
* This will return list of eICF which user need to re-signed due to version change
*/
function getRevisedEICF (studyId, userId){
    return new Promise(async(resolve, reject)=>{
        try {
            let revisedEICF = [];
            let searchQuery = {
                where:{
                    study_id: studyId,
                    user_id: userId,
                    form_group: 'eICF'
                },
                attributes:['study_id', 'form_code', 'form_group', 'version'],
                group:['study_id', 'form_code', 'form_group', 'version']
            }
            let userEICFs = await surveyManager.getSurveyQuestionAnswer(searchQuery);

            if(userEICFs && userEICFs.length >0){
                let eICFCodeList = _.unique(_.pluck(userEICFs, 'form_code'));
                searchQuery = {
                    where:{
                        study_id: studyId,
                        form_code: {[Op.in]:eICFCodeList},
                        language: 'English',
                        participant_facing: true,
                        status: 'Published'
                    },
                    attributes:['id', 'study_id', 'form_code', 'name', 'category', 'form_group', 'version','participant_facing', 'status']
                }
                let eICFList = await eICFFormManager.getEICFFormsList(searchQuery);

                //Verifing version 
                userEICFs.forEach(eICFObj=>{
                    eICFData = _.findWhere(eICFList, {'form_code': eICFObj.form_code});
                    if(eICFData && eICFData.version != eICFObj.version){
                        revisedEICF.push(eICFData);
                    }
                });
                resolve(revisedEICF);
            } else {
                resolve(revisedEICF);
            }

        } catch(err){
            console.log({'getRevisedEICF_err':err })
            reject([]);
        }
    });
}

function geteICFFormObjList (eICFSearchList, revisedEICF = false){
    return new Promise(async(resolve, reject)=>{
        try{
            let eICFFoms = [];
            asyncLoop(eICFSearchList, async(searchPayload, next)=>{
                //Creating search query
                let searchQuery = {
                    where: searchPayload,
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
                let eICFInfo = await eICFFormManager.getEICFFormsList(searchQuery);
                if(eICFInfo && eICFInfo.length > 0){
                    eICFInfo.forEach(eICFObj=>{
                        eICFObj["revisedEICF"] = revisedEICF;
                    })
                    eICFFoms.push(eICFInfo);
                }
                 next();

            },(err, result)=>{
                if(err){
                    console.log(err);
                    reject(errorLib.generateErrorMsg('geteICFFormObjList', err));
                    resolve([]);
                } else {
                    resolve(eICFFoms);
                }
            });

        } catch(err){
            console.log(err);
            reject(errorLib.generateErrorMsg('geteICFFormObjList', err));
        }
    })
}

function getFormeICF(data){
    return new Promise((resolve, reject)=>{
        try{
            asyncLoop(data,async(formInfo, next)=> {
                let eICFList = [];
                //First eICF Form
                if(!appService.isStringEmptyOrSpaces(formInfo.eICFName1) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion1)){
                    eICFList.push({
                        'name': formInfo.eICFName1,
                        'language': formInfo.language,
                        'version': formInfo.eICFVersion1
                    });
                }

                //Second eICF Form
                if(!appService.isStringEmptyOrSpaces(formInfo.eICFName2) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion2)){
                    eICFList.push({
                        'name': formInfo.eICFName2,
                        'language': formInfo.language,
                        'version': formInfo.eICFVersion2
                    });
                }

                //Thrid eICF Form
                if(!appService.isStringEmptyOrSpaces(formInfo.eICFName3) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion3)){
                    eICFList.push({
                        'name': formInfo.eICFName3,
                        'language': formInfo.language,
                        'version': formInfo.eICFVersion3
                    });
                }
                if(eICFList.length > 0) {
                    formInfo['eICFList'] = await getICFData(eICFList);
                } else {
                    formInfo['eICFList'] = [];
                }
                next();
            },
            function(err, output){
                if(err){
                    console.log(err);
                    reject(errorLib.generateErrorMsg('getFormeICF', err));
                } else {
                    resolve(data)
                }
            });

        } catch(err){
            console.log(err);
            reject(errorLib.generateErrorMsg('getFormeICF', err));
        }

    });
}

function getICFData (eICFList){
    return new Promise((resolve, reject)=>{
        let eICFData = [];
        //Processing each eICF one by one
        asyncLoop(eICFList,async(eICFObj, next)=> {
            let eICFInfo = await eICFFormManager.getEICFForm({
                where: {'name': eICFObj.name, 'language': eICFObj.language,'version': eICFObj.version},
                attributes:['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'event_name', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer', 'created_at', 'updated_at'],
            });
            if(eICFInfo != null && eICFInfo != undefined && Object.keys(eICFInfo).length != 0){
                eICFData.push(eICFInfo);
            } else {
                eICFData.push({})
            }
            next();
        },
        function(err, result){
            if(err){
                reject(err);
            } else {
                resolve(eICFData);
            }
        });
    });
}

function deleteFormsData (formId){
    return new Promise (async(resolve, reject)=>{
        try {
            //Delete question attribute
            await FormManager.deleteFSQAttributes({where:{'form_id': formId}});
            //Delete question
            await FormManager.deleteFSQuestions({where:{'form_id': formId}});
            //Delete section
            await FormManager.deleteFormsSection({where:{'form_id': formId}});
            //Delete form dependency mapping
            await FormManager.deleteFormDependencyMapping({where:{'form_id': formId}});
            //Delete form
            await FormManager.deleteForm({where:{'id': formId}});
            resolve('Deleted successfully');
        } catch (err){
            console.log(err);
            reject(errorLib.generateErrorMsg('deleteFormsData', err));
        }
    });
}


function getFormData (searchPayload){
    return new Promise(async(resolve, reject)=>{
        try {

            let data = {
                'eICFs': [],
                'forms': []
            };

            if(searchPayload.form_group == 'eICF'){
                //Creating search query
                let searchQuery = {
                    where: searchPayload,
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
                    data.eICFs.push(eICFForms);
                }
            } else {
                //Creating search query
                let searchQuery = {
                    where: searchPayload,
                    attributes: ['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'status', 'description', 'has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time','eICFName1','eICFVersion1', 'eICFCode1' ,'eICFName2', 'eICFCode2' ,'eICFVersion2','eICFName3', 'eICFCode3' ,'eICFVersion3', 'created_at', 'updated_at'],
                    include:[
                        {
                            model: Users,
                            attributes: ['id', 'first_name', 'last_name']
                        },
                        {
                            model: FormsSections,
                            attributes: ['id', 'study_id', 'form_id', 'category', 'order', 'name', 'linked_variable_name', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                            include:[{
                                model: FSQuestions,
                                attributes: ['id', 'study_id', 'form_id', 'sections_id', 'order', 'category', 'language', 'question_group', 'question_type', 'question_edited', 'cde_variable_name', 'cde_version', 'cde_status', 'shared_question', 'question', 'hint', 'variable_name', 'dependent', 'response_type','descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label'],
                                include:[{
                                    model: FSQAttributes,
                                    attributes: ['id', 'study_id', 'form_id', 'sections_id', 'questions_id', 'response_type', 'attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
                                }]
                            }]
                        },
                        {
                            model: FormDependencyMapping,
                            attributes:['id', 'study_id', 'form_id', 'form_code','language', 'order', 'condition','dependent_form_code','response_type', 'variable_name', 'operator', 'values', 'label' ]
                        }
                    ],
                    order: [
                        [{model: FormsSections, as :'FormsSections'}, 'order', 'ASC'],
                        [ {model:FormsSections, as : 'FormsSections'}, {model: FSQuestions, as: 'FSQuestions'}, 'order', 'ASC'],
                        [ {model:FormsSections, as : 'FormsSections'}, {model: FSQuestions, as: 'FSQuestions'}, {model: FSQAttributes, as: 'FSQAttributes'},'order', 'ASC'],
                        [ 'language', 'ASC'],
                    ],
                    required: true
                }


                //Fetching data
                formList = await FormManager.getFormsList(searchQuery);
                if(formList && formList.length > 0 ){
                    data.forms = formList;
                }
            }

            if(!Array.isArray(data.forms) || data.forms.length == 0 ){
                return resolve(data);
            }

            let eICFList = [];
            data.forms.forEach(formInfo =>{
                //Fetching eICF form data if current form is surve form
                if(searchPayload.form_group == 'Form'){
                    //First eICF Form
                    if(!appService.isStringEmptyOrSpaces(formInfo.eICFName1) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion1) && !appService.isStringEmptyOrSpaces(formInfo.eICFCode1)){
                        let eICFExists =  _.findWhere(eICFList,{'name': formInfo.eICFName1,'version': formInfo.eICFVersion1,'form_code': formInfo.eICFCode1})
                        if(!eICFExists){
                            eICFList.push({
                                'name': formInfo.eICFName1,
                                'version': formInfo.eICFVersion1,
                                'form_code': formInfo.eICFCode1
                            });
                        }
                    }

                    //Second eICF Form
                    if(!appService.isStringEmptyOrSpaces(formInfo.eICFName2) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion2) && !appService.isStringEmptyOrSpaces(formInfo.eICFCode2)){
                        let eICFExists =  _.findWhere(eICFList,{'name': formInfo.eICFName2,'version': formInfo.eICFVersion2,'form_code': formInfo.eICFCode2})
                        if(!eICFExists){
                            eICFList.push({
                                'name': formInfo.eICFName2,
                                'version': formInfo.eICFVersion2,
                                'form_code': formInfo.eICFCode2
                            });
                        }
                    }

                    //Thrid eICF Form
                    if(!appService.isStringEmptyOrSpaces(formInfo.eICFName3) && !appService.isStringEmptyOrSpaces(formInfo.eICFVersion3) && !appService.isStringEmptyOrSpaces(formInfo.eICFCode3)){
                        let eICFExists =  _.findWhere(eICFList,{'name': formInfo.eICFName3,'version': formInfo.eICFVersion3,'form_code': formInfo.eICFCode3})
                        if(!eICFExists){
                            eICFList.push({
                                'name': formInfo.eICFName3,
                                'version': formInfo.eICFVersion3,
                                'form_code': formInfo.eICFCode3
                            });
                        }
                    }
                }
            });
            if(eICFList.length > 0) {
                let eICFsData = await geteICFFormObjList(eICFList, false);
                data.eICFs = [...data.eICFs, ...eICFsData];
            }
            resolve(data);

        } catch (err){
            reject(err);
        }
    });
}

function getMappedEmailList(formId){
    return new Promise(async (resolve, reject)=>{
        try{
            resolve(await eICFFormManager.getFormEmail({
                where: {form_id: formId, 'form_group': 'Form'},
                attributes:['id','study_id', 'form_group', 'form_id','form_code', 'version', 'email_code', 'email_version','email_reminder_code', 'email_reminder_version' ]
            }));

        } catch(err){
            reject(err);
        }
    });
}

function formatDependencyInputs(eICFForms, data){
    return new Promise((resolve, reject)=>{
        try{

            let finalData = [];

            let dataTimeObj = {
                    "question_group": "eICF",
                    "question": "",
                    "variable_name": "",
                    "response_type": "DateTime",
                    "question_edited": false,
                    'cde_version': "",
                    'cde_status': "Active",
                    'dependent': false,
                    "FSQAttributes": [{
                        "response_type": "DateTime",
                        "attribute_edited": false,
                        "order": 1,
                        "not_to_ans": false,
                        "max_current_datetime": true,
                        "choice_key": null,
                        "choice_label": null,
                        "choice_value": null,
                        "text_min_char": null,
                        "text_max_char": null,
                        "num_min_value": null,
                        "num_max_value": null,
                        "num_flot_max": null,
                        "min_datetime": "1900-01-01T00:00:00.000Z",
                        "max_datetime": null,
                        "min_date": null,
                        "max_date": null,
                        "min_time": null,
                        "max_time": null
                    }]
                }

            //eICF form level information
            eICFForms.forEach(formInfo =>{
                let formObj= {
                    "form_group":'eICF',
                    "form_code": formInfo.form_code,
                    "name":formInfo.name,
                    "version": formInfo.version,
                    "eICF_form": true,
                    "has_dependency": formInfo.has_dependency,
                    "eICFName1": null,
                    "eICFCode1": null,
                    "eICFVersion1": null,
                    "eICFName2": null,
                    "eICFCode2": null ,
                    "eICFVersion2": null,
                    "eICFName3": null,
                    "eICFCode3": null ,
                    "eICFVersion3": null,
                    "FSQuestions":[]
                }


                //Adding consent date variable
                dataTimeObj.question = "Consent Date";
                dataTimeObj.variable_name = "consent_date";
                formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));


                //Adding enrollment date variable
                if(formInfo.has_dependency == false){
                    dataTimeObj.question = "Enrollment Date";
                    dataTimeObj.variable_name = "enrollment_date";
                    formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));
                }

                //Adding enrollment date variable
                dataTimeObj.question = "Form Sent Date";
                dataTimeObj.variable_name = "form_sent_date";
                formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));

                //Adding enrollment date variable
                dataTimeObj.question = "Form Receive Date";
                dataTimeObj.variable_name = "form_receive_date";
                formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));

                //Question level information
                formInfo.FSQuestions.forEach( questionInfo =>{
                    formObj.FSQuestions.push(questionInfo);
                });

                //Adding final object
                finalData.push(formObj);
            });

            //Form level information
            data.forEach(formInfo =>{

                let eICFForm = false;
                if(!appService.isStringEmptyOrSpaces(formInfo.eICFName1) && !appService.isStringEmptyOrSpaces(formInfo.eICFName2) && !appService.isStringEmptyOrSpaces(formInfo.eICFName3) ){
                    eICFForm = true;
                }

                let formObj= {
                    "form_group":'Form',
                    "form_code": formInfo.form_code,
                    "name":formInfo.name,
                    "version": formInfo.version,
                    "eICF_form": eICFForm,
                    "has_dependency": formInfo.has_dependency,
                    "eICFName1": (formInfo.eICFName1? formInfo.eICFName1:null),
                    "eICFCode1": (formInfo.eICFCode1? formInfo.eICFCode1:null),
                    "eICFVersion1": (formInfo.eICFVersion1? formInfo.eICFVersion1:null),
                    "eICFName2": (formInfo.eICFName2? formInfo.eICFName2:null),
                    "eICFCode2": (formInfo.eICFCode2? formInfo.eICFCode2:null) ,
                    "eICFVersion2": (formInfo.eICFVersion2? formInfo.eICFVersion2:null),
                    "eICFName3": (formInfo.eICFName3? formInfo.eICFName3:null),
                    "eICFCode3": (formInfo.eICFCode3? formInfo.eICFCode3:null) ,
                    "eICFVersion3": (formInfo.eICFVersion3? formInfo.eICFVersion3:null),
                    "FSQuestions":[]
                }

                //Adding enrollment date variable
                if(formInfo.has_dependency == false){
                    dataTimeObj.question_group = "Form";
                    dataTimeObj.question = "Enrollment Date";
                    dataTimeObj.variable_name = "enrollment_date";
                    formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));
                }

                //Adding consent date variable
                if(formInfo.eICF_form == true){
                    dataTimeObj.question_group = "Form";
                    dataTimeObj.question = "Consent Date";
                    dataTimeObj.variable_name = "consent_date";
                    formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));
                }

                //Adding enrollment date variable
                dataTimeObj.question_group = "Form";
                dataTimeObj.question = "Form Sent Date";
                dataTimeObj.variable_name = "form_sent_date";
                formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));

                //Adding enrollment date variable
                dataTimeObj.question_group = "Form";
                dataTimeObj.question = "Form Receive Date";
                dataTimeObj.variable_name = "form_receive_date";
                formObj.FSQuestions.push(JSON.parse(JSON.stringify(dataTimeObj)));

                //Section level information
                formInfo.FormsSections.forEach( sectionInfo =>{
                    //Question level information
                    sectionInfo.FSQuestions.forEach( questionInfo =>{
                        formObj.FSQuestions.push(questionInfo);
                    });
                });

                //Adding final object
                finalData.push(formObj);
            });

            resolve(finalData);

        } catch(err){
            console.log(err);
            reject(err);
        }
    });
}

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
                    "event_name": (formInfo.event_name ? formInfo.event_name : ""),
                    "status": otherInfo.status,
                    "description" : formInfo.description,
                    "has_dependency": formInfo.has_dependency,
                    "has_dependency": formInfo.has_dependency,
                    "days_reminder": (formInfo.days_reminder? formInfo.days_reminder: false),
                    "days":  ((formInfo.days  && formInfo.days != "") ?parseInt(formInfo.days) : 0),
                    "hours_reminder": (formInfo.hours_reminder ?formInfo.hours_reminder : false),
                    "hours": ((formInfo.hours  && formInfo.hours != "") ?parseInt(formInfo.hours) : 0),
                    "form_expire": (formInfo.form_expire? formInfo.form_expire: false),
                    "form_expire_time": ((formInfo.form_expire_time && formInfo.form_expire_time != "") ? formInfo.form_expire_time: 0),
                    "participant_facing": formInfo.participant_facing,
                    "eICFName1": formInfo.eICFName1,
                    "eICFVersion1": formInfo.eICFVersion1,
                    "eICFCode1": formInfo.eICFCode1,
                    "eICFName2": formInfo.eICFName2,
                    "eICFCode2": formInfo.eICFCode2,
                    "eICFVersion2": formInfo.eICFVersion2,
                    "eICFName3": formInfo.eICFName3,
                    "eICFCode3": formInfo.eICFCode3,
                    "eICFVersion3": formInfo.eICFVersion3,
                    "created_by": otherInfo.userId,
                    "updated_by": otherInfo.userId
                });
            });
            let formDependencyList = [];
            if(formList.length > 0){
                formList = await FormManager.createBulkForm(formList);

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
                    await FormManager.createBulkFormDependencyMapping(formDependencyList);
                }

                //Creating form sections

                asyncLoop(data,(formInfo, next)=>{
                    createEmailMapping (formInfo, otherInfo);
                    FSectionsCreate(formInfo, otherInfo, next);
                },(err)=>{
                    if(err){
                        console.log(err);
                        return reject(err);
                    }
                    resolve();
                });

            }
        } catch(err){
            console.log(err);
            reject(err);
        }
    })
}

/**
* Mapping form section id and other information to main data.
**/
function FSectionsCreate(formInfo, otherInfo, next){
    try{
        asyncLoop(formInfo.FormsSections,async(sectionInfo, next1)=>{
            sectionInfo["study_id"] = formInfo.study_id;
            sectionInfo["form_id"] = formInfo.id;
            sectionInfo["category"] = formInfo.category;

            sectionInfo["id"] = await  FormManager.createFormsSection({
                "study_id" : formInfo.study_id,
                "form_id": formInfo.id,
                "category": formInfo.category,
                "order": sectionInfo.order,
                "name" :sectionInfo.name.trim(),
                "linked_variable_name": sectionInfo.linked_variable_name,
                "question_attributes_list": sectionInfo.question_attributes_list,
                "question_attributes_label": sectionInfo.question_attributes_label,
                "cde_version": sectionInfo.cde_version,
                "cde_status": sectionInfo.cde_status,
                "created_by": otherInfo.userId,
                "updated_by": otherInfo.userId
            });
            sectionInfo["language"] = formInfo.language;

            await createQuestions(sectionInfo, sectionInfo.FSQuestions, otherInfo);

            next1();
        },(err)=>{
            if(err){
                console.log(err);
                next(err);
            } else {
                next();
            }
        })
    }catch(err){
        console.log(err);
        next(err);
    }
}

function createEmailMapping(formInfo, otherInfo){
    return new Promise (async(resolve, reject)=>{
        try {
            let emailMapInfo = {
                'study_id': otherInfo.study_id,
                'form_group': 'Form',
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
function createQuestions (sectionInfo, FSQuestions, otherInfo){
    return new Promise(async(resolve, reject)=>{
        try {

            let formQuestionsList= [];

            FSQuestions.forEach(questionObj =>{
                questionObj["study_id"] = sectionInfo.study_id;
                questionObj["form_id"] = sectionInfo.form_id;
                questionObj["language"] = sectionInfo.language;
                questionObj["sections_id"] = sectionInfo.id;
                questionObj["category"] = sectionInfo.category;

                formQuestionsList.push({
                    "study_id": sectionInfo.study_id,
                    "form_id": sectionInfo.form_id,
                    "sections_id": sectionInfo.id,
                    "order": questionObj.order,
                    "category": sectionInfo.category,
                    "language": sectionInfo.language,
                    "question_group": (questionObj.question_group? questionObj.question_group:"Form"),
                    "question_type": questionObj.question_type,
                    "question_edited": (questionObj.question_edited? questionObj.question_edited : false),
                    "cde_variable_name": questionObj.cde_variable_name,
                    "cde_version": questionObj.cde_version,
                    "cde_status": questionObj.cde_status,
                    "shared_question": (questionObj.shared_question? questionObj.shared_question: false),
                    "question": questionObj.question,
                    "hint": questionObj.hint,
                    "variable_name": questionObj.variable_name,
                    "dependent": (questionObj.dependent? questionObj.dependent : false),
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
                let questionList =  await FormManager.createBulkFSQuestions(formQuestionsList);
                await createAttributes(FSQuestions, questionList, otherInfo);
                resolve();
            }
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
                        "sections_id": questionInfo.sections_id,
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
                   await FormManager.createBulkFSQAttributes(attributeList);
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

            let usedVariablesInEICF = await FormManager.getFormDependencyMappingList(searchQuery);
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
                    'form_code': payload.form_code,
                    'form_group': payload.form_group,
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
* Get form list
**/
module.exports.getFormsList = async(req, res) => {
    try {
        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = {};
        if(req.query.query) {
            params = await authService.decryptPayload(req.query.query);
        }



        let searchQuery = {
            where: {'study_id': req.user.study_id},
            attributes: ['id', 'study_id', 'form_code', 'form_group', 'category', 'name', 'language', 'version', 'event_name', 'status','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time','participant_facing'],
            include:[
                {
                  model: Users,
                  attributes: ['id', 'first_name', 'last_name']
                }
            ],
            order: [['updated_at', 'DESC'],['name', 'ASC'],['version', 'ASC'],['language', 'ASC']],
            required: true
        }

        if(Object.keys(params).length  != 0 && ('has_dependency' in params)){
            searchQuery.where['has_dependency'] = params.has_dependency;
        }

        if(Object.keys(params).length  != 0 && !appService.isStringEmptyOrSpaces(params.status)){
            searchQuery.where['status'] = params.status;
        }

        if(Object.keys(params).length  != 0 && !appService.isStringEmptyOrSpaces(params.language)){
            searchQuery.where['language'] = params.language;
        }

        if(Object.keys(params).length  != 0 && ('for' in params) && params.for === 'DataManagement'){
            searchQuery.where['status'] = [params.status, 'Archive'];
        }

        let data = await FormManager.getFormsList(searchQuery);

        if(data && data.length >0){
            asyncLoop(data, async(formInfo, next)=>{

                let emailInfo = await getMappedEmailList(formInfo.id);

                if(emailInfo){
                    formInfo['email_code'] = emailInfo.email_code;
                    formInfo['email_version'] = emailInfo.email_version;
                    formInfo['email_reminder_code'] = emailInfo.email_reminder_code;
                    formInfo['email_reminder_version'] = emailInfo.email_reminder_version;
                } else {
                    formInfo['email_code'] = null;
                    formInfo['email_version'] = null;
                    formInfo['email_reminder_code'] = null;
                    formInfo['email_reminder_version'] = null;
                }

                next();
            });
        }

        data = JSON.stringify(data);
        data = data.replace(/\"User\":/ig, '\"updated_by\":');
        data = JSON.parse(data);

        return res.status(200).json({success : true, message: 'Data found', data: data});

    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

/**
* Get particular form info/details
**/
 module.exports.getFormsInfo = async(req, res) => {
    try {
        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = {};
        if(req.query.query) {
            params = await authService.decryptPayload(req.query.query);
        }

        params["dependent"] = (params["dependent"]? params["dependent"]: false);

        if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.version)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        let searchQuery = {
            where: {
                'study_id': req.user.study_id,
                'name': params.name.trim(),
                'version': params.version.trim()
            },
            attributes: ['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'event_name', 'status', 'description', 'has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'participant_facing', 'form_expire_time','eICFName1', 'eICFCode1' ,'eICFVersion1','eICFName2', 'eICFCode2' ,'eICFVersion2','eICFName3', 'eICFCode3' ,'eICFVersion3', 'created_at', 'updated_at'],
            include:[
                {
                    model: FormsSections,
                    attributes: ['id', 'study_id', 'form_id', 'category', 'order', 'name', 'linked_variable_name', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                    include:[{
                        model: FSQuestions,
                        attributes: ['id', 'study_id', 'form_id', 'sections_id', 'order', 'category', 'language', 'question_group', 'question_type','question_edited', 'cde_variable_name', 'cde_version', 'cde_status', 'shared_question', 'question', 'hint', 'variable_name', 'dependent', 'response_type','descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label'],
                        include:[{
                            model: FSQAttributes,
                            attributes: ['id', 'study_id', 'form_id', 'sections_id', 'questions_id', 'response_type', 'attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
                        }]
                    }]
                },
                {
                    model: FormDependencyMapping,
                    attributes:['id', 'study_id', 'form_id', 'form_code', 'language', 'order', 'condition','dependent_form_code','form_group','response_type', 'variable_name', 'operator', 'values', 'label' ]
                },
                {
                    model: Users,
                    attributes: ['id', 'first_name', 'last_name']
                }
            ],
            order: [
                [{model: FormsSections}, 'order', 'ASC'],
                [{model: FormsSections}, {model: FSQuestions}, 'order', 'ASC'],
                [{model: FormsSections}, {model: FSQuestions}, {model: FSQAttributes},'order', 'ASC'],
                ['language', 'ASC'],
            ],
            required: true
        }

        let data = await FormManager.getFormsList(searchQuery);

        if(data && data.length >0){

            let dependentVariables = [];
            if(params.dependent){
                dependentVariables = await getCurrentFormUsedDependentVariables(data[0].form_code);
            }

            data = await getFormeICF(data);
            asyncLoop(data, async(formInfo, next)=>{
                //Updating dependent flag
                if(dependentVariables && dependentVariables.length >0){
                    formInfo.FormsSections.forEach(sectionInfo =>{
                        sectionInfo.FSQuestions.forEach((qObj)=>{
                            isUsed = _.findWhere(dependentVariables,{'variable_name': qObj.variable_name});
                            if(isUsed && qObj['dependent'] == false){
                                qObj['dependent'] = true;
                            } else {
                                qObj['dependent'] = false;
                            }
                        });
                    });
                }

                let emailInfo = await getMappedEmailList(formInfo.id);

                if(emailInfo){
                    formInfo['email_code'] = emailInfo.email_code;
                    formInfo['email_version'] = emailInfo.email_version;
                    formInfo['email_reminder_code'] = emailInfo.email_reminder_code;
                    formInfo['email_reminder_version'] = emailInfo.email_reminder_version;
                } else {
                    formInfo['email_code'] = null;
                    formInfo['email_version'] = null;
                    formInfo['email_reminder_code'] = null;
                    formInfo['email_reminder_version'] = null;
                }
                next();
            },(err, result)=>{

                data = JSON.stringify(data);
                data = data.replace(/\"User\":/ig, '\"updated_by\":').replace(/\"FormDependencyMappings\":/ig, '\"FormDependencyMapping\":');
                data = JSON.parse(data);

                return res.status(200).json({success : true, message: 'Data found', data: data});
            });
        } else {
            return res.status(200).json({success : true, message: 'Data found', data: []});
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}



/**
* Get user survey form info/details
**/
module.exports.getSurveyFormInfo = async(req, res) => {
    try {
        if(!req.query.query) {
            return res.status(406).json({success: false, message: 'Request payload missing'});
        }

        //Getting query input from request
        let params = await authService.decryptPayload(req.query.query);
        if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.form_code) || appService.isStringEmptyOrSpaces(params.form_group)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        let searchQuery = {};
        if(params.form_group && params.form_code && params.id){
            searchQuery = {
                where: {
                    form_group: params.form_group,
                    form_code: params.form_code,
                    user_id: params.id,
                },
            }
            let userFormInfo = await userManager.getUserFormMapping(searchQuery);

            if(userFormInfo && userFormInfo.initiated_at == null && userFormInfo.form_expire && moment().isAfter(moment(userFormInfo.form_expire_at))){
                let updateQuery = {
                   status: "Expired",
                }
                await userManager.updateUserFormMapping(searchQuery, updateQuery);
                return res.status(417).send({success: false, message: 'Survey link expired'});
            }
        }
        let result = {}
        if(params.id && params.id !== null) {
            searchQuery = {
                where : {
                    user_id: params.id,
                    form_code: params.form_code,
                    form_group: params.form_group
                }
            }

            let userFormMappingInfo = await userManager.getUserFormMapping(searchQuery);
            if(!userFormMappingInfo || userFormMappingInfo && userFormMappingInfo.form_mapping_status === 'inactive') {
                return res.status(403).json({status: false, message: 'User not part of this survey'});
            }

            searchQuery = {
                where : {
                  id: params.id
                },
                attributes:['id', 'study_id', 'UID', 'first_name', 'last_name', 'personal_email', 'mobile_phone', 'status']
            }

            let userProfile = await userManager.getUserProfile(searchQuery);
            if(!userProfile) {
                return res.status(403).json({status: false, message: 'User not found'});
            }

            searchQuery = {
                where: {
                    user_id: userProfile.id,
                    form_code: params.form_code,
                    form_group: params.form_group,
                }
            }

            let userSurveyRecord = await surveyManager.getSurveyRecord(searchQuery);
            //If direct mapping not found and form_group is 'Form' then search for eICF1, eICF2 or eICF3
            //To get Survey Id
            if(!userSurveyRecord){
                //Checking eICF1
                userMappedForm = await userManager.getUserFormMapping ({
                    where:{
                        user_id: userProfile.id,
                        eICFCode1: params.form_code
                    }
                });

                if(!userMappedForm){
                    //Checking eICF2
                    userMappedForm =  await userManager.getUserFormMapping ({
                        where:{
                            user_id: userProfile.id,
                            eICFCode2: params.form_code
                        }
                    });
                }

                if(!userMappedForm){
                    //Checking eICF3
                    userMappedForm =  await userManager.getUserFormMapping ({
                        where:{
                            user_id: userProfile.id,
                            eICFCode3: params.form_code
                        }
                    });
                }

                //Fetching survey information
                if(userMappedForm){
                    searchQuery = {
                        where: {
                            user_id: userProfile.id,
                            form_code: userMappedForm.form_code,
                            form_group: userMappedForm.form_group,
                            category: userMappedForm.category
                        }
                    }
                    userSurveyRecord =  await surveyManager.getSurveyRecord(searchQuery);
                }
            }


            if(!userSurveyRecord){
                return res.status(403).json({status: false, message: 'User not part of this survey'});
            }

            if(userFormMappingInfo && userFormMappingInfo.status === 'Completed') {
                return res.status(403).json({status: false, message: 'User already taken this survey'});
            }

            let updateQuery = {
                initiated_at: new Date()
            }

            await surveyManager.updateSurveyRecord(searchQuery, updateQuery);

            updateQuery['status'] = 'Started';
            await userManager.updateUserFormMapping (searchQuery, updateQuery);

            result['userProfile'] = userProfile;
            result['survey_id'] = userSurveyRecord.id,
            result['token'] = authService.generateAuthToken(result.userProfile);
            // searchQuery = {
            //   where: {
            //     id: userProfile.id
            //   }
            // }
            //
            // updateQuery = {
            //   status: 'Active'
            // }
            //
            // await userManager.updateUserProfile(updateQuery, searchQuery);
        }

        let searchPayload = {
            'form_code': params.form_code.trim(),
            'form_group': params.form_group.trim(),
            'status': 'Published'
        }

        let formData =  await getFormData(searchPayload);

        if(!formData.forms && !formData.eICFs  && [...formData.forms, ...formData.eICFs ].length  == 0) {
            return res.status(409).json({status: false, message: 'Invalid Survey'});
        }

        //Checking any revised eICF need to send

        if(Array.isArray(formData.eICFs) && formData.eICFs.length >0){
            formData.eICFs.forEach(eICFObj =>{
                if(Array.isArray(eICFObj) && eICFObj.length >0){
                    eICFObj.forEach(eICFInfo=>{
                        eICFInfo["revisedEICF"] = false;
                    })
                }
            });
        }
        //Checking any revised eICF need to send
        let eICFList = [];
        
        if(result && result.userProfile){
            let revisedEICF = await getRevisedEICF(result.userProfile.study_id, result.userProfile.id);
            if(revisedEICF && revisedEICF!= null && revisedEICF.length >0){
                revisedEICF.forEach(eICFObj =>{
                    eICFList.push({
                        'name': eICFObj.name,
                        'version': eICFObj.version,
                        'form_code': eICFObj.form_code
                    });
                });
            }
        }
        
        if(eICFList.length > 0){
            eICFList = await geteICFFormObjList(eICFList, true);
        }

        if(eICFList.length >0){
            formData.eICFs = [...eICFList, ...formData.eICFs];
        }
        result['surveyForm'] = formData.forms;
        result['eICFs'] = formData.eICFs;
        res.status(200).json({success : true, data: result});
      } catch (err) {
          console.log(err);
          res.status(400).json({success: false, message: err.message});
      }
}


module.exports.getFormDetails = async(req, res) => {
    try {
        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = {};
        if(req.query.payload) {
            params = await authService.decryptPayload(req.query.payload);
        }

        let searchQuery = {
            where: {
                form_code: params.form_code
            },
            attributes: ['id', 'completed_at'],
            include: {
                model: SurveyDetails,
                where: {
                  status: 'Active'
                },
                attributes: ['survey_id', 'variable_name', 'answer'],
                group: ['variable_name']
            }
        }

        let formsList = await surveyManager.getSurveyList(searchQuery);
        let arr = [];

        formsList.forEach(form => {
            let completedAt = moment(form.completed_at).format('MM/DD/YYYY hh:mm')
            if(form.SurveyDetails && form.SurveyDetails.length) {
                let obj = { record_id: form.id }
                form.SurveyDetails.forEach(item => {
                    obj[item['variable_name']] = item.value || item.answer
                });
                obj.sociodem_date_mdy = completedAt;
                obj.housing_date_mdy = completedAt;
                obj.work_ppe_date_mdy = completedAt;
                obj.med_hx_date_mdy = completedAt;
                obj.hlthstat_date_mdy = completedAt;
                obj.vacc_date_mdy = completedAt;
                obj.test_date_mdy = completedAt;
                obj.sym_date_mdy = completedAt;
                obj.alcohol_date_mdy = completedAt;
                obj.iden_date_mdy = completedAt;
                obj.consentdt_mdy = completedAt;
                obj.covid_test_date_mdy = completedAt;
                arr.push(obj)
            }
        });
        res.status(200).json({success : true, message: 'Data found', data: arr});
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Get user survey form info/details
**/
module.exports.getDependencyFormInfo = async(req, res) => {
    if(!req.query.query) {
        return res.status(406).json({success: false, message: 'Request information is missing'});
    }
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        //Getting query input from request
        let params = await authService.decryptPayload(req.query.query);
        if(Object.keys(params).length  == 0 || appService.isStringEmptyOrSpaces(params.category)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }


        //Creating search query
        let searchQuery = {
            where: {
                "study_id": req.user.study_id || 1,
                "category": params.category.trim(),
                "language": "English",
                "status": "Published"
            },
            attributes:['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer', 'created_at', 'updated_at'],
            include:[
                {
                    model: eICFFQuestions,
                    where:{
                        "descriptive": false,
                        "response_type": {[Op.in]:['Number', 'Radio Button', 'Multiple Choice', 'DateTime', 'Date']}
                    },
                    attributes: ['question_group','question', 'variable_name', 'response_type','question_edited', 'cde_version', 'cde_status', 'dependent'],
                    include:[{
                        model: eICFFQAttributes,
                        attributes: ['response_type','attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
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

        if(eICFForms && eICFForms.length >0){
            eICFForms = JSON.stringify(eICFForms);
            eICFForms =  eICFForms.replace(/\"eICFFQuestions\":/ig, '\"FSQuestions\":').replace(/\"eICFFQAttributes\":/ig, '\"FSQAttributes\":').replace(/\"eICFFormsDependency\":/ig, '\"FormDependencyMapping\":');
            eICFForms = JSON.parse(eICFForms);
        }

        searchQuery = {
            where:{
                "study_id": req.user.study_id || 1,
                "category": params.category.trim(),
                "language": "English",
                "status": "Published"
            },
            attributes: ['id', 'form_code', 'category', 'name', 'version','has_dependency','eICFName1', 'eICFCode1' ,'eICFVersion1','eICFName2', 'eICFCode2' ,'eICFVersion2','eICFName3', 'eICFCode3' ,'eICFVersion3'],
            include:[
                {
                    model: FormsSections,
                    attributes: ['id'],
                    include:[
                        {
                            model: FSQuestions,
                            where:{
                                "descriptive": false,
                                "response_type": {[Op.in]:['Number', 'Radio Button', 'Multiple Choice', 'DateTime', 'Date']}
                            },
                            attributes: ['question_group','question', 'variable_name', 'response_type', 'question_edited', 'cde_version', 'cde_status', 'dependent'],
                            include: [{
                                model: FSQAttributes,
                                attributes: ['response_type', 'attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
                            }]
                        }
                    ]
                },
                {
                    model: FormDependencyMapping,
                    attributes:['id', 'study_id', 'form_id', 'form_code','language', 'order', 'condition','dependent_form_code', 'form_group', 'response_type', 'variable_name', 'operator', 'values', 'label' ]
                }
            ]
        }

        let data = await FormManager.getFormsList(searchQuery);

        //Process data in required format
        data = await formatDependencyInputs(eICFForms, data);
        data = JSON.stringify(data).replace(/\"FormDependencyMappings\":/ig, '\"FormDependencyMapping\":');
        data = JSON.parse(data);


        return res.status(200).json({success : true, message: 'Data found', data: data});

    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }

}

/**
* Add/Create new form
**/
module.exports.addNewForm = async(req, res) => {
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

        let formName = params[0].name.trim();
        let isFormExists =   await FormManager.getForms({
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

        let auditPayload = {
          message: `${formName} new form created`,
          personal_email: req.user.personal_email,
          user_id: req.user.id,
          study_id: req.user.study_id
        }
        await appService.addLog(auditPayload);
        res.status(200).json({success: true, message: 'Added successfully'});
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

        let isFormExists =  await FormManager.getForms({
            where: {
            "study_id": req.user.study_id || 1,
            'name': params[0].name.trim(),
            'version': params[0].version,
            'language': params[0].language
            },
            attributes: ['id', 'name', 'language', 'version'],
            raw: true
        });

        if(isFormExists && isFormExists.id != params[0].id && isFormExists != null && isFormExists != undefined && Object.keys(isFormExists).length != 0){
            return res.status(400).json({success: false, message: "This version already existsVersion already exits, Please change form version."});
        }

        // if(!isFormExists){
        //     return res.status(400).json({success: false, message: "Record not found."});
        // }

        let existsFormList =  await FormManager.getFormsList({
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
* Update from status
**/
module.exports.updateFormStatus = async(req, res) => {
    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        //Getting query input from request
        let params = await authService.decryptPayload(req.body.payload);
        if(appService.isStringEmptyOrSpaces(params.version)|| appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.status)){
            return res.status(409).json({success: false, message: 'Request information is missing'});
        }

        params.name = params.name.trim();
        params.status = params.status.trim();

        //Creating search query
        let searchQuery = {
            where: {'version': params.version, 'name': params.name},
            attributes: ['id', 'study_id', 'form_code', 'category', 'name', 'language', 'version', 'status'],
            raw: true
        }
        //Fetching data
        //Validate if any form exits with same name and version

        let formInfo = await FormManager.getForms(searchQuery);

        if(formInfo == null || formInfo == undefined || Object.keys(formInfo).length === 0 || formInfo.name == undefined){
            return res.status(400).json({success: false, message: "Record not found."});
        } else {

            //Checking current and new status correct as per flow or not
        let canUpdate = false;

        // To Be Done verify CDE Version is 'Active'

        if(formInfo.status.toLowerCase() == 'draft' && params.status.toLowerCase() == 'published'){
            canUpdate = true;
        }

        if(formInfo.status.toLowerCase() == 'published' && params.status.toLowerCase() == 'archive'){
            let recCount = 0;
            //Used in Form Dependency
            
            data =  await eICFFormManager.getEICFDependencys({
                where:{'study_id': req.user.study_id || 1,'dependent_form_code': formInfo.form_code, status: 'Published' },
                attributes:['id','study_id', 'dependent_form_code']
            });
            recCount = recCount + data.length || 0;
           
            //Used in Form Dependency
            data =  await FormManager.getFormDependencyMappingList({
                where:{'study_id': req.user.study_id || 1,'dependent_form_code': formInfo.form_code, status: 'Published' },
                attributes:['id','study_id', 'dependent_form_code']
            });
            recCount = recCount + data.length || 0;

            if(recCount > 0 ){
                return res.status(409).json({success: false, message: "Dependencies are set on the form, cannot be deleted." || "Form already attached with eicf/forms, So we unable to progress your request"});
            } else {
                canUpdate = true;
            }
        }

        //If invalid status then send error else update database
        if(!canUpdate){
            return res.status(409).json({success: false, message: "Invalid status"});
        } else {

            //Archive Form of other version if already Published
            if(params.status.toLowerCase() == 'published'){
                //Fetching other published version
                formInfo = await FormManager.getForms({
                    where: {'name': params.name,
                    'version': {[Op.ne]: params.version},
                    'status': 'Published'},
                    attributes: ['name', 'language', 'version', 'status'],
                    raw: true
                });
                if(formInfo != null && formInfo != undefined && Object.keys(formInfo).length != 0){
                    await FormManager.updateForms({
                        'status': 'Archive',
                        'updated_by': req.user.id
                    },
                    {
                        where: {'name': formInfo.name,'status': 'Published', 'version': formInfo.version}
                    });

                    await FormManager.updateFormDependency({
                        'status': 'Archive',
                        'updated_by': req.user.id
                    },
                    {
                        where: {'name': formInfo.name,'status': 'Published', 'version': formInfo.version}
                    });
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
            await FormManager.updateFormDependency(updateQuery, searchQuery);
            await FormManager.updateForms(updateQuery, searchQuery);

            if(params.status.toLowerCase() == 'published'){
                formInfo = await FormManager.getForms({
                    where: {
                    'study_id': req.user.study_id || 1,
                    'name': params.name.trim(),
                    'version':  params.version,
                    'status': 'Published'
                    }
                });

                await updateUserFormMapping(formInfo);
            }
            
            return res.status(200).json({success : true, message: 'Updated successfully'});
        }


        }
    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }
}

/**
* Delete form
**/
module.exports.deleteForm = async(req, res) => {
    if(!req.body.payload) {
        return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    try {
        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = await authService.decryptPayload(req.body.payload);
        if(appService.isStringEmptyOrSpaces(params.name) || appService.isStringEmptyOrSpaces(params.version)){
            throw ('Request information is missing');
        } else {
            //Creating search query
            let searchQuery = {
                where: {'name': params.name, 'version': params.version},
                attributes: ['id', 'name', 'language', 'version', 'status', 'form_code'],
            }
            //Fetching data
            let formList = await FormManager.getFormsList(searchQuery);

            if(formList == null || formList == undefined || !Array.isArray(formList) || formList.length == 0 || Object.keys(formList[0]).length === 0){
                return res.status(409).json({success: false, message: "Record not found."});
            } else {
                //If invalid status then send error else update database
                if(formList[0].status.toLowerCase() != 'draft'){
                    return res.status(409).json({success: false, message: "You can't delete this record."});
                } else {
                    //Processing delete form list one by one
                    asyncLoop(formList,async(formInfo, next)=> {
                        await deleteFormsData(formInfo.id);
                        next();
                    },
                    function(err, output){
                        if(err){
                            res.status(400).json({success: false, message: err.message? err.message: err});
                        } else {
                            res.status(200).json({success: true, message: 'Deleted successfully'});
                        }
                    });
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({success: false, message: err.message? err.message: err});
    }
}
