const express = require('express');
const {
  startOrContinueChat,
  getConversations,
  getConversationById,
  deleteConversation,
  getHandovers
} = require('../controllers/assistantController');

const { protect, tryProtect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer Endpoints (can be used by guests or logged-in users)
router.route('/chat')
  .post(tryProtect, startOrContinueChat);

router.route('/conversations')
  .get(tryProtect, getConversations);

router.route('/conversations/:id')
  .get(tryProtect, getConversationById)
  .delete(tryProtect, deleteConversation);

// Admin-Only Endpoints
router.route('/admin/handovers')
  .get(protect, authorize('admin'), getHandovers);

module.exports = router;
