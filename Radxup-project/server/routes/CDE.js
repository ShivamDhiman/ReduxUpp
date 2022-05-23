const express   = require('express');
const router    = express.Router();
const CDECtrl  = require('../controllers/CDE');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',             validateAccessToken, CDECtrl.getCDEList);
router.get('/summary',      validateAccessToken, CDECtrl.getCDESummary);
router.get('/category',     validateAccessToken, CDECtrl.getCategoryCDEList);
router.get('/icef',         validateAccessToken, CDECtrl.geteICFCDEList);

module.exports = router;
