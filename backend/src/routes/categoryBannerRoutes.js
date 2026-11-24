const express = require('express');
const c = require('../controllers/categoryBannerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public (category page)
router.get('/public', c.publicBanners);
router.post('/:id/track', c.track);

// Plans: admin manages, sellers see active ones
router.get('/plans', protect, authorize('admin', 'seller'), c.listPlans);
router.post('/plans', protect, authorize('admin'), c.createPlan);
router.put('/plans/:id', protect, authorize('admin'), c.updatePlan);

// Admin moderation
router.get('/admin/ads', protect, authorize('admin'), c.adminListAds);
router.put('/admin/ads/:id/review', protect, authorize('admin'), c.reviewAd);
router.put('/admin/ads/:id/end', protect, authorize('admin'), c.endAd);

// Seller
router.get('/availability', protect, authorize('seller'), c.availability);
router.post('/ads', protect, authorize('seller'), c.createAd);
router.post('/ads/:id/verify-payment', protect, authorize('seller'), c.verifyPayment);
router.get('/my-ads', protect, authorize('seller'), c.myAds);

module.exports = router;
