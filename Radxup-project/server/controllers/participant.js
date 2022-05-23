const bcrypt = require('bcrypt');
const validator = require('../lib/validator');
const userManager = require('../data/managers/users');
const appService = require('../services/appService');
const templateService = require('../services/templateService.js');
const emailService = require('../services/emailService');
const authService = require('../services/authService');
const enums = require('../lib/enums');
const PARAMSTYPE = enums.PARAMSTYPE;
const ROLES = enums.ROLES;

/**
* This function is use for generate login OTP
*/
module.exports.generateOTP = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateOTPPayload(params);
    if (validationResult.error) {
      return res.status(409).json({ success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
    }

    let searchQuery = {
      where: {
        personal_email: params.personal_email
      }
    }

    let participantProfile = await userManager.getUserProfile(searchQuery);
    if(!participantProfile) {
      return res.status(409).json({ success: false, message: `Participant not registerd. Please contact to administrator`});
    }

    let otp = appService.getOtp();
    participantProfile.OTP = otp;
    let emailBody = await templateService.generateEmailTemplates(participantProfile, 'SEND_OTP');
    let emailOptions = {
      email: params.personal_email,
      subject: 'Reset password',
      template: emailBody
    }

    emailService.sendEmail(emailOptions);
    let updateQuery = {
      otp: otp
    }

    await userManager.updateUserProfile(updateQuery, searchQuery);
    res.status(200).json({ success: true, message: `OTP Email sent`});
  } catch (error) {
    return res.status(409).json({ success: false, message: error.message});
  }
}


/**
* This function is use for take login
*/
module.exports.login = async (req, res) => {
  try {
    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateLoginParams(params);

    let searchQuery = {
      where: {
        personal_email: params.personal_email
      }
    }

    let userProfile = await userManager.getUserProfile(searchQuery);
    if(!userProfile) {
      return res.status(400).json({success : false, message: 'Participant not found'});
    }

    const passwordHash = bcrypt.hashSync(params.password, userProfile.salt);
    if(passwordHash !== userProfile.password) {
      return res.status(400).json({success : false, message: 'Invalid login attempt'});
	  }

    let token = authService.generateAuthToken(userProfile);
    res.status(200).json({success: true, 'token': token});
  } catch (err) {
    console.log(err);
    res.status(409).json({success : false, message: err.message});
  }
}

/**
* This function is use for reset password
*/
module.exports.resetPassword = async (req, res) => {
  try {
    if(!req.body.payload) {
      return res.status(406).json({success: false, message: 'Request payload missing'});
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateSetPasswordPayload(params);
    if (validationResult.error) {
      return res.status(409).json({ success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
    }

    let searchQuery = {
      where: {
        personal_email: params.personal_email
      }
    }

    let participantProfile = await userManager.getUserProfile(searchQuery);
    if(!participantProfile) {
      return res.status(400).json({success : false, message: 'Participant not found'});
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(params.password, salt);

    let updateQuery = { password: passwordHash, salt: salt, otp: null};
    await userManager.updateUserProfile(updateQuery, searchQuery);
    res.status(200).json({success : true, message: 'Password successfully updated'});
  } catch (err) {
    console.log(err);
    res.status(400).json({success : false, message: err.message})
  }
}


/**
* This function is use for update participant profile
*/
module.exports.updateParticipantProfile = async (req, res) => {
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


    let payload = {
      first_name: params.first_name,
      last_name: params.last_name,
      mobile_phone: parseInt(params.mobile_phone) || null
    };

    await userManager.updateUserProfile(payload, searchQuery);
    return res.status(200).json({ success: true, message: 'User profile successfully updated'});
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};


/**
* This function is use for get list of participant surveys
*/
module.exports.getParticipantSurveyList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.PARTICIPANT])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.query.query) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.query.query);

    let searchQuery = {
      where: {
        user_id: params.id,
        study_id: params.study_id
      }
    };

    let usersSurveyList = await userManager.getUserFormMappingList(searchQuery);
    res.status(200).json({ success: true, data: usersSurveyList});
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
