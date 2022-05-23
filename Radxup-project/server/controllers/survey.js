const authService = require('../services/authService');
//const cronJob = require('../services/cronJob');
const fileService = require('../services/fileService');
const dataExchangeService = require('../services/dataExchangeService');
const surveyManager = require('../data/managers/survey');
const eICFFormManager = require('../data/managers/eICFForm');
const userManager = require('../data/managers/users');
const eICFManager = require('../data/managers/eICF');
const dependencyQueueManager = require('../data/managers/dependencyQueue');
const { Users } = require('../data/models/users');
const { Forms } = require('../data/models/forms');
const { Survey } = require('../data/models/survey');
const { SurveyDetails } = require('../data/models/surveyDetails');
const {FormDependencyMapping} = require('../data/models/formDependencyMapping');
const feedbacksManager = require('../data/managers/feedback');
const SchedulerManager = require('../data/managers/scheduler');
const FormManager = require('../data/managers/forms');
const enums = require('../lib/enums');
const { sequelize } = require('../data/connections/connection');
const blobService = require('../services/fileService');
const _ = require('lodash');
const __ = require('underscore');
const { Op } = require('sequelize');
const appService = require('../services/appService');
const VARIABLES = enums.VARIABLES;
const ROLES = enums.ROLES;
const moment = require('moment');
const emailServices = require('../services/emailService');
const asyncLoop = require('node-async-loop');
const { getSurveyQuesAns } = require("../services/getSurveyQuesAns");
const { eICFFormsDependency } = require('../data/models/eICFFormsDependency');
const { eICFFQuestions } = require('../data/models/eICFFQuestions');
const { eICFFQAttributes } = require('../data/models/eICFFQAttributes');
const dependencyEngine = require('../services/formDependencyEngine');

/**
* This function is use for start survey
*/
module.exports.createSurveyRecord = (params, user) => {
  return new Promise(async(resolve, reject)=>{
    try {
      let surveyObj = {
        study_id: params.study_id || 1,
        form_code: params.form_code,
        form_group: params.form_group,
        form_id: params.form_id,
        form_name: params.form_name,
        event_name: params.event_name,
        version: params.version,
        category: params.category,
        participant_facing: params.participant_facing,
        has_dependency: params.has_dependency,
        user_id: params.user_id,
        taken_by: params.taken_by,
        status: 'INITIATED',
        sync_status: 'PUSH_REQUIRED',
        created_by: user.id,
        updated_by: user.id
      }

      let surveyRecord = await surveyManager.createSurveyRecord(surveyObj);
      resolve(surveyRecord);
    } catch (error) {
      reject(error.message);
    }
  });
}

/**
* This function is use for submit survey
*/
module.exports.submitSurvey = async(req, res) => {
  try {
    if (!req.user.hasRole([ROLES.PARTICIPANT, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    let params = await authService.decryptPayload(req.body.payload);

    if(!(params.data && params.data.length > 0)) {
      return res.status(406).json({success: false, message: 'Request data missing'});
    }
    let revisedEICF = params.revisedEICF || false;
    params.form_group = params.form_group || 'Form';
    let searchQuery = {
      where: {
        id: params.participant_id
      },
      attributes:['id', 'status', 'personal_email', 'first_name', 'last_name']
    }

    let userProfile = await userManager.getUserProfile(searchQuery);
    if(!userProfile) {
      return res.status(403).json({status: false, message: 'Participant not assigned with this form'});
    }

    if(params.revisedEICF) {
      return submitRevisedEICF(params, req, res);
    }
    let isMappedForm = true;

  //Checking direct mapped form information
    params['isSurveyEICF'] = false;
    searchQuery = {
      where: {
        form_group: params.form_group || 'Form',
        form_code: params.form_code,
        user_id: userProfile.id
      }
    }

    let userSurveyRecord;
    userSurveyRecord = await userManager.getUserFormMapping(searchQuery);

    //If direct form not found then search for eICF attached with survey forms
    //Checking survey eICF1
    if(!userSurveyRecord) {
      searchQuery = {
        where: {
          eICFCode1: params.form_code,
          user_id: userProfile.id
        }
      }

      userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
      if(userSurveyRecord){
        params['isSurveyEICF'] = true;
        isMappedForm = false;
      }
    }

    //Checking survey eICF2
    if(!userSurveyRecord) {
      searchQuery = {
        where: {
          eICFCode2: params.form_code,
          user_id: userProfile.id
        }
      }

      userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
      if(userSurveyRecord){
        params['isSurveyEICF'] = true;
        isMappedForm = false;
      }
    }

    //Checking survey eICF3
    if(!userSurveyRecord) {
      searchQuery = {
        where: {
          eICFCode3: params.form_code,
          user_id: userProfile.id
        }
      }

      userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
      if(userSurveyRecord) {
        params['isSurveyEICF'] = true;
        isMappedForm = false;
      }
    }

    if(userSurveyRecord && userSurveyRecord.status === 'Completed') {
      return res.status(403).json({status: false, message: 'User already taken the survey'});
    }

    if(!userSurveyRecord || userSurveyRecord && userSurveyRecord.form_mapping_status === 'inactive') {
      return res.status(403).json({status: false, message: 'User not part of this survey'});
    }

    let surveyId = params.survey_id;
    let surveyData = params.data;
    let surveyPayload = [];

    surveyData.forEach((surveyObj) => {
      let obj = {
        survey_id: surveyId,
        user_form_map_id: userSurveyRecord.id,
        version: params.version || 1,
        study_id: params.study_id,
        user_id: userProfile.id,
        form_code: params.form_code,
        form_group: params.form_group || 'Form',
        question_id: surveyObj.question_id,
        question: surveyObj.question,
        variable_name: surveyObj.variable_name,
        answer: surveyObj.answer,
        value: surveyObj.value || surveyObj.answer,
        status: 'Active',
        shared_question: surveyObj.shared_question || true,
        shared_variable_name: VARIABLES[surveyObj.variable_name] || surveyObj.variable_name,
        created_by: req.user.id,
        updated_by: req.user.id,
        not_to_ans: surveyObj.not_to_ans || false
      }
      surveyPayload.push(obj);
    });

    await surveyManager.addSuveyQuestionAnswer(surveyPayload);
    searchQuery = {
      where: {
        id: params.survey_id
      }
    }

    let updateQuery = {
      status: 'COMPLETED',
      completed_at: new Date(),
      taken_by: params.taken_by || 'PARTICIPANT'
    }

    await surveyManager.updateSurveyRecord(searchQuery, updateQuery);
    searchQuery = {
      where: {
        form_code: params.form_code,
        user_id: userProfile.id
      }
    }

    updateQuery = {
      status: 'Completed',
      completed_at: new Date()
    }

    await userManager.updateUserFormMapping(searchQuery, updateQuery);
    searchQuery = {
      where: {
        user_id: userProfile.id,
        status: {
          [Op.ne]: 'Completed'
        }
      }
    }

    let userOpenSurvey = await userManager.getUserFormMappingList(searchQuery);
    searchQuery = {
      where: {
        id: userProfile.id
      }
    }
    if(userOpenSurvey) {
      payload = {
        status: 'Active',
        updated_at: new Date()
      }
    } else {
      payload = {
        status: 'Completed',
        updated_at: new Date()
      }
    }
    await userManager.updateUserProfile(payload, searchQuery);

    searchQuery =  {
      where: {
        dependent_form_code: params.form_code,
        status: 'Publish',
        form_group: params.form_group
      }
    }

    let formDependencies;
    if(params.form_group === 'Form') {
      formDependencies = await FormManager.getFormDependencyMappingList(searchQuery);
    } else {
      formDependencies = await eICFFormManager.getEICFDependencys(searchQuery);
    }

    if(formDependencies && isMappedForm) {
      let dependencyQueuePayload = {
        study_id: params.study_id,
        survey_id: params.survey_id,
        user_id: userProfile.id,
        form_group: params.form_group,
        form_code: params.form_code,
        version: params.version || '',
        created_by: userProfile.id,
        updated_by: userProfile.id
      }

      let queueInfo =  await dependencyQueueManager.createDependencyQueue(dependencyQueuePayload);

     //Executing form validation
     try {
       dependencyEngine.startFormDependencyEngine(queueInfo.id);
     } catch(err){
       console.log(err);
     }
   }

    res.status(200).json({success: true, message: 'Survey successfully submit'});
  } catch (error) {
    console.log(error);
    res.status(409).json({success: false, message: error.message});
  }
}

/**
* This function is use for resubmit survey
*/
module.exports.reSubmitSurvey = async(req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    let params = await authService.decryptPayload(req.body.payload);
    if(!(params.data && params.data.length > 0)) {
      return res.status(406).json({success: false, message: 'Request data missing'});
    }

    let surveyId = params.survey_id;
    let surveyData = params.data;
    let participant_id = params.participant_id;
    let surveyPayload = [];

    let searchQuery = {
      where: {
        form_code: params.form_code,
        user_id: params.participant_id
      }
    }

    let surveyInfo = await surveyManager.getOneSurveyDetailRecord(searchQuery);
    let recordIds = __.pluck(surveyData, 'record_id');
    searchQuery = {
      where: {
        id: recordIds
      }
    }
    //await surveyManager.updateSuveyQuestionAnswer(searchQuery, {status: 'Inactive'});
    await surveyManager.deleteSurveyQuestionAnswer(searchQuery);

    surveyData.forEach((surveyObj) => {
      let obj = {
        survey_id: surveyId,
        user_form_map_id: surveyInfo.user_form_map_id,
        version: params.version || 1,
        study_id: params.study_id,
        user_id: params.participant_id,
        form_code: params.form_code,
        form_group: surveyInfo.form_group,
        question_id: surveyObj.question_id,
        question: surveyObj.question,
        variable_name: surveyObj.variable_name,
        answer: surveyObj.answer,
        value: surveyObj.value || surveyObj.answer,
        status: 'Active',
        shared_question: surveyObj.shared_question || true,
        shared_variable_name: surveyObj.variable_name,
        created_by: req.user.id,
        updated_by: req.user.id,
        not_to_ans: surveyObj.not_to_ans || false
      }

      surveyPayload.push(obj);
    });

    await surveyManager.addSuveyQuestionAnswer(surveyPayload);

    searchQuery = {
      where: {
        id: surveyId
      }
    };

    let updateQuery = {
      sync_status: 'PUSH_REQUIRED',
      updated_by: req.user.id
    };

    await surveyManager.updateSurveyRecord(searchQuery, updateQuery);
    res.status(200).json({success: true, message: 'Survey successfully updated'});
  } catch (error) {
    res.status(409).json({success: false, message: error.message});
  }
}

async function submitRevisedEICF(params, req, res) {
  try {
    let surveyData = params.data;
    let surveyPayload = [];
    let searchQuery = {
      where: {
        form_code: params.form_code,
        user_id: params.participant_id,
        form_group: 'eICF'
      }
    }

    await surveyManager.updateSuveyQuestionAnswer(searchQuery, {status: 'Inactive'});
    let surveyInfo = await surveyManager.getOneSurveyDetailRecord(searchQuery);
    surveyData.forEach((surveyObj) => {
      let obj = {
        survey_id: params.survey_id,
        user_form_map_id: surveyInfo.user_form_map_id,
        version: params.version || 1,
        study_id: params.study_id,
        user_id: params.participant_id,
        form_code: params.form_code,
        form_group: params.form_group,
        question_id: surveyObj.question_id,
        question: surveyObj.question,
        variable_name: surveyObj.variable_name,
        answer: surveyObj.answer,
        value: surveyObj.value || surveyObj.answer,
        shared_question: surveyObj.shared_question || true,
        status: 'Active',
        shared_variable_name: VARIABLES[surveyObj.variable_name] || surveyObj.variable_name,
        created_by: req.user.id,
        updated_by: req.user.id,
        not_to_ans: surveyObj.not_to_ans || false
      }
      surveyPayload.push(obj);
    });

    await surveyManager.addSuveyQuestionAnswer(surveyPayload);
    res.status(200).json({success: true, message: 'Revised EICF successfully submit'});
  } catch (error) {
    console.log(error);
    res.status(409).json({success: false, message: error.message});
  }
}


/**
* This function is use for check form dependencies
*/
function checkFormDependency (form_code, user) {
  return new Promise(async (resolve, reject) => {
    try {
      let searchQuery = {
        where: {
          dependent_form_code: form_code
        },
        attributes: ['form_code'],
        distinct: true
      }

      let depenedencyForm = await surveyManager.getDepenedencyForm(searchQuery);
      if(!(depenedencyForm && depenedencyForm.length)) {
       return resolve();
      }

      let formCodes =  _.uniqBy(_.map(depenedencyForm, 'form_code'));
      searchQuery = {
        where: {
          language: "English",
          status: "Published",
          form_code: {
            [Op.in]: formCodes
          }
        },
        attributes: ['id', 'form_code','language', 'status'],
        include:[
          {
            model: FormDependencyMapping,
            attributes:['id', 'study_id', 'form_id', 'form_code','language', 'order', 'condition','dependent_form_code','response_type', 'variable_name', 'operator', 'values', 'label' ]
          }
        ]
      }

      let formList = await FormManager.getFormsList(searchQuery);

      formList = JSON.parse(JSON.stringify(formList).replace(/\"FormDependencyMappings\":/ig, '\"FormDependencyMapping\":'));

      let formDependencies = [];

      formList.forEach(formInfo =>{
        if(formInfo.FormDependencyMapping && formInfo.FormDependencyMapping.length >0){
          formInfo.FormDependencyMapping.forEach( DFinfo =>{
            formDependencies.push(DFinfo);
          })
        }
      })

      console.log(JSON.stringify({'form_code': form_code,'user':user, 'formList':formList, 'formDependencies': formDependencies }));
      if(!(formDependencies && formDependencies.length)){
        return resolve();
      }
      formDependencies = _.groupBy(formDependencies, "form_code")
      searchQuery = {
        where: {
          form_code: {
            [Op.in]: formCodes
          },
          status: 'Published',
          language: 'English'
        },
        attributes: ['id', 'study_id', 'name', 'form_code', 'status', 'category', 'reminder', 'form_expire', 'form_expire_time', 'has_dependency']
      }
      let formDetails = await FormManager.getFormsList(searchQuery);
      let arr = [];
      for(let [key, value] of Object.entries(formDependencies)){
        let obj = {};
        obj.form_code = key;
        obj.dependencies = value;
        obj.details = _.find(formDetails, { form_code: key })
        arr.push(obj);
      }
      let schedulers = [];

      if(!arr.length){
        resolve();
      }

      asyncLoop(arr, async (item, next) => {
        let { details, scheduledAt, verified, form_code } = await verifyAllDependecies(item, user.id);
        console.log(JSON.stringify({'details':details,'scheduledAt': scheduledAt, 'verified': verified, 'form_code': form_code }));
        if(!verified){
          return next();
        }
        searchQuery = {
          where: {
            form_code: form_code,
            status: 'Published'
          }
        }

        let formInfo = await FormManager.getForms(searchQuery);
        if(scheduledAt){
          let schedulerObj = {
            study_id: details.study_id,
            user_id: user.id,
            form_code: details.form_code,
            form_name: details.name,
            has_dependency: details.has_dependency,
            survey_link: null,
            reminder: details.reminder,
            form_expire: details.form_expire,
            form_expire_time: details.form_expire_time,
            form_expire_at: null,
            form_sent:false,
            form_send_date:  null,
            scheduled_at: scheduledAt,
            status: user.personal_email ? 'Scheduled' : 'Link not Sent',
            form_mapping_status: 'active',
            assignee: null,
            arm_id: null,
            created_by: user.id,
            updated_by: user.id
          }

          await userManager.createUserFormMapping(schedulerObj);

          let surveyObj = {
            study_id: details.study_id,
            form_code: details.form_code,
            form_id: formInfo.id,
            user_id: user.id,
            taken_by: user.id,
            status: 'INITIATED',
            sync_status: 'PUSH_REQUIRED',
            created_by: user.id,
            updated_by: user.id
          }

          await surveyManager.createSurveyRecord(surveyObj);
        } else {
          let payload = {};
          if(formInfo) {
            //Calculate link expire time
            let linkExpireTime = moment("2099-12-31").endOf("day");
            if(formInfo.form_expire){
              linkExpireTime = moment();
              let form_expire_time = formInfo.form_expire_time.split(":");
              linkExpireTime.add((form_expire_time[0]!= ""?parseInt(form_expire_time[0]): 0), "hour");
              linkExpireTime.add((form_expire_time[1]!= ""?parseInt(form_expire_time[1]): 0),"minute");
            }
            //End of calculation link expire time

            let tokenInfo = {
              id: user.id,
              form_code: formInfo.form_code,
              form_name: formInfo.name,
              study_id: formInfo.study_id,
              linkExp: linkExpireTime.unix()
            }

            let survey_link = await authService.encryptPayload(tokenInfo);

            payload = {
              study_id: formInfo.study_id,
              user_id: user.id,
              form_code: formInfo.form_code,
              form_name: formInfo.name,
              has_dependency: formInfo.has_dependency,
              survey_link: survey_link,
              reminder: formInfo.reminder,
              form_expire: formInfo.form_expire,
              form_expire_time: formInfo.form_expire_time,
              form_expire_at: linkExpireTime.toDate(),
              form_sent:true,
              form_send_date:  Date(),
              scheduled_at: null,
              status: "Sent",
              form_mapping_status: 'active',
              assignee: null,
              arm_id: null,
              created_by: user.id,
              updated_by: user.id
            }

            await userManager.createUserFormMapping(payload);

            let surveyObj = {
              study_id: formInfo.study_id,
              form_code: formInfo.form_code,
              form_id: formInfo.id,
              user_id: user.id,
              taken_by: user.id,
              status: 'INITIATED',
              sync_status: 'PUSH_REQUIRED',
              created_by: user.id,
              updated_by: user.id
            }

            await surveyManager.createSurveyRecord(surveyObj);

            if(user.personal_email && user.personal_email.trim() != ""){
              payload = {
                user_id: user.id,
                email: user.personal_email,
                study_id: formDetails.study_id,
                form_name: formDetails.name,
                form_code: form_code,
                form_expire: details.form_expire,
                form_expire_time: details.form_expire_time,
                reminder: details.reminder,
                query: survey_link
              };
              if(formInfo.participant_facing) {
                //await cronJob.triggerMail(payload);
              }
            }
          }
        }
        next();
      }, async (err) => {
        if(err){
          console.log(err);
          return reject(err);
        }

        resolve();
      })
    } catch (error) {
      reject(error)
    }
  });
}

function verifyAllDependecies(form, user_id) {
  return new Promise(async (resolve, reject) => {
    try {
      let { dependencies = [], details } = form;
      form.verified = false;
      form.scheduledAt = null;
      if(details && details.has_dependency){
        let dependentFormCodes = _.uniqBy(_.map(dependencies, "dependent_form_code"))
        let searchQuery = {
          where: {
            form_code: {
              [Op.in]: dependentFormCodes
            },
            user_id
          },
          attributes: ["id", "form_code", "user_id", "created_at", "initiated_at", "completed_at"],
          include: [
            {
              model: SurveyDetails,
              where: {
                status: 'Active'
              },
              attributes: ["id", "variable_name", "answer", "verified"]
            }
          ]
        }


        let surveyInfo = await surveyManager.getSurveyList(searchQuery);


        //Fetching user form mapping information
        searchQuery = {
          where: {
            form_code: {
              [Op.in]: dependentFormCodes
            },
            user_id
          },

          attributes: ["id", "user_id", "form_code", "form_name", "has_dependency", "reminder", "form_expire", "form_expire_at", "scheduled_at", "consented_at", "form_send_date", "form_sent", "initiated_at", "completed_at", "status"],
        }

        let userFormMappingList = await userManager.getUserFormMappingList(searchQuery);
        if(!(surveyInfo && surveyInfo.length)){
          resolve(form);
        }
        surveyInfo.forEach(srvy => {
          let arr = []
           let userFormMappingInfo = __.findWhere(userFormMappingList, {"form_code": srvy.form_code});
            if(userFormMappingInfo){
              arr = [
                  { variable_name: "form_receive_date", answer: userFormMappingInfo.completed_at, verified: false },
                  { variable_name: "consent_date", answer: userFormMappingInfo.consented_at, verified: false },
                  { variable_name: "enrollment_date", answer: userFormMappingInfo.initiated_at, verified: false },
                  { variable_name: "form_sent_date", answer: userFormMappingInfo.form_send_date, verified: false }
                ]
            } else {
              arr = [
                { variable_name: "form_receive_date", answer: null, verified: false },
                { variable_name: "consent_date", answer: null, verified: false },
                { variable_name: "enrollment_date", answer: null, verified: false },
                { variable_name: "form_sent_date", answer: null, verified: false }
                ]
            }
          srvy.SurveyDetails = [...srvy.SurveyDetails, ...arr];
        })
        surveyInfo = _.groupBy(surveyInfo, "form_code");
        let conditionValid = true;
        let maxAddTime = null;
        let breakLoop = false;
        asyncLoop(dependencies, async (dependency, next)=>{
          if(breakLoop){
            return next();
          }
          let { values, variable_name, condition, label, dependent_form_code, operator, response_type } = dependency;
          let surveyResponse = surveyInfo[dependent_form_code][0] && surveyInfo[dependent_form_code][0].SurveyDetails.find(item => item.variable_name === variable_name);
          if(!(surveyResponse && surveyResponse.answer)){
            if(!condition || (condition && condition.toLowerCase() == "and")){
              conditionValid = false;
              breakLoop = true;
            }
            return next();
          }
          // to check if the condition is already verified
          if(!["DateTime", "Date"].includes(response_type) && surveyResponse.verified){
            return next();
          }
          let ans = surveyResponse.answer
          switch(response_type){
            case "DateTime":
            case "Date": {
              let value = null;
              if(operator === "Add Hours"){
                value = moment(ans).add(parseInt(values), "hours");
              }else{
                value = moment(values)
                if(!checkCondition({ans: moment(ans), value, operator, response_type})){
                  if(!condition || (condition && condition.toLowerCase() == "and")){
                    conditionValid = false;
                    breakLoop = true;
                  }
                  return next();
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
                if(!condition || (condition && condition.toLowerCase() == "and")){
                  conditionValid = false;
                  breakLoop = true;
                }
                return next();
              }
            }
            break;
            default: {
              conditionValid = false;
              breakLoop = true;
              return next();
            }
          }
          // update surveyDetails record with verified = true
          if(surveyResponse.id){
            searchQuery = {
              where: {
                id: surveyResponse.id
              }
            }
            let updateQuery = {
              verified: true,
            }
            await surveyManager.updateSuveyQuestionAnswer(searchQuery, updateQuery)
          }
          next();
        },
        function(err){
          if(err){
            conditionValid = false;
            breakLoop = true;
            return console.log(err);
          }
          if(conditionValid){
            form.verified = true;
            form.scheduledAt = maxAddTime ? maxAddTime.toDate() : null;
          }
          resolve(form);
        })
      }else{
        resolve(form)
      }
    } catch (error) {
      reject({ error })
    }
  })
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


/**
* This function is use for survey list
*/
module.exports.getSurveyList = async(req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let searchQuery = {
      where: {
        study_id: req.user.study_id || 1,
        status: 'COMPLETED'
      },
      include:[
        {
          model: Users,
          attributes: ['participant_id', 'UID']
        },
        {
          model: SurveyDetails,
          where: {
            status: 'Active'
          },
          attributes: ['form_code', 'form_group'],
          distinct: true,
        }
      ],
      order: [['id', 'DESC']]
    }

    let surveyList = await surveyManager.getSurveyList(searchQuery);
    surveyList = JSON.stringify(surveyList);
    surveyList = surveyList.replace(/\"User.participant_id\":/ig, '\"participant_id\":').replace(/\"Form.name\":/ig, '\"form_name\":');
    surveyList = JSON.parse(surveyList);
    res.status(200).json({success: true, data: surveyList});
  } catch (error) {
    res.status(409).json({success: false, message: error.message});
  }
}

/**
* This function is use for get specific survey details
*/
module.exports.getSurveyQuestionAnswer = async(req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    if(!req.query.query) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    let params = await authService.decryptPayload(req.query.query);

    let searchQuery = {
      where: {
        survey_id: params.survey_id,
        form_group: params.form_group,
        form_code: params.form_code
      },
      attributes: ['id', 'survey_id', 'question', 'variable_name', 'shared_question', 'value', 'answer', 'not_to_ans']
    }

    let surveyData = await surveyManager.getSurveyQuestionAnswer(searchQuery);
    res.status(200).json({success: true, data: surveyData});
  } catch (error) {
    res.status(409).json({success: false, message: error.message});
  }
}


module.exports.pushRecords = async(req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }
    let params = await authService.decryptPayload(req.body.payload);
    if(!(params && params.length > 0)) {
      return res.status(406).json({success: false, message: 'Request data missing'});
    }

    let data = await getSurveyQuesAns({ survey_ids: params });
    let fileName = `bundle_${moment().format('YYYY-MM-DDThh:mm:ss-ssss')}.json`;
    await fileService.createFileOnLocal(`${__dirname}/../uploads/${fileName}`, new Buffer.from(JSON.stringify(data)));
    let fileUrl = await dataExchangeService.uplaodFileOnBlob(process.env.BLOB_FHIR_CONTAINER, fileName);
    await fileService.deleteFileFromLocal(`${__dirname}/../uploads/${fileName}`);

    fileUrl = `${process.env.BLOB_SERVICE_URL}/${process.env.BLOB_FHIR_CONTAINER}/${fileName}`;

    let searchQuery = {
      where: {
        id: {[Op.in]: params}
      }
    };
    let updateQuery = {
      sync_status: 'PUSHED',
    };

    await surveyManager.updateSurveyRecord(searchQuery, updateQuery);
    res.status(200).json({success: true, message: 'Records Pushed Successfully', data: fileUrl });
  } catch (error) {
    res.status(409).json({success: false, message: error.message});
  }
}


/**
 * This function is use for fetching survey pushed records
 */
 module.exports.getPushedRecords = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let pushedCount = await Survey.count({ where: { status: 'PUSHED' } });
    let totalCount = await Survey.count({});
    let data = {
      pushed: pushedCount,
      totalRecords: totalCount,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};


/**
 * This function is use for fetching survey feedback
 */
 module.exports.getFeedback = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let query = {
      attributes: ['average_rating', [sequelize.fn('count', sequelize.col('average_rating')), 'cnt']],
      order: [['average_rating', 'DESC']],
      group: ['average_rating'],
    };
    let stars = [5,4,3,2,1];
    let feedbackData = await feedbacksManager.getFeedbacks(query);
    feedbackData = stars.map(item => {
      let feed = feedbackData.find(feeds => feeds.dataValues.average_rating === item)
      return feed ? feed.dataValues : { average_rating: item, cnt: 0 }
    })
    let TotalResponses = feedbackData.reduce((feeds, item) => feeds + parseInt(item.cnt), 0);
    let responseObject = {
      TotalResponses,
      avgStars: Math.round(
        feedbackData.reduce((feeds, item) => {
          return feeds + item.average_rating * parseInt(item.cnt);
        }, 0) / TotalResponses
      ),
      allStars: feedbackData,
    };
    res.status(200).json({ success: true, data: responseObject });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};


module.exports.getBundle = async (req, res) => {
  try {
    let params = await authService.decryptPayload(req.query.query);
    if(!params || (params && !params.ids)){
      return res.status(500).json({ success: false, message: 'Ids can not be empty'});
    }

    let data = await getSurveyQuesAns({ survey_ids: params.ids });
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message || error });
  }
}

/**
* This function is use for to get the eICF details
**/
module.exports.getEICFDetails = async (req, res) => {
  if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
    return res.status(403).json({ success: false, message: `You don't have these rights.` });
  }

  if(!req.query.query) {
    return res.status(406).json({success: false, message: 'Request payload missing'});
  }

  try {
      let params = await authService.decryptPayload(req.query.query);

      if(appService.isStringEmptyOrSpaces(params.form_code)){
        return res.status(409).json({success: false, message: 'Request information is missing'});
      }

      //Checking direct mapped form information
      let version = params.version;
      let searchQuery = {
        where: {
          form_group: params.form_group,
          form_code: params.form_code,
          user_id: params.user_id
        }
      }

      let userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
      if(userSurveyRecord) {
        version = userSurveyRecord.version;
      }

      //If direct form not found then search for eICF attached with survey forms
      //Checking survey eICF1
      if(!userSurveyRecord) {
        searchQuery = {
          where: {
            eICFCode1: params.form_code,
            user_id: params.user_id
          }
        }

        userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
        version = userSurveyRecord.eICFVersion1;
      }

      //Checking survey eICF2
      if(!userSurveyRecord) {
        searchQuery = {
          where: {
            eICFCode2: params.form_code,
            user_id: params.user_id
          }
        }

        userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
        version = userSurveyRecord.eICFVersion2;
      }

      //Checking survey eICF3
      if(!userSurveyRecord) {
        searchQuery = {
          where: {
            eICFCode3: params.form_code,
            user_id: params.user_id
          }
        }

        userSurveyRecord = await userManager.getUserFormMapping(searchQuery);
        version = userSurveyRecord.eICFVersion3;
     }

      searchQuery = {
        where: {
          form_code: params.form_code,
          form_group: params.form_group,
          version: version
          //status: 'Published'
        },
        attributes:['id', 'study_id', 'form_code', 'form_group','category', 'name', 'language', 'version', 'event_name', 'status', 'description','has_dependency','days_reminder', 'days', 'hours_reminder', 'hours','form_expire', 'form_expire_time', 'participant_facing', 'disclaimer', 'created_at', 'updated_at'],
        include:[
            {
                model: Users,
                attributes: ['id', 'first_name', 'last_name', 'participant_id']
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
                    attributes: ['id', 'form_id', 'questions_id', 'response_type','attribute_edited', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time'],
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

      let result = {}
      result.eicfDetails = await eICFFormManager.getEICFFormsList(searchQuery);

      if(result.eicfDetails && result.eicfDetails.length > 0) {
        await geteICFSignature(result.eicfDetails, params)
      }

      searchQuery = {
        where: {
          survey_id: params.survey_id,
          form_code: params.form_code,
          form_group: params.form_group,
        },
        attributes: ['id', 'survey_id', 'question', 'variable_name', 'shared_question', 'value', 'answer', 'not_to_ans']
      }

      result.surveyData = await surveyManager.getSurveyQuestionAnswer(searchQuery);
      return res.status(200).json({success : true, message: 'Data found', data: result});
  } catch (err) {
    console.log(err);
    return res.status(400).json({success: false, message: err.message});
  }
}

/**
* This function is use for to generate ICF signature image blob token
**/
function geteICFSignature(eicfDetails, params) {
  return new Promise((resolve, reject) => {
    asyncLoop(eicfDetails, async (eICFData, next) => {
      searchQuery = {
        where: {
          eICF_code: eICFData.form_code,
          user_id: params.user_id || 1
        }
      }

      let icfSignatureImageData = await eICFFormManager.getImage(searchQuery);
      let imageURL = (icfSignatureImageData && icfSignatureImageData.image_path) || '';
      if(imageURL){
        let fileName = imageURL.split("/")[imageURL.split("/").length-1];
        let signatureToken = await blobService.generateSignatureToken(process.env.BLOB_CONTAINER, process.env.BLOB_SIGNATURE_DIR, fileName);
        eICFData.signatureUrl = `${imageURL}?${signatureToken}`;
      }

      next();
    }, function(err){
      if(err) {
        console.log(err);
      }
      resolve();
    });
  });
}
