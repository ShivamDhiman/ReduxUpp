const moment = require('moment');
const { Op } = require('sequelize');
const appService = require('./appService');
const errorLib = require('../lib/errorLib');
const _ = require('underscore');
const asyncLoop = require('node-async-loop');
const asyncWaterfall = require('async-waterfall');
const userManager = require('../data/managers/users');
const { FormDependencyMapping } = require('../data/models/formDependencyMapping');
const formManager = require('../data/managers/forms');
const { eICFFormsDependency } = require('../data/models/eICFFormsDependency');
const eICFManager = require('../data/managers/eICFForm');
const surveyManager = require('../data/managers/survey');
const queueManager = require('../data/managers/dependencyQueue');


function getQueueBatch(searchQuery){
    return new Promise(async(resolve,reject)=>{
        try {
           resolve(await queueManager.getDependencyQueueList(searchQuery));
        }catch(err){
            reject(errorLib.generateErrorMsg('getQueueBatch', err));
        }
    });
}

function getQueueInfo(queueId){
    return new Promise(async(resolve,reject)=>{
        try {

           resolve(await queueManager.getDependencyQueue({where:{"id": queueId}}));

        }catch(err){
            reject(errorLib.generateErrorMsg('getQueueInfo', err));
        }
    });
}

function updateQueueInfo(queueId, updateQuery){
    return new Promise(async(resolve,reject)=>{
        try {
            resolve(await queueManager.updateDependencyQueue(updateQuery, {where:{"id": queueId}}));
        }catch(err){
            reject(errorLib.generateErrorMsg('updateQueueInfo', err));
        }
    });
}


function getformInfo(study_id, form_group, form_code){
    return new Promise(async(resolve,reject)=>{
        try {
            let searchQuery = {
                where: {
                    'study_id': study_id,
                    'form_code': form_code,
                    'language': 'English',
                    'status': 'Published'
                },
                required: true
            }
            if(form_group == 'eICF'){
                searchQuery["attributes"] = ['id', 'study_id', 'form_code','form_group', 'category', 'name', 'language', 'version', 'event_name', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer'];
                searchQuery["include"] = [{
                    model: eICFFormsDependency,
                    attributes:['id', 'study_id', 'form_id', 'form_code', 'name', 'version','status', 'language', 'order', 'condition','dependent_form_code','form_group','response_type', 'variable_name', 'operator', 'values', 'label' ]
                }]
                resolve(await eICFManager.getEICFForm(searchQuery));
            } else {
                searchQuery["attributes"] = ['id', 'study_id', 'form_code','form_group', 'category', 'name', 'language', 'version', 'event_name', 'status', 'description', 'has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'participant_facing', 'form_expire_time','eICFName1', 'eICFCode1' ,'eICFVersion1','eICFName2', 'eICFCode2' ,'eICFVersion2','eICFName3', 'eICFCode3' ,'eICFVersion3'];
                searchQuery["include"] = [{
                    model: FormDependencyMapping,
                    attributes:['id', 'study_id', 'form_id', 'form_code', 'name', 'version','status', 'language', 'order', 'condition','dependent_form_code','form_group','response_type', 'variable_name', 'operator', 'values', 'label' ]
                }]
                resolve(await formManager.getForms(searchQuery));
            }

        }catch(err){
            reject(errorLib.generateErrorMsg('getformInfo', err));
        }
    });
}

function getDependentList(form_code, form_group){
    return new Promise(async(resolve, reject)=>{
        try{

            let data = [];
            let searchQuery = {
                where :{
                    "dependent_form_code": form_code,
                    "form_group": form_group,
                    "status": "Published",
                    "language": "English"
                },
                attributes:['study_id', 'form_code', 'name', 'version'],
                group:['study_id', 'form_code', 'name', 'version']
            }
            
            //Checking eICF forms
            let eICFList = await eICFManager.getEICFDependencys(searchQuery);
            if(eICFList && Array.isArray(eICFList) && eICFList.length > 0){
                data =  data.concat(eICFList);
                data.forEach(formInfo =>{
                    formInfo['form_group'] = 'eICF';
                });
                
            }

            //Checking survey forms
            let formList =  await formManager.getFormDependencyMappingList(searchQuery);
            if(formList && Array.isArray(formList) && formList.length > 0){
               
                formList.forEach(formInfo =>{
                    formInfo['form_group'] = 'Form';
                });

                data =  data.concat(formList);
            }
            let finalData = [];
            //Removing Duplicate Data
            if(data.length >0 ){

                finalData = appService.removeDuplicateObj(data);

                // asyncLoop(data, (infoObj, next)=>{
                //    let isObjExists =  _.findWhere(data,{'study_id': infoObj.study_id, 'form_code': infoObj.form_code, 'name': infoObj.name, 'version':infoObj.version});
                //    if(!isObjExists){
                //     finalData.push(infoObj);
                //    }
                //    next();
                // });
            }
            resolve(finalData);

        } catch(err){
            reject(errorLib.generateErrorMsg('getDependentList', err));
        }
    });
}

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
                let eICFList = await eICFManager.getEICFFormsList(searchQuery);

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


Array.prototype.inOrNot = function(val, opr){
    let arr = this.map(item => item.trim().toLowerCase())
    val = val.map(item => arr.includes(item.trim().toLowerCase()))
    return val.indexOf(opr !== "in") == -1
}

Array.prototype.Trim = function(){
if(!Array.isArray(this)){
    return []
}
return this.map(item => item && item.trim().toLowerCase())
}

function checkCondition({ ans, value, operator, dataType }){
    if(ans == null){
        return false;
    }
    switch(operator){
        case "=": {
        ans = ans.toString().split(',').sort();
        value = value.toString().split(',').sort();
        return JSON.stringify(ans.Trim()) == JSON.stringify(value.Trim())
        }
        case "<>": {
        ans = ans.toString().split(',').sort();
        value = value.toString().split(',').sort();
        return JSON.stringify(ans.Trim()) != JSON.stringify(value.Trim())
        }
        case "in": {
        return value.inOrNot(ans, "in");
        }
        case "not in": {
        return value.inOrNot(ans, "not in")
        }
        case ">=": {
        if(["DateTime", "Date"].includes(dataType)){
            return ans.isAfter(value) || ans.isSame(value)
        }
        return +ans >= +value
        }
        case "<=": {
        if(["DateTime", "Date"].includes(dataType)){
            return ans.isBefore(value) || ans.isSame(value)
        }
        return +ans <= +value
        }
        default:
        return false
    }
}

//Check variable data and condition are matched or not
function checkVariableMatch(variableInfo, conditionInfo){
    return new Promise(async(resolve,reject)=>{
        try {
            let { values, label, operator, response_type } = conditionInfo;
            let ans = variableInfo.answer
            switch(response_type){
                case "DateTime":
                case "Date": {
                        let value = null;
                        if(operator === "Add Hours"){
                            value = moment(ans).add(parseInt(values), "hours");
                        }else if(operator === "Add Days"){
                            value = moment(ans).add(parseInt(values), "days");
                        }{
                            value = moment(values)
                            if(!checkCondition({ans: moment(ans), value, operator, response_type})){
                                return resolve(false);
                            }
                        }
                        if((!maxAddTime && value) || value.isAfter(maxAddTime)){
                            maxAddTime = value;
                        }
                    }
                    break;
                case "Number":
                case "Descriptive":
                case "Dropdown":
                case "Multiple Choice":
                case "Radio Button":
                case "Text Box": {
                        if(["Dropdown", "Multiple Choice", "Radio Button"].includes(response_type)){
                            values = label;
                        }
                        if(!checkCondition({ ans, value: values, operator, response_type })){
                            return resolve(false);
                        } 
                    }
                    break;
                default: {
                    return resolve(false);
                }
              }

             resolve(true);
            
        }catch(err){
            reject(errorLib.generateErrorMsg('checkVariableMatch', err));
        }
    });
}

/**
* Verifying depended form variables matched or not
*/
function checkDependentForm(user_id, dependentInfo){
    return new Promise(async(resolve,reject)=>{
        let output = {
            "scheduled_at": Date(),
            "err": null,
            "isMatched": true,
            "isEventBased": true
        }
        try {
            let conditionList = [];
            let searchQuery = {
                where:{
                    'form_code': dependentInfo.form_code,
                    'language' : 'English',
                    'status': 'Published'
                }
            }
            //Fetching dependent 
            if(dependentInfo.form_group == 'eICF') {
                conditionList = await eICFManager.getEICFDependencys(searchQuery);
            } 

            if(dependentInfo.form_group == 'Form') {
                conditionList = await formManager.getFormDependencyMappingList(searchQuery);
            } 
            let isAndOR = _.pluck (conditionList, 'condition');
            let formCodeList = _.unique(_.pluck(conditionList,'dependent_form_code'));
            let variableList = _.unique(_.pluck(conditionList, 'variable_name'));

            searchQuery = {
                where:{
                        'form_code':{[Op.in]: formCodeList},
                        'variable_name':{[Op.in]: variableList},
                        'user_id': user_id,
                    }
            }
            let formData = await surveyManager.getSurveyQuestionAnswer(searchQuery);
            
            //If no data found 
            if(!formData || formData.length == 0){
                resolve(output); 
            } else {
                let overAll = null;

                asyncLoop(conditionList, async(conditionInfo, next)=>{
                    
                    //Check is form event based or schedular based
                    if(output.isEventBased == true && (conditionInfo.response_type.toLowerCase().includes("date") || conditionInfo.response_type.toLowerCase().includes("time"))){
                        output.isEventBased = false;
                    }
                    
                    let variableInfo = _.findWhere(formData,{'form_group': conditionInfo.form_group,'form_code': conditionInfo.dependent_form_code,'variable_name':  conditionInfo.variable_name});

                    //If variable not found then return false
                    if(!variableInfo){
                        output.isMatched = false;
                        return resolve(output);
                    }

                    //Check variable and form value
                    let isMatched = await checkVariableMatch(variableInfo, conditionInfo);
                    //Checking Result Over All
                    
                    if(conditionInfo.condition == null){
                        overAll = isMatched;
                    }
                    if(conditionInfo.condition == "AND"){
                        overAll = (overAll && isMatched);
                    }
                    if(conditionInfo.condition == "OR"){
                        overAll = (overAll || isMatched);
                    }
                    
                    if(!overAll){
                        output.isMatched = false;
                        return resolve(output);
                    } 
                    next();
                },(err, res)=>{
                    if(err){
                        output.err = err;
                        reject(errorLib.generateErrorMsg('getSurveyData', err));
                    } else {
                        resolve(output); 
                    }
                    
                });
            }
        }catch(err){
            output.err = err;
            reject(errorLib.generateErrorMsg('getSurveyData', err));
        }
    });
}

/**
 * Creating user form mapping, survey information
 * and based on form send type(event based or schedular based)
 */
function userFormMap(revisedEICFs, currentFormInfo, queueInfo, formInfo, output){
    return new Promise(async(resolve, reject)=>{
        try {

            //Before record insert checking is record already exits or not
            let recIsExits =  await surveyManager.getSurveyRecord({
                where:{
                    'study_id': formInfo.study_id || 1,
                    'form_code': formInfo.form_code,
                    'form_group': formInfo.form_group,
                    'user_id': queueInfo.user_id
                }
            });
            
            if(recIsExits){
                return resolve(false);
            }
            
            let surveyObj = {
                'study_id': formInfo.study_id || 1,
                'form_id': formInfo.id,
                'form_code': formInfo.form_code,
                'form_group': formInfo.form_group,
                'category': formInfo.category,
                'form_name': formInfo.name,
                'version': formInfo.version,
                'event_name': formInfo.event_name,
                'participant_facing': formInfo.participant_facing,
                'user_id': queueInfo.user_id,
                'taken_by': 'PARTICIPANT',
                'status': 'INITIATED',
                'sync_status': 'PUSH_REQUIRED',
                'created_by': queueInfo.user_id,
                'updated_by': queueInfo.user_id
            }

            let sendReminder = false;
            if(formInfo.days_reminder || formInfo.hours_reminder){
                sendReminder = true;
            }

            
            let formMapObj = {
                'study_id': formInfo.study_id || 1,
                'user_id': queueInfo.user_id,
                'form_code': formInfo.form_code,
                'form_name': formInfo.name,
                'form_group': formInfo.form_group,
                'category': formInfo.category,
                'version': formInfo.version,
                'event_name': formInfo.event_name,
                'participant_facing': formInfo.participant_facing || true,
                'has_dependency': formInfo.has_dependency,
                'sendEmailNow': true,
                'eICFName1': (formInfo.form_group == "Form"? formInfo.eICFName1: ""),
                'eICFVersion1': (formInfo.form_group == "Form"? formInfo.eICFVersion1: ""),
                'eICFCode1': (formInfo.form_group == "Form"? formInfo.eICFCode1: ""),
                'eICFName2': (formInfo.form_group == "Form"? formInfo.eICFName2: ""),
                'eICFVersion2': (formInfo.form_group == "Form"? formInfo.eICFVersion2: ""),
                'eICFCode2': (formInfo.form_group == "Form"? formInfo.eICFCode2: ""),
                'eICFName3': (formInfo.form_group == "Form"? formInfo.eICFName3: ""),
                'eICFVersion3': (formInfo.form_group == "Form"? formInfo.eICFVersion3: ""),
                'eICFCode3': (formInfo.form_group == "Form"? formInfo.eICFCode3: ""),
                'revisedEICF': revisedEICFs || null,
                'survey_link': null,
                'reminder': sendReminder,
                'hours_reminder': formInfo.hours,
                'days_reminder': formInfo.days,
                'form_expire': formInfo.form_expire,
                'form_expire_days': formInfo.form_expire_time,
                'form_expire_at': null,
                'form_send_type': output.isEventBased? 'Event Form': 'Scheduler form',
                'form_sent': false,
                'form_send_date':  null,
                'scheduled_at': output.isEventBased? Date(): output.scheduled_at,
                'status': "Link not Sent",
                'form_mapping_status': 'active',
                'assignee': (currentFormInfo && currentFormInfo.assignee? currentFormInfo.assignee : null ),
                'arm_id': (currentFormInfo && currentFormInfo.arm_id? currentFormInfo.arm_id : null ),
                'created_by': queueInfo.id,
                'updated_by': queueInfo.id
            }

            await surveyManager.createSurveyRecord (surveyObj);

            await userManager.createUserFormMapping(formMapObj);
            resolve(true)
        } catch(err){
            reject(errorLib.generateErrorMsg('userFormMap', err));
        }
    });
}

/**
 * This function check form dependency
 * and send email/create schedular of form if required.
*/
function checkQueueDependency(queueInfo){
    return new Promise(async(resolve,reject)=>{
        try {

            // let revisedEICFs =  await getRevisedEICF(queueInfo.study_id, queueInfo.user_id);
            let revisedEICFs = null;
            
            let currentFormInfo = await userManager.getUserFormMapping({
                where: {
                    user_id : queueInfo.user_id,
                    form_code : queueInfo.form_code,
                    form_group: queueInfo.form_group
                }
            })
            //Fetch forms list where current form is used as dependency
            let dependentList = await getDependentList(queueInfo.form_code, queueInfo.form_group);
            //Checking current submited form dependency validation on other forms
            if(dependentList && dependentList.length == 0){
                return resolve();
            }
            
            //Processing dependent form one by one
            asyncLoop(dependentList, async(dependentInfo, next)=>{
                //Verifying depended form variables matched or not
                let output = await checkDependentForm(queueInfo.user_id, dependentInfo);
                //Checking is Dependent form condition matched or not and if matched create mapping
                if(output.isMatched){
                    let formInfo  = await getformInfo(dependentInfo.study_id, dependentInfo.form_group, dependentInfo.form_code);
                    
                    if(formInfo){
                       let isCreated =  await userFormMap(revisedEICFs, currentFormInfo, queueInfo, formInfo, output);
                        if(isCreated){
                            revisedEICFs = null;
                        }
                    }
                }
                
                next();
            }, (err, result)=>{
                if(err){
                    reject(errorLib.generateErrorMsg('checkQueueDependency', err));
                } else {
                    resolve();
                }
            });
            
        }catch(err){
            reject(errorLib.generateErrorMsg('checkQueueDependency', err));
        }
    });
}

/**
 * This function process data for particular queue
*/
function processQueue(queueInfo){
    return new Promise(async(resolve, reject)=>{
        let retryCounter = 0;
        try{
            await updateQueueInfo(queueInfo.id,{'status':'Under Process'});
             checkQueueDependency(queueInfo)
             .then((result)=>{
                updateQueueInfo(queueInfo.id,{'status':'Job done successfully', 'retry_counter': retryCounter});
                resolve("Successfully done.");
             })
             .catch(async(err)=>{
                //Retry 1 Time
                retryCounter = retryCounter +1;
                await updateQueueInfo(queueInfo.id,{'status':'Job Completed', 'retry_counter': retryCounter, 'error_msg': err});

                checkQueueDependency(queueInfo)
                .then((result)=>{
                    updateQueueInfo(queueInfo.id,{'status':'Job done successfully', 'retry_counter': retryCounter});
                    resolve("Successfully done.");
                })
                .catch(async(err)=>{
                    //Retry 2 Time
                    retryCounter = retryCounter +1;
                    await updateQueueInfo(queueInfo.id,{'status':'Job Completed', 'retry_counter': retryCounter, 'error_msg': err});

                    checkQueueDependency(queueInfo)
                    .then((result)=>{
                        updateQueueInfo(queueInfo.id,{'status':'Job done successfully', 'retry_counter': retryCounter});
                        resolve("Successfully done.");
                    })
                    .catch(async(err)=>{
                        //Retry 3 Time
                        retryCounter = retryCounter +1;
                        await updateQueueInfo(queueInfo.id,{'status':'Job completed with error', 'retry_counter': retryCounter, 'error_msg': err});

                        checkQueueDependency(queueInfo)
                        .then((result)=>{
                            updateQueueInfo(queueInfo.id,{'status':'Job done successfully', 'retry_counter': retryCounter});
                            resolve("Successfully done.");
                        })
                        .catch((err)=>{
                            reject(errorLib.generateErrorMsg('processQueue', err));
                        });
                    });
                });
             });

        } catch(err){
            reject(errorLib.generateErrorMsg('processQueue', err));
        }
    });
}

/**
 * This function run urgent/event based queue if required
*/
module.exports.startFormDependencyEngine = (queueId) =>{
    return new Promise(async(resolve, reject)=>{
        try{
            let queueInfo  = await getQueueInfo(queueId);
            if(queueInfo && queueInfo.id){
                await processQueue(queueInfo);
                resolve("Success");
            } else {
               reject(new Error("Queue with pending status not found.")) ;
            }
        } catch(err){
            reject(errorLib.generateErrorMsg('startFormDependencyEngine', err));
        }
    })
}

/**
 * Cron Job Function every 1 minute
 * This function run batch to process queue data
*/
module.exports.formDependencyEngine = () =>{
    return new Promise(async(resolve, reject)=>{
        try{
            let searchQuery = {
                where:{"status": "Pending"},
                orderBy: ['id'],
                limit: 50
                
            }
            let queueData  = await getQueueBatch(searchQuery);
            if(queueData && queueData.length >0){
                asyncLoop(queueData, (queueInfo, next)=>{
                    processQueue(queueInfo)
                    .then(result=>{
                        resolve("Success");
                    })
                    .catch(err =>{
                        errorLib.generateErrorMsg(`startFormDependencyEngine, Queue ID: ${queueInfo.id}`, err);
                    })
                    next();
                });
            }
            resolve();

        } catch(err){
            reject(errorLib.generateErrorMsg('formDependencyEngine', err));
        }
    })
}

/**
 * Cron Job Function every 1 minute
 * This function unlock batch if stuck due to any reason
 * and reset status to Pending
*/
module.exports.unblockStatus = () =>{
    return new Promise(async(resolve, reject)=>{
        try{
            let updatedTime = new moment();
            updatedTime.subtract(10,"m");

            let searchQuery = {
                where:{
                    "status": "Under Process",
                    "updated_at": {[Op.lte]: updatedTime.toDate()}
                }
            }

            queueManager.updateDependencyQueue({"status": "Pending"}, searchQuery);

        } catch(err){
            reject(errorLib.generateErrorMsg('formDependencyEngine', err));
        }
    })
}
