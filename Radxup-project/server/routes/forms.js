const express   = require('express');
const router    = express.Router();
const formsCtrl  = require('../controllers/forms');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',                 validateAccessToken, formsCtrl.getFormsList);
router.get('/info',             validateAccessToken, formsCtrl.getFormsInfo);
router.get('/dependencyforms',  validateAccessToken, formsCtrl.getDependencyFormInfo);
router.post('/',                validateAccessToken, formsCtrl.addNewForm);
router.post('/update',          validateAccessToken, formsCtrl.updateForm);
router.post('/update/status',   validateAccessToken, formsCtrl.updateFormStatus);
router.post('/delete',          validateAccessToken, formsCtrl.deleteForm);
// router.get('/list',             validateAccessToken, formsCtrl.getSelectedFormsList);
router.get('/details',          validateAccessToken, formsCtrl.getFormDetails);
module.exports = router;