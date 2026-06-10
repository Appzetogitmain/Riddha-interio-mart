const express = require('express');
const { getTermsByType, updateTermsByType } = require('../controllers/termsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:type', getTermsByType);
router.put('/:type', protect, authorize('admin'), updateTermsByType);

module.exports = router;
