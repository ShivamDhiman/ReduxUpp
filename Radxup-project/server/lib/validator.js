const Joi = require('joi');

module.exports.validateRegisterPayload = payload => {
  const schema = Joi.object().keys({
    first_name: Joi.string().allow('').allow(null).max(30).pattern(/^[a-zA-Z]+$/),
    last_name: Joi.string().allow('').allow(null).max(30).pattern(/^([a-zA-Z]+\s)*[a-zA-Z]+$/),
    personal_email: Joi.string().allow('').allow(null).email().max(40),
    participant_id: Joi.string().allow('').allow(null).min(0).max(10),
    study_id: Joi.required(),
    mobile_phone:  Joi.string().allow('').allow(null).length(10).pattern(/^[0-9]+$/)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};

module.exports.validateParticipantPayload = payload => {
  const schema = Joi.object().keys({
    first_name: Joi.string().allow('').allow(null).max(30).pattern(/^[a-zA-Z]+$/),
    last_name: Joi.string().allow('').allow(null).max(30).pattern(/^([a-zA-Z]+\s)*[a-zA-Z]+$/),
    personal_email: Joi.string().allow('').email().max(60),
    participant_id: Joi.string().allow('').allow(null).min(0).max(10),
    mobile_phone:  Joi.string().allow('').allow(null).length(10).pattern(/^[0-9]+$/)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};


module.exports.validateFeedbackPayload = payload => {
  const schema = Joi.object().keys({
    easy_use: Joi.required(),
    overall_look: Joi.required(),
    overall_experience: Joi.required()
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};


module.exports.validateStudyParams = payload => {
  const schema = Joi.object().keys({
    name: Joi.string().allow('').allow(null).max(50),
    study_id: Joi.string().pattern(/^[a-zA-Z0-9\-_]{0,35}$/),
    description: Joi.string().allow('').allow(null).max(2000)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};


module.exports.validateStudyContentParams = payload => {
  const schema = Joi.object().keys({
    description: Joi.string().allow('').allow(null).max(2000),
    registration_description: Joi.string().allow('').allow(null).max(2000),
    feedback_description: Joi.string().allow('').allow(null).max(2000)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};

module.exports.validateStudyEmailTemplateParams = payload => {
  const schema = Joi.object().keys({
    name: Joi.string().allow('').allow(null).max(100),
    subject: Joi.string().allow('').allow(null).max(200),
    header: Joi.string().allow('').allow(null).max(200),
    body_content: Joi.string().allow('').allow(null).max(2000)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};

/**
* This Validator function is use for to validate email id
**/
module.exports.validateOTPPayload = payload => {
  const schema = Joi.object().keys({
    personal_email: Joi.string().email().max(40)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};

/**
* This Validator function is use for to validate set password params
**/
module.exports.validateSetPasswordPayload = payload => {
  const schema = Joi.object().keys({
    password: Joi.string().max(40),
    otp: Joi.number().integer().max(99999)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};


/**
* This Validator function is use for to validate login params
**/
module.exports.validateLoginParams = payload => {
  const schema = Joi.object().keys({
    password: Joi.string().min(6).max(20),
    personal_email: Joi.string().email().max(40)
  });

  let validationResults = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  return validationResults;
};
