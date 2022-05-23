const express = require('express');
const router = express.Router();
const analyticsCtrl = require('../controllers/analytics');
const { validateAccessToken } = require('../services/authService');

/**
 * API routes for analytics operation routes
 */

router.get('/synced/records', validateAccessToken, analyticsCtrl.getSyncedRecords);
router.get('/participants/enrolled', validateAccessToken, analyticsCtrl.getEnrolledParticipants);
router.get('/survey/stats', validateAccessToken, analyticsCtrl.getSurveyStats);
router.get('/survey/avgTime', validateAccessToken, analyticsCtrl.getSurveyAvgTime);
router.get('/feedback',        validateAccessToken, analyticsCtrl.getFeedbackByStudyId);

module.exports = router;
