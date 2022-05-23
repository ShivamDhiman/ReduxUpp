const validator = require('../lib/validator');
const authService = require('../services/authService');
const feedbacksManager = require('../data/managers/feedback');

module.exports.submitFeedback = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);

    let validationResult = validator.validateFeedbackPayload(params);
    if (validationResult.error) {
      return res.status(406).json({ success: false, message: validationResult.error.message });
    }

    let average_rating = (parseInt(params.easy_use) + parseInt(params.overall_look) + parseInt(params.overall_experience)) / 3;
    let payload = {
      easy_use: parseInt(params.easy_use),
      overall_look: parseInt(params.overall_look),
      overall_experience: parseInt(params.overall_experience),
      average_rating: Math.round(average_rating),
      study_id: params.study_id || 1,
      survey_id: params.survey_id,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    await feedbacksManager.createFeedback(payload);
    res.status(200).json({ success: true, message: 'Feedback successfully submitted' });
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
};