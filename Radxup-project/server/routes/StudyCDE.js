const express   = require('express');
const router    = express.Router();
const StudyCDECtrl  = require('../controllers/StudyCDE');
const { validateAccessToken } = require('../services/authService');

/**
* API routes for participant operation routes
*/
router.get('/',                  validateAccessToken, StudyCDECtrl.getStudyCDEs);
router.post('/',                 validateAccessToken, StudyCDECtrl.createStudyCDEs);

module.exports = router;
