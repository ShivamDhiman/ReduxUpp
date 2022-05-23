const express   = require('express');
const router    = express.Router();
const eICFFormCtrl  = require('../controllers/eICFForm');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',                     validateAccessToken, eICFFormCtrl.geteICFFList);
router.get('/info',                 eICFFormCtrl.geteICFFInfo);
router.post('/',                    validateAccessToken, eICFFormCtrl.addNeweICFFInfo);
router.post('/update',              validateAccessToken, eICFFormCtrl.updateForm);
router.post('/update/status',       validateAccessToken, eICFFormCtrl.updateeICFFStatus);
router.post('/delete',              validateAccessToken, eICFFormCtrl.deleteeICForm);
// router.get('/published',            validateAccessToken, eICFFormCtrl.getICFPublished);
router.post('/signature/upload',    eICFFormCtrl.ICFConsented);
router.get('/list',                 eICFFormCtrl.getICFListing);

module.exports = router;
