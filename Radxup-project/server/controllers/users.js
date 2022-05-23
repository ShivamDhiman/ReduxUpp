const moment = require('moment');
const sequelize = require('sequelize');
const _ = require('underscore');
const asyncLoop = require('node-async-loop');
const validator = require('../lib/validator');
const enums = require('../lib/enums');
const authService = require('../services/authService');
const appService = require('../services/appService');
const emailService = require('../services/emailService');
const userManager = require('../data/managers/users');
const formsManager = require('../data/managers/forms');
const eICFManager = require('../data/managers/eICFForm');
const surveyManager = require('../data/managers/survey');
const { Survey } = require('../data/models/survey');
const { Study } = require('../data/models/study');
const { Users } = require('../data/models/users');
const { Arms } = require('../data/models/arms');
const studyManager = require('../data/managers/study');
const { UserFormMapping } = require('../data/models/userFormMapping');
const surveyCtrl = require('./survey');
const { date } = require('joi');
const PARAMSTYPE = enums.PARAMSTYPE;
const ROLES = enums.ROLES;
const Op = sequelize.Op;

/**
* This function is use for register user
*/
module.exports.initiateRegistration = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateRegisterPayload(params);
    if (validationResult.error) {
      return res.status(400).json({ success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
    }
    let userProfile = params;
    userProfile = await createParticipantAccount(params, req.user);

    let searchQuery = {
      where: {
        user_id: userProfile.id,
        form_code: params.form_code
      }
    }

    let surveyInfo = await surveyManager.getSurveyRecord(searchQuery);
    res.status(200).json({ success: true, message: 'Participant successfully added', survey_id: surveyInfo.id});
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error });
  }
};

/**
* This function is use for create participant account
*/
function createParticipantAccount(params, loggedInUser) {
  return new Promise(async (resolve, reject) => {
    try {
      if(params.sendEmailNow == 'true' || params.sendEmailNow == true){
        params.sendEmailNow = true;
      } else {
        params.sendEmailNow = false;
      }

      let searchQuery = {
        where: {
          personal_email: params.personal_email
        }
      }

      if(params.participant_id) {
        let isDuplicateParticipantId = await checkDuplicateParticipantID(params.participant_id);
        if(isDuplicateParticipantId) {
          return reject('Duplicate participant ID');
        }
      }

      let payload = {
        first_name: params.first_name,
        last_name: params.last_name,
        personal_email: params.personal_email,
        mobile_phone: params.mobile_phone || parseInt(params.mobile_phone) || null,
        participant_id: params.participant_id,
        role_id: parseInt(ROLES.PARTICIPANT),
        study_id: params.study_id,
        arm: params.arm_id,
        status: 'Registered',
        UID: appService.generateUUID(),
        created_by: loggedInUser.id,
        updated_by: loggedInUser.id
      };

      let userProfile = await userManager.createUserProfile(payload);
      params.user_id = userProfile.id;
      payload = {
        user_id: params.user_id,
        study_id: params.study_id,
        status: 'Active',
        created_by: loggedInUser.id,
        updated_by: loggedInUser.id
      };

      await userManager.createUserStudyMapping(payload);
      let userFormMappingInfo = await verifyDuplicateParticipant(params);
      if(userFormMappingInfo) {
        return reject('Participant already associated with this form');
      }

      let formInfo;
      if(params.form_group == 'Form'){
        formInfo = await formsManager.getForms ({where:{language: 'English', form_code: params.form_code, 'status': 'Published'}});
      } else {
        formInfo = await eICFManager.getEICFForm({where:{language: 'English', form_code: params.form_code, 'status': 'Published'}});
      }


       //Calculate link expire time
      let linkExpireTime = moment("2099-12-31").endOf("day");
      if(formInfo.form_expire){
        linkExpireTime = moment();
        linkExpireTime.add(parseInt(formInfo.form_expire_time), "day");
      }

       //End of calculation link expire time
      let tokenInfo = {
        id: params.user_id,
        form_code: params.form_code,
        form_name: params.form_name,
        version: formInfo.version,
        form_group: formInfo.form_group,
        study_id: params.study_id,
        linkExp: linkExpireTime.unix()
      }

       params.query = await authService.encryptPayload(tokenInfo);
       if(params.sendEmailNow != false) {
         let searchQuery = {
           where: {
             id: params.study_id
           }
         }

         let studyDetails = await studyManager.getStudyDetails(searchQuery);
         params.study_name = studyDetails.name;
         if(params.personal_email && params.personal_email.trim() != "" && formInfo.participant_facing === true) {
           await appService.initiateEmailProcess(params);
         }
       }

      if(!userFormMappingInfo) {

        let reminderAt;
        let sendReminder = false;
        if(formInfo.days_reminder || formInfo.hours_reminder){
          sendReminder = true;
          reminderAt = moment();
          if(formInfo.hours > 0){
            reminderAt.add(parseInt(formInfo.hours), "hours");
          }
          if(formInfo.days > 0){
            reminderAt.add(parseInt(formInfo.days), "days");
          }
        }

        if(reminderAt) {
          reminderAt = reminderAt.toDate();
        }

        payload = {
          study_id: params.study_id,
          user_id: params.user_id,
          form_code: formInfo.form_code,
          form_name: formInfo.name,
          form_group: formInfo.form_group,
          category: formInfo.category,
          version: formInfo.version,
          event_name: formInfo.event_name,
          participant_facing: formInfo.participant_facing || true,
          has_dependency: formInfo.has_dependency,
          sendEmailNow: (params.sendEmailNow? params.sendEmailNow: true),
          eICFName1: (formInfo.form_group == "Form"? formInfo.eICFName1: ""),
          eICFVersion1: (formInfo.form_group == "Form"? formInfo.eICFVersion1: ""),
          eICFCode1: (formInfo.form_group == "Form"? formInfo.eICFCode1: ""),
          eICFName2: (formInfo.form_group == "Form"? formInfo.eICFName2: ""),
          eICFVersion2: (formInfo.form_group == "Form"? formInfo.eICFVersion2: ""),
          eICFCode2: (formInfo.form_group == "Form"? formInfo.eICFCode2: ""),
          eICFName3: (formInfo.form_group == "Form"? formInfo.eICFName3: ""),
          eICFVersion3: (formInfo.form_group == "Form"? formInfo.eICFVersion3: ""),
          eICFCode3: (formInfo.form_group == "Form"? formInfo.eICFCode3: ""),
          survey_link: params.sendEmailNow?params.query: null,
          reminder: sendReminder,
          hours_reminder: formInfo.hours,
          days_reminder: formInfo.days,
          reminder_scheduled_at: reminderAt || null,
          form_expire: formInfo.form_expire,
          form_expire_days: formInfo.form_expire_time,
          form_expire_at: params.sendEmailNow? linkExpireTime.toDate(): null,
          form_sent: params.sendEmailNow? true: false,
          form_send_date: params.sendEmailNow? Date(): null,
          scheduled_at: null,
          status: params.sendEmailNow?"Sent": "Link not Sent",
          form_mapping_status: 'active',
          assignee: params.assignee || null,
          arm_id: params.arm_id || null,
          created_by: loggedInUser.id,
          updated_by: loggedInUser.id
        }

        await userManager.createUserFormMapping(payload);
      }

      params.taken_by = 'PARTICIPANT';
      params.version = formInfo.version;
      params.category = formInfo.category;
      params.participant_facing = formInfo.participant_facing || true;
      params.has_dependency = formInfo.has_dependency;

      await surveyCtrl.createSurveyRecord(params, loggedInUser);

      let auditPayload = {
        message: `Participant added on ${params.form_name} form with email id ${params.personal_email}`,
        user_id: loggedInUser.id,
        personal_email: loggedInUser.personal_email,
        study_id: params.study_id
      }
      await appService.addLog(auditPayload);
      resolve(userProfile);
    } catch (error) {
      reject(error);
    }
  });
}

/**
* This function is use for to check duplicate participant ID
*/
function checkDuplicateParticipantID(participant_id) {
  return new Promise(async (resolve, reject) => {
    let flag = false;
    let searchQuery = {
      where: {
        participant_id: participant_id
      }
    }
    let userProfile = await userManager.getUserProfile(searchQuery);
    if(userProfile) {
      flag = true;
    }
    resolve(flag);
  });
}

/**
* This function is use for to verify duplicate Participant mapping with same form
*/
function verifyDuplicateParticipant(params) {
  return new Promise(async (resolve, reject) => {
    let flag = false;
    let searchQuery = {
      where: {
        form_group: params.form_group,
        form_code: params.form_code,
        user_id: params.user_id
      }
    }

    let userFormMapping = await userManager.getUserFormMapping(searchQuery);
    resolve(userFormMapping);
  });
}


/**
* This function is use for to create participant account
*/
module.exports.addParticipant = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateParticipantPayload(params);

    if (validationResult.error) {
      return res.status(400).json({success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
    }

    if(!params.form_code){
      return res.status(409).json({status: false, message: 'You are not associated with any active survey'});
    }

    let payload = {
      role_id: parseInt(ROLES.PARTICIPANT),
      status: 'ANONYMOUS',
      initiated_by: 'PARTICIPANT',
      is_anonymous_user: params.isAnonymousUser || false,
      study_id: params.study_id,
      UID: appService.generateUUID()
    };

    let auditPayload = {
      message: `Anonymous participant added on form ${params.form_name}`,
      personal_email: 'Anonymous',
      user_id: null,
      study_id: params.study_id
    }

    if (!params.isAnonymousUser) {
      payload = {
        first_name: params.first_name,
        last_name: params.last_name,
        personal_email: params.personal_email,
        mobile_phone: parseInt(params.mobile_phone) || null,
        role_id: parseInt(ROLES.PARTICIPANT),
        status: 'Registered',
        initiated_by: 'PARTICIPANT',
        UID: appService.generateUUID()
      }
      auditPayload.message = `Participant added on form ${params.form_name} with email id ${params.personal_email}`;
    }
    let searchQuery = {}
    let userProfile = await userManager.createUserProfile(payload);
    await appService.addLog(auditPayload);

    payload = {
      user_id: userProfile.id,
      study_id: params.study_id,
      status: 'Active',
      created_by: userProfile.id,
      updated_by: userProfile.id
    };

    await userManager.createUserStudyMapping(payload);

    let formInfo;
    if(params.form_group == 'Form'){
      formInfo = await formsManager.getForms ({where:{language: 'English', form_code: params.form_code, 'status': 'Published'}});
    } else {
      formInfo = await eICFManager.getEICFForm({where:{language: 'English', form_code: params.form_code, 'status': 'Published'}});
    }

    if(!formInfo) {
      return res.status(409).json({status: false, message: 'Survey form details not found'});
    }

    params.user_id = userProfile.id;
    params.taken_by = 'PARTICIPANT';
    params.category = formInfo.category;
    params.version = formInfo.version;
    let surveyInfo = await surveyCtrl.createSurveyRecord(params, userProfile);

    let sendReminder = false;
    let reminderAt;
    if(formInfo.days_reminder || formInfo.hours_reminder){
      sendReminder = true;
      reminderAt = moment();
      if(formInfo.hours > 0){
        reminderAt.add(parseInt(formInfo.hours), "hours");
      }
      if(formInfo.days > 0){
        reminderAt.add(parseInt(formInfo.days), "days");
      }
    }

    if(reminderAt) {
      reminderAt = reminderAt.toDate();
    }

    payload = {
      study_id: params.study_id,
      user_id: userProfile.id,
      form_code: formInfo.form_code,
      form_name: formInfo.name,
      form_group: formInfo.form_group,
      category: formInfo.category,
      version: formInfo.version,
      participant_facing:formInfo.participant_facing,
      has_dependency: formInfo.has_dependency,
      sendEmailNow: (params.sendEmailNow? params.sendEmailNow: true),
      eICFName1: (formInfo.form_group == "Form"? formInfo.eICFName1: ""),
      eICFVersion1: (formInfo.form_group == "Form"? formInfo.eICFVersion1: ""),
      eICFCode1: (formInfo.form_group == "Form"? formInfo.eICFCode1: ""),
      eICFName2: (formInfo.form_group == "Form"? formInfo.eICFName2: ""),
      eICFVersion2: (formInfo.form_group == "Form"? formInfo.eICFVersion2: ""),
      eICFCode2: (formInfo.form_group == "Form"? formInfo.eICFCode2: ""),
      eICFName3: (formInfo.form_group == "Form"? formInfo.eICFName3: ""),
      eICFVersion3: (formInfo.form_group == "Form"? formInfo.eICFVersion3: ""),
      eICFCode3: (formInfo.form_group == "Form"? formInfo.eICFCode3: ""),
      survey_link: null,
      reminder: sendReminder,
      hours_reminder: formInfo.hours,
      days_reminder: formInfo.days,
      reminder_scheduled_at: reminderAt || null,
      form_expire: formInfo.form_expire,
      form_expire_days: formInfo.form_expire_time,
      form_expire_at: Date(),
      form_sent:true,
      form_send_date:  Date(),
      initiated_at: Date(),
      scheduled_at: null,
      status:  'Started',
      form_mapping_status: 'active',
      assignee: null,
      arm_id: null,
      created_by: userProfile.id,
      updated_by: userProfile.id
    }


    await userManager.createUserFormMapping(payload);
    let token = authService.generateAuthToken(userProfile);

    return res.status(200).json({success: true, message: 'Participant profile successfully created', token: token, user_id: userProfile.id, survey_id: surveyInfo.id});
  } catch (error) {
    console.log(error);
    return res.status(406).json({success: false, message: error.message});
  }
};

/**
* This function is use for update user profile
*/
module.exports.updateUserProfile = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.PARTICIPANT, ROLES.STUDY_COORDINATOR, ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }
    let params = await authService.decryptPayload(req.body.payload);
    const validationResult = validator.validateRegisterPayload(params);

    if (validationResult.error) {
      return res.status(400).json({success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
    }

    let searchQuery = {
      where: {
        id: params.id
      }
    };

    let userProfile = await userManager.getUserProfile(searchQuery);
    if (!userProfile) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (userProfile && userProfile.role_id !==3) {
      return res.status(400).json({ success: false, message: `You don't have these rights.`});
    }

    if(params.participant_id) {
      let isDuplicateParticipantId = await checkDuplicateParticipantID(params.participant_id);
      if(isDuplicateParticipantId) {
        return res.status(400).json({ success: false, message: 'Duplicate participant ID'});
      }
    }

    if(userProfile.status == 'ANONYMOUS' && params.isAnonymousUser == false) {
      userProfile.status = 'Registered';
    }

    let payload = {
      first_name: params.first_name,
      last_name: params.last_name,
      participant_id: params.participant_id,
      mobile_phone: parseInt(params.mobile_phone) || null,
      personal_email: params.personal_email,
      status: userProfile.status
    };

    searchQuery = {
      where: {
        id: params.id
      }
    };

    await userManager.updateUserProfile(payload, searchQuery);

    if(params.assignee || params.arm_id){
      searchQuery = {
        where: {
          user_id: params.id,
          form_code: params.form_code
        }
      }

      let userFormMappingInfo = await userManager.getUserFormMapping(searchQuery);

      if(userFormMappingInfo && (userFormMappingInfo.assignee != params.assignee || userFormMappingInfo.arm_id != params.arm_id)){
        payload = {
          assignee: params.assignee,
          arm_id: params.arm_id
        }
        await userManager.updateUserFormMapping(searchQuery, payload);
      }
    }

    return res.status(200).json({ success: true, message: 'User profile successfully updated'});
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
* This function is use for deRegistered a participant from specific form
*/
module.exports.deRegisteredParticipant = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let searchQuery = {
      where: {
        user_id: params.id,
        form_code: params.form_code
      }
    }

    let payload = {
      form_mapping_status: 'inactive'
    };

    await userManager.updateUserFormMapping(searchQuery, payload);

    let auditPayload = {
      message: `Participant deregistered`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: req.user.study_id
    }

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Participant successfully deregistered' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
* This function is use for resend survey link to participant
*/
module.exports.resendSurvey = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);

    let searchQuery = {
      where: {
        personal_email: params.personal_email,
      },
      attributes: ['id', 'UID', 'first_name', 'last_name', 'personal_email', 'mobile_phone', 'participant_id', 'status'],
      include: [
        {
          model: UserFormMapping,
          where: {'form_code': params.form_code},
          attributes: ['form_name', 'form_group', 'form_code', 'form_expire', 'form_expire_days', 'status'],
        },
        {
          model: Survey,
          where: {'form_code': params.form_code},
          attributes: ['user_id', 'form_code', 'study_id'],
        }
      ],
      raw: true
    };

    let userProfile = await userManager.getUserProfile(searchQuery);

    if (!userProfile) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    userProfile = JSON.stringify(userProfile);
    userProfile = userProfile.replace(/\"UserFormMappings.form_name\":/ig, '\"form_name\":').replace(/\"UserFormMappings.form_group\":/ig, '\"form_group\":').replace(/\"UserFormMappings.form_code\":/ig, '\"form_code\":').replace(/\"UserFormMappings.form_expire\":/ig, '\"form_expire\":').replace(/\"UserFormMappings.form_expire_time\":/ig, '\"form_expire_time\":').replace(/\"UserFormMappings.status\":/ig, '\"survey_status\":').replace(/\"Surveys.study_id\":/ig, '\"study_id\":');
    userProfile = JSON.parse(userProfile);

    if (userProfile.survey_status === 'Completed') {
      return res.status(409).json({ success: false, message: 'Survey already completed' });
    }


    if(appService.isStringEmptyOrSpaces(userProfile.personal_email)){
      return res.status(409).json({ success: false, message: 'Email Id is missing.' });
    }

    //Calculate link expire time
    let linkExpireTime = moment("2099-12-31").endOf("day");
    if(userProfile.form_expire){
      linkExpireTime = moment();
      linkExpireTime.add(parseInt(userProfile.form_expire_time), "day");
    }
    //End of calculation link expire time

    let tokenInfo = {
      id: userProfile.id,
      personal_email: userProfile.personal_email,
      form_code: userProfile.form_code,
      form_name: userProfile.form_name,
      form_group: userProfile.form_group,
      study_id: userProfile.study_id,
      linkExp: linkExpireTime.unix()
    }

    userProfile['survey_link'] = await authService.encryptPayload(tokenInfo);
    userProfile.query = userProfile.survey_link;

    await appService.initiateEmailProcess(userProfile);

    searchQuery = {
      where:{
        'user_id': userProfile.id,
        'form_code': userProfile.form_code
      }
    }

    let updateQuery = {
      'survey_link': userProfile.survey_link,
      'form_expire_at': linkExpireTime.toDate(),
      'form_send_date': new Date(),
      'form_sent': true,
      'status': 'Sent'
    }

    await userManager.updateUserFormMapping(searchQuery, updateQuery);

    res.status(200).json({ success: true, message: 'Survey link resent to participant' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
* This function is use for to fetch all users
*/
module.exports.getUsersList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let searchQuery = {
      where: {
        study_id: req.user.study_id,
        form_mapping_status: 'active',
        has_dependency: false
      },
      attributes: ['form_name', 'form_code', 'form_group', 'status', 'initiated_at', 'completed_at', 'form_send_date', 'scheduled_at', 'form_expire_at'],
      include: [
        {
          model: Arms,
          attributes: ['id', 'name']
        },
        {
          model: Users,
          key: "assignee",
          as: "assigneeInfo",
          attributes: ['id', 'first_name', 'last_name', 'personal_email']
        },
        {
          model: Users,
          attributes: ['id', 'UID', 'first_name', 'last_name', 'personal_email', 'mobile_phone', 'participant_id', 'status', 'created_at', 'updated_at'],
          include: {
            model: UserFormMapping,
            attributes: ['id', 'form_name', 'form_name', 'form_code', 'form_group','status', 'initiated_at', 'completed_at', 'form_send_date', 'scheduled_at', 'form_expire_at']
          }
        }
      ],
      raw: false,
      order: [
        ['id', 'DESC'],
        [{ model: Users},  {model: UserFormMapping},"id", 'ASC']
      ]
    };

    if(req.query.userFormMappingType && req.query.userFormMappingType === 'all') {
      delete searchQuery.where.has_dependency;
    }

    let users = await userManager.getUserFormMappingList(searchQuery);
    let response = [];
    users = JSON.parse(JSON.stringify(users))
    users.forEach(user => {
      user['id'] = user.User.id;
      user['UID'] = user.User.UID;
      user['first_name'] = user.User.first_name;
      user['last_name'] = user.User.last_name;
      user['personal_email'] = user.User.personal_email;
      user['mobile_phone'] = user.User.mobile_phone;
      user['participant_id'] = user.User.participant_id;
      user['journey'] = user.User.status;
      user['created_at'] = user.User.created_at;
      user['updated_at'] = user.User.updated_at;
      user['surveys'] = user.User.UserFormMappings;
      //Current form information
      user['survey_id'] =  user.User.UserFormMappings[user.User.UserFormMappings.length - 1].id;
      user['current_form_status'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].status;
      user['current_form_name'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].form_name;
      user['form_name'] = user.form_name;
      user['form_code'] = user.form_code;
      //user['status'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].status;
      user['initiated_at'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].initiated_at;
      user['completed_at'] =  user.User.UserFormMappings[user.User.UserFormMappings.length - 1].completed_at;
      user['form_send_date'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].form_send_date;
      user['scheduled_at']= user.User.UserFormMappings[user.User.UserFormMappings.length - 1].scheduled_at;
      user['form_expire_at'] = user.User.UserFormMappings[user.User.UserFormMappings.length - 1].form_expire_at;
      //End of current form information
      user['forms_completed'] = _.filter(user.User.UserFormMappings, (obj)=> { return obj.completed_at != null}).length;
      user['status'] = _.filter(user.User.UserFormMappings, (obj)=> { return obj.form_code == user.form_code})[0].status;
      delete user.User;
      response.push(user);
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
* This function is use for to fetch user profile
*/
module.exports.getUsersProfile = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN, ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let searchQuery = {
      where: {
        id: req.user.id
      },
      attributes: ['id', 'first_name', 'last_name', 'role_id'],
      include: [{
        model:  Study,
        attributes: ['id', 'name']
      }],
      raw: true
    }

    let userProfile = await userManager.getUserProfile(searchQuery);
    if (!userProfile) {
      return res.status(409).json({ status: false, message: 'User not found' });
    }
    userProfile = JSON.stringify(userProfile);
    userProfile = userProfile.replace(/\"Study.id\":/ig, '\"study_id\":').replace(/\"Study.name\":/ig, '\"study_name\":');
    userProfile = JSON.parse(userProfile);

    userProfile = await authService.encryptPayload(userProfile);
    res.status(200).json({status: true, data: userProfile});
  } catch (err) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
}


/**
* This function is use for to fetch user details
*/
module.exports.getUserDetails = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    let user_id = parseInt(req.query.id);
    let form_code = req.query.form_code;
    let form_group = req.query.form_group;
    let searchQuery = {
      where: {
        id: user_id
      },
      attributes: ['id', 'first_name', 'last_name', 'participant_id', 'personal_email', 'mobile_phone', 'is_anonymous_user'],
      include:[
        {
          model: UserFormMapping,
          attributes: ['id', 'form_name', 'form_code', 'form_group', 'status', 'initiated_at', 'completed_at', 'form_send_date', 'scheduled_at', 'form_expire_at', 'consented_at']
        }
      ],
      order:
        [
          ["id"],
          ["UserFormMappings","id"]
        ],
    }

    let userProfile = await userManager.getUserProfile(searchQuery);
    if(!userProfile) {
      return res.status(409).json({success: false, message: 'Participant details not found'})
    }

    searchQuery = {
      where: {
        'user_id': user_id,
        'form_code': form_code,
        'form_group': form_group
      },
      include:[
        {
          model: Users,
          key: "assignee",
          as: "assigneeInfo",
          attributes: ['id', 'first_name', 'last_name', 'personal_email']
        },
        {
          model: Arms,
          attributes: ['id', 'name']
        }
      ]
    }
    let formsData = await userManager.getUserFormMapping(searchQuery);

    // //Checking eICF1
    // if(!formsData) {
    //   searchQuery.where = {
    //     'user_id': user_id,
    //     eICFCode1 :form_code
    //   }

    //   formsData = await userManager.getUserFormMapping(searchQuery);
    // }

    // //Checking eICF2
    // if(!formsData) {
    //   searchQuery.where = {
    //     'user_id': user_id,
    //     eICFCode2 :form_code
    //   }

    //   formsData = await userManager.getUserFormMapping(searchQuery);
    // }

    // //Checking eICF3
    // if(!formsData) {
    //   searchQuery.where = {
    //     'user_id': user_id,
    //     eICFCode3 :form_code
    //   }

    //   formsData = await userManager.getUserFormMapping(searchQuery);
    // }

    userProfile.dataValues['assigneeInfo'] = formsData.assigneeInfo;
    userProfile.dataValues['arm'] = formsData.Arm;
    let surveyData = _.sortBy(JSON.parse(JSON.stringify(userProfile.dataValues.UserFormMappings)), 'id').reverse();
    surveyData = surveyData.reverse()
    for(let i=0; i<surveyData.length; i++) {
      if(surveyData[i].consented_at !== null) {
        userProfile.dataValues['consented_at'] = surveyData[i].consented_at;
        break;
      }
    }

    let userMappedForms = userProfile.dataValues.UserFormMappings;
    let formList = await getFormData(userMappedForms);
    userProfile.dataValues.UserFormMappings = formList;

    let surveyList = JSON.parse(JSON.stringify(userProfile.dataValues.UserFormMappings));

    userProfile = JSON.stringify(userProfile);
    userProfile = userProfile.replace(/\"UserFormMappings\":/ig, '\"formData\":');
    userProfile = JSON.parse(userProfile);
    res.status(200).json({status: true, data: userProfile});
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
}

function getFormData(userMappedForms) {
  let formList = [];
  return new Promise((resolve, reject) => {
    asyncLoop(userMappedForms, async(formDetail, next) => {

      let searchQuery = {
        where: {
          form_code: formDetail.form_code
        },
        attributes: ['name']
      }
      let formData;
      if(formDetail.form_group == 'Form'){
        formData = await formsManager.getForms(searchQuery);
      } else {
        formData = await eICFManager.getEICFForm(searchQuery);
      }
      formDetail.dataValues['form_name'] = formData.name;
      formList.push(formDetail);
      next();
    },
    function(err){
      if(err) {
        console.log(err);
      }

      resolve(formList)
    });
  });
}

/**
* This function is use for to fetch admin user details
*/
module.exports.getManagerUsersList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let searchQuery = {
      where: {
        role_id: [1,2],
        study_id: req.user.study_id
      },
      attributes: ['id', 'first_name', 'last_name', 'role_id', 'personal_email', 'status'],
      raw: false,
      order: [
        ['id', 'DESC']
      ]
    }

    let users = await userManager.getUsersList(searchQuery);
    res.status(200).json({status: true, data: users});
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
* Temp API function for generate token
*/
module.exports.generateToken = async (req, res) => {
  let searchQuery = {
     where: {
       personal_email: req.body.email,
       status: {
         [Op.ne]: 'Inactive'
       }
     }
  };
  let userProfile = await userManager.getUserProfile(searchQuery);
  if(userProfile) {
    //Other than Super Admin
    if(userProfile.role_id != 4) {
      searchQuery = {
        where: {
          id: userProfile.study_id
        },
        attributes: ['id']
      }

      let studyStatus = await studyManager.getStudyDetails(searchQuery);
      if(!studyStatus) {
        return res.status(409).json({status: false, message: 'You are not part of the live study'});
      }
    }
    let token = authService.generateAuthToken(userProfile);
    res.status(200).json({status: true, token: token})
  } else {
    res.status(200).json({status: false, message: 'Getting error while generating token'})
  }
}
