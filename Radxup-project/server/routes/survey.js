const express   = require('express');
const router    = express.Router();
const surveyCtrl  = require('../controllers/survey');
const formCtrl  = require('../controllers/forms');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.post('/submit',       validateAccessToken, surveyCtrl.submitSurvey);
router.post('/resubmit',     validateAccessToken, surveyCtrl.reSubmitSurvey);
router.get('/list',          validateAccessToken, surveyCtrl.getSurveyList);
router.get('/details',       validateAccessToken, surveyCtrl.getSurveyQuestionAnswer);
router.post('/sync/records', validateAccessToken, surveyCtrl.pushRecords);
router.get('/sync/records',  validateAccessToken, surveyCtrl.getPushedRecords);
router.get('/info',          formCtrl.getSurveyFormInfo);
router.get('/feedback',      validateAccessToken, surveyCtrl.getFeedback);
router.get('/bundle',        surveyCtrl.getBundle);
router.get('/eicf/details',  validateAccessToken, surveyCtrl.getEICFDetails);


module.exports = router;
