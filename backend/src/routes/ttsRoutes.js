const express = require('express');
const { generateSpeech } = require('../controllers/ttsController');

const router = express.Router();

// @route POST /api/tts
router.post('/', generateSpeech);

module.exports = router;
