const express = require('express');
const { generateSpeech, ttsRateLimiter, getTtsConfig } = require('../controllers/ttsController');

const router = express.Router();

// @route POST /api/tts
router.get('/config', getTtsConfig);
router.post('/', ttsRateLimiter, generateSpeech);

module.exports = router;
