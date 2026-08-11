const express = require('express');
const { getCompleteSuggestions } = require('../controllers/roomController');

const router = express.Router();

router.get('/complete-suggestions', getCompleteSuggestions);

module.exports = router;
