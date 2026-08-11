const express = require('express');
const { getRecommendations, trackEvent } = require('../controllers/recommendationController');
const { tryProtect } = require('../middleware/auth');

const router = express.Router();

router.get('/products', tryProtect, getRecommendations);
router.post('/events', tryProtect, trackEvent);

module.exports = router;
