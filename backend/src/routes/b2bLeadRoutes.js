const express = require('express');
const { createLead, getLeads, updateLeadStatus, syncLeadsToProfessionals } = require('../controllers/b2bLeadController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', createLead);
router.get('/', protect, authorize('admin'), getLeads);
router.put('/:id/status', protect, authorize('admin'), updateLeadStatus);
// Sync all existing B2BLeads → professional User records (admin one-shot fix)
router.post('/sync-professionals', protect, authorize('admin'), syncLeadsToProfessionals);

module.exports = router;
