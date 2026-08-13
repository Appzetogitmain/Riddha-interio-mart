const express = require('express');
const {
  getUserStatus,
  getNextSuggestion,
  trackStep,
  getFunnel,
  getFeatureImpact,
  getContextHelp,
  getRecommendedPath,
  personalizeFlow,
  getAnalyticsDashboard,
  syncSequences
} = require('../controllers/journeyController');
const { protect, authorize, tryProtect } = require('../middleware/auth');

const router = express.Router();

// Journey tracking + guidance. tryProtect so anonymous visitors still get a
// coherent (session-keyed) journey, with richer output once logged in.
router.get('/user-status', tryProtect, getUserStatus);
router.post('/next-suggestion', tryProtect, getNextSuggestion);
router.post('/track-step', tryProtect, trackStep);
router.post('/context-help', tryProtect, getContextHelp);
router.get('/recommended-path/:userSegment', tryProtect, getRecommendedPath);
router.post('/personalize-flow', protect, personalizeFlow);

// Admin analytics
router.get('/funnel', protect, authorize('admin'), getFunnel);
router.get('/feature-impact', protect, authorize('admin'), getFeatureImpact);
router.get('/analytics/dashboard', protect, authorize('admin'), getAnalyticsDashboard);
router.post('/sequences/sync', protect, authorize('admin'), syncSequences);

module.exports = router;
