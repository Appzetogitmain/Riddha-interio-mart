const express = require('express');
const {
  getPersonalizedRecommendationsForUser,
  getRecommendationsForProduct,
  getTrending,
  trackInteraction,
  getBundles,
  refineSearch,
  regenerate,
  getAnalytics,
  updateProfile,
  getExplanation,
  getRecommendations,
  trackEvent,
  getCuration,
  setCuration,
  setProductTabs,
  getProductTabs
} = require('../controllers/recommendationController');
const { protect, tryProtect, authorize } = require('../middleware/auth');

const router = express.Router();

// New Recommendation Engine API Endpoints
router.get('/for-user', tryProtect, getPersonalizedRecommendationsForUser);
router.get('/for-product/:productId', tryProtect, getRecommendationsForProduct);
router.get('/trending', getTrending);
router.post('/track', tryProtect, trackInteraction);
router.get('/bundles', tryProtect, getBundles);
router.post('/search-refined', tryProtect, refineSearch);
router.post('/regenerate', tryProtect, regenerate);
router.get('/analytics', protect, getAnalytics);
router.post('/profile-update', protect, updateProfile);
router.get('/explanation/:productId', tryProtect, getExplanation);

router.get('/curation', protect, authorize('admin'), getCuration);
router.get('/curation/product/:productId', protect, authorize('admin'), getProductTabs);
router.put('/curation/product/:productId', protect, authorize('admin'), setProductTabs);
router.put('/curation/:tab', protect, authorize('admin'), setCuration);

// Backwards Compatibility Endpoints
router.get('/products', tryProtect, getRecommendations);
router.post('/events', tryProtect, trackEvent);

module.exports = router;
