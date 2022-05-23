const express    = require('express');
const router     = express.Router();
const studyCtrl = require('../controllers/study');
const studySettingCtrl = require('../controllers/studySettings');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',                     validateAccessToken, studyCtrl.getStudyList);
router.post('/admins',              validateAccessToken, studyCtrl.addStudyAdmin);
router.post('/managers',            validateAccessToken, studyCtrl.addStudyManagers);
router.post('/managers/status',     validateAccessToken, studyCtrl.updateStudyManagerStatus);
router.post('/create',              validateAccessToken, studyCtrl.createStudy);
router.put('/update',               validateAccessToken, studyCtrl.editStudy);
router.post('/status/update',       validateAccessToken, studyCtrl.updateStudyStatus);
router.get('/arms',                 validateAccessToken, studyCtrl.getArmsList);
router.post('/document/upload',     validateAccessToken, studyCtrl.uploadDocument);
router.post('/document/update',     validateAccessToken, studyCtrl.updateDocumentsStatus);
router.get('/document',             validateAccessToken, studyCtrl.getDocuments);
router.get('/details/:studyId',     studyCtrl.getStudyById);
router.get('/info/:studyId',        studyCtrl.getStudyDetails);
router.get('/stats',                validateAccessToken, studyCtrl.getStudyStats);
router.get('/admins',               validateAccessToken, studyCtrl.getStudyAdmin);
router.get('/admin/audit/logs',     validateAccessToken, studyCtrl.getAuditLogs);


router.put('/content/update',          validateAccessToken, studySettingCtrl.updateStudyContent);
router.get('/email/template/list',     validateAccessToken, studySettingCtrl.getStudyEmailTemplatesList);
router.post('/email/template/create',  validateAccessToken, studySettingCtrl.createStudyEmailTemplate);
router.post('/email/template/delete',  validateAccessToken, studySettingCtrl.deleteStudyEmailTemplate);

module.exports = router;
