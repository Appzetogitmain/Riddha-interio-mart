const express = require('express');
const router = express.Router();
const {
  getSellerWallet,
  getDeliveryWallet,
  requestSellerWithdrawal,
  claimOrderPayout,
  approvePayout,
  rejectPayout,
  depositCodLiability,
  getAdminFinancialAnalytics,
  requestDeliveryCodDeposit,
  rejectDeliverySettlement,
  getAdminPendingPayouts
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all wallet routes
router.use(protect);

// Seller endpoints
router.get('/seller/me', authorize('seller'), getSellerWallet);
router.post('/seller/payout', authorize('seller'), requestSellerWithdrawal);
router.post('/seller/claim/:orderId', authorize('seller'), claimOrderPayout);

// Delivery Partner endpoints
router.get('/delivery/me', authorize('delivery'), getDeliveryWallet);
router.post('/delivery/deposit-request', authorize('delivery'), requestDeliveryCodDeposit);

// Admin oversight and settlements
router.get('/admin/payouts', authorize('admin'), getAdminPendingPayouts);
router.post('/admin/payouts/:id/approve', authorize('admin'), approvePayout);
router.post('/admin/payouts/:id/reject', authorize('admin'), rejectPayout);
router.post('/admin/delivery/cod-deposit', authorize('admin'), depositCodLiability);
router.post('/admin/delivery/cod-reject', authorize('admin'), rejectDeliverySettlement);
router.get('/admin/analytics', authorize('admin'), getAdminFinancialAnalytics);

module.exports = router;
