const express = require('express');
const router = express.Router();
const {
  createBulkOrder,
  getAllBulkOrders,
  getSellerBulkOrders,
  updateBulkOrderStatus,
  deleteBulkOrder,
  getSuggestedSellers,
  assignBulkOrderToSellers,
  respondToBulkOrderAssignment,
  sendOfferToCustomer,
  getBulkOrderOffer,
  confirmBulkOrderOffer
} = require('../controllers/bulkOrderController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// Public routes — no login required (bulk order inquiries and offer confirmation come
// from anonymous website visitors, not just logged-in accounts)
router.post('/', createBulkOrder);
router.get('/:id/offer', getBulkOrderOffer);
router.post('/:id/confirm', confirmBulkOrderOffer);

// Seller routes
router.get('/seller', protect, authorize('seller'), getSellerBulkOrders);
router.put('/:id/respond', protect, authorize('seller'), respondToBulkOrderAssignment);

// Protected Admin Routes
router.get('/', protect, authorize('admin'), checkPermission('orders'), getAllBulkOrders);
router.get('/:id/suggested-sellers', protect, authorize('admin'), checkPermission('orders'), getSuggestedSellers);
router.post('/:id/assign', protect, authorize('admin'), checkPermission('orders'), assignBulkOrderToSellers);
router.post('/:id/send-offer', protect, authorize('admin'), checkPermission('orders'), sendOfferToCustomer);
router.put('/:id', protect, authorize('admin'), checkPermission('orders'), updateBulkOrderStatus);
router.delete('/:id', protect, authorize('admin'), checkPermission('orders'), deleteBulkOrder);

module.exports = router;
