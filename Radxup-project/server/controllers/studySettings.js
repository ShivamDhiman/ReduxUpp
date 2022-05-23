const asyncLoop = require('node-async-loop');
const uuid = require('uuid');
const studyManager = require('../data/managers/study');
const formEmailMappingManager = require('../data/managers/formEmailMapping')
const authService = require('../services/authService');
const appService = require('../services/appService');
const enums = require('../lib/enums');
const validator = require('../lib/validator');
const PARAMSTYPE = enums.PARAMSTYPE;
const EMAILTEMPLATE = enums.EMAILTEMPLATE;
const ROLES = enums.ROLES;

const { Users } = require('../data/models/users');

/**
 * This function is use for update study content
 */
module.exports.updateStudyContent = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN, ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateStudyContentParams(params);

    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`,
      });
    }

    let searchQuery = {
      where: {
        id: params.study_id
      }
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study not found' });
    }

    let updateQuery = {
      description: params.description,
      registration_description: params.registration_description || studyDetails.registration_description,
      feedback_description: params.feedback_description || studyDetails.feedback_description,
      updated_by: req.user.id,
      updated_at: Date.now()
    };

    await studyManager.updateStudy(updateQuery, searchQuery);

    let auditPayload = {
      message: `${studyDetails.name} email template updated`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: params.id
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Email template is successfully updated' });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
}


/**
 * This function is use for create study temaplates
 */
module.exports.createStudyEmailTemplate = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN, ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let searchQuery = {
      where: {
        id: params.study_id
      }
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study not found' });
    }

    if(!params.templateObjects || params.templateObjects.length <= 0) {
      return res.status(409).json({ success: false, message: 'Email template details missing in request payload'});
    }

    let templateObjects = params.templateObjects;
    await validateEmailTemplaetParams(templateObjects);

    let payload = [];
    let email_code = uuid.v1({msecs: Date.now()});
    templateObjects.forEach((template) => {
      payload.push({
        study_id: params.study_id,
        email_code: email_code,
        version: template.version || 'Version 1',
        name: template.name,
        subject: template.subject,
        header: template.header,
        body_content: template.body_content,
        language: template.language || 'English',
        created_by: req.user.id,
        updated_by: req.user.id
      })
    });

    await studyManager.createBulkEmailTemplate(payload);
    let auditPayload = {
      message: `${params.templateObjects[0].name} email template created`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: params.study_id
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study content successfully updated' });
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
}

function validateEmailTemplaetParams(params) {
  return new Promise((resolve, reject) => {
    asyncLoop(params, (templateParams, next) => {
      let validationResult = validator.validateStudyEmailTemplateParams(templateParams);

      if (validationResult.error) {
        return reject({message: `Please enter valid ${EMAILTEMPLATE[validationResult.error.details[0].context.key]}`});
      }

      next();
    },
    function(err) {
      if(err) {
        console.log(err);
        return reject(err)
      }

      resolve();
    });
  });
}

/**
 * This function is use for create study temaplates
 */
module.exports.deleteStudyEmailTemplate = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN, ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let searchQuery = {
      where: {
        id: params.template_id
      }
    };

    let emailTemplate = await studyManager.getStudyEmailTemplate(searchQuery);
    if (!emailTemplate) {
      return res.status(409).json({ success: false, message: 'Email template not found' });
    }

    searchQuery = {
      where: {
        email_code: emailTemplate.email_code,
        status: 'Published'
      }
    }

    let formEmailMappingRecord = await formEmailMappingManager.getFormEmail(searchQuery);
    if(formEmailMappingRecord) {
      return res.status(409).json({ success: false, message: 'Email template is in use, cannot be deleted.' || 'Email template attached with form' });
    }
    
    searchQuery = {
      where: {
        id: params.template_id
      }
    };

    let payload = {
      status: 'Deleted',
      updated_by: req.user.id,
      updated_at: Date.now()
    };

    await studyManager.updateStudyEmailTemplate(payload, searchQuery);

    let auditPayload = {
      message: `${params.name} email template deleted`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: params.study_id
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study template successfully deleted' });
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
}

/**
* This function is use for get study temaplates list
*/
module.exports.getStudyEmailTemplatesList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN, ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.query.study_id) {
      return res.status(406).json({ success: false, message: 'Study Id missing in request payload' });
    }

    let searchQuery = {
      where: {
        id: req.query.study_id
      }
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study not found' });
    }

    searchQuery = {
      where: {
        study_id: req.query.study_id,
        status: 'Active'
      },
      include:[{
        model: Users,
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [
          [ 'id', 'DESC'],
      ]
    };

    let emailTemplates = await studyManager.getStudyEmailTemplatesList(searchQuery);

    res.status(200).json({success: true, data: emailTemplates.reverse()});
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
}
