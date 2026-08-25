const express = require('express');
const { getTermsByType, updateTermsByType, previewAgreementPdf } = require('../controllers/termsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/agreement-preview/:role', protect, authorize('admin'), previewAgreementPdf);

router.get('/:type', getTermsByType);
router.put('/:type', protect, authorize('admin'), updateTermsByType);

module.exports = router;
