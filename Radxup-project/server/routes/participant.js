const express   = require('express');
const router    = express.Router();
const participantCtrl = require('../controllers/participant');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.post('/generate/OTP',       participantCtrl.generateOTP);
router.post('/login',              participantCtrl.login);
router.post('/reset/password',     participantCtrl.resetPassword);
router.post('/update/profile',     validateAccessToken, participantCtrl.updateParticipantProfile);
router.get('/survey/list',         validateAccessToken, participantCtrl.getParticipantSurveyList);


module.exports = router;
