const express = require('express');
const {
  createPlan,
  getAllPlans,
  updatePlan,
  purchasePlan,
  selectProductsForAd,
  getMyAdvertisements,
  getAdvertisedProducts
} = require('../controllers/advertisementController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/public', getAdvertisedProducts);

// Admin routes
router.post('/plans', protect, authorize('admin'), createPlan);
router.put('/plans/:id', protect, authorize('admin'), updatePlan);

// Seller/Admin routes (Admin to view, Seller to view available)
router.get('/plans', protect, authorize('admin', 'seller'), getAllPlans);

// Seller routes
router.post('/purchase', protect, authorize('seller'), purchasePlan);
router.post('/verify-payment', protect, authorize('seller'), require('../controllers/advertisementController').verifyAdPayment);
router.post('/:id/select-products', protect, authorize('seller'), selectProductsForAd);
router.get('/my-ads', protect, authorize('seller'), getMyAdvertisements);

module.exports = router;
