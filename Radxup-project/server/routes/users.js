const express   = require('express');
const router    = express.Router();
const userCtrl  = require('../controllers/users');
const pFormsCtrl  = require('../controllers/participantForms');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for user operation routes
*/
router.post('/initiate',            validateAccessToken, userCtrl.initiateRegistration);
router.post('/update',              validateAccessToken, userCtrl.updateUserProfile);
router.post('/delete',              validateAccessToken, userCtrl.deRegisteredParticipant);
router.post('/resend/survey',       validateAccessToken, userCtrl.resendSurvey);
router.get('/list',                 validateAccessToken, userCtrl.getUsersList);
router.get('/managers/list',        validateAccessToken, userCtrl.getManagerUsersList);
router.get('/profile',              validateAccessToken, userCtrl.getUsersProfile);
router.get('/details',              validateAccessToken, userCtrl.getUserDetails);
router.get('/participant/forms',    validateAccessToken, pFormsCtrl.getParicipantForms);
router.post('/participant',         userCtrl.addParticipant);
router.post('/token',               userCtrl.generateToken);


module.exports = router;
