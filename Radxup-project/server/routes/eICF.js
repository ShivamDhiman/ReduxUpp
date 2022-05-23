const express   = require('express');
const router    = express.Router();
const eICFCtrl  = require('../controllers/eICF');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',                     validateAccessToken, eICFCtrl.getICFList);
router.get('/published',            validateAccessToken, eICFCtrl.getICFPublished);
router.get('/info',                 validateAccessToken, eICFCtrl.getICF);
router.post('/',                    validateAccessToken, eICFCtrl.addICF);
router.post('/update',              validateAccessToken, eICFCtrl.updateICF);
router.post('/update/status',       validateAccessToken, eICFCtrl.updateICFStatus);
router.post('/delete',              validateAccessToken, eICFCtrl.deleteICF);
router.post('/signature/upload',    eICFCtrl.ICFConsented);


module.exports = router;
