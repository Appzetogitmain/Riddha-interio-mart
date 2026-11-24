const express = require('express');
const {
  startOrContinueChat,
  getConversations,
  getConversationById,
  deleteConversation,
  getHandovers,
  getAdminCustomers,
  getAdminConversation,
  updateFollowUp
} = require('../controllers/assistantController');

const { protect, tryProtect, authorize } = require('../middleware/auth');
const { generateSpeech, ttsRateLimiter } = require('../controllers/ttsController');

const router = express.Router();

// Customer Endpoints (can be used by guests or logged-in users)
router.route('/chat')
  .post(tryProtect, startOrContinueChat);

router.route('/tts')
  .post(ttsRateLimiter, generateSpeech);

router.route('/conversations')
  .get(tryProtect, getConversations);

router.route('/conversations/:id')
  .get(tryProtect, getConversationById)
  .delete(tryProtect, deleteConversation);

// Admin-Only Endpoints
router.get('/admin/customers', protect, authorize('admin'), getAdminCustomers);
router.get('/admin/conversations/:id', protect, authorize('admin'), getAdminConversation);
router.put('/admin/conversations/:id/follow-up', protect, authorize('admin'), updateFollowUp);

router.route('/admin/handovers')
  .get(protect, authorize('admin'), getHandovers);

module.exports = router;
