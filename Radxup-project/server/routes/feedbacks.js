const express = require('express');
const router = express.Router();
const feedbackCtrl = require('../controllers/feedbacks');
const { validateAccessToken } = require('../services/authService');

/**
 * API routes for feedback operation routes
 */
router.post('/submit',  validateAccessToken, feedbackCtrl.submitFeedback);

module.exports = router;
