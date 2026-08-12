const express = require('express');
const {
  submitQuiz,
  getQuizResult,
  getMyQuizResult,
  getUsageStats
} = require('../controllers/quizController');
const { protect, tryProtect, authorize } = require('../middleware/auth');

const router = express.Router();

// Submit quiz answers (registers session, tries to capture logged-in user if token is present)
router.post('/:sessionId/complete', tryProtect, submitQuiz);

// Get quiz result for a specific session (guests and users fallback)
router.get('/results/:sessionId', tryProtect, getQuizResult);

// Get authenticated user's latest quiz results
router.get('/my-results', protect, getMyQuizResult);

// Admin-only usage statistics endpoint
router.get('/admin/usage-stats', protect, authorize('admin'), getUsageStats);

module.exports = router;
