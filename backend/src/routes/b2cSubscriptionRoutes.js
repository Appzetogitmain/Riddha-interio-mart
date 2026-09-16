const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getB2CPlans,
  getAdminB2CPlans,
  createB2CPlan,
  updateB2CPlan,
  deleteB2CPlan,
  createB2COrder,
  verifyB2CPayment,
  getB2CStatus,
  getAdminB2CPurchases
} = require('../controllers/b2cSubscriptionController');

// Public: get active B2C plans for customers
router.get('/plans', getB2CPlans);

// Protected: user status and payment
router.get('/status', protect, getB2CStatus);
router.post('/create-order', protect, createB2COrder);
router.post('/verify-payment', protect, verifyB2CPayment);

// Admin CRUD
router.get('/admin/plans', protect, authorize('admin'), getAdminB2CPlans);
router.get('/admin/purchases', protect, authorize('admin'), getAdminB2CPurchases);
router.post('/admin/plans', protect, authorize('admin'), createB2CPlan);
router.put('/admin/plans/:id', protect, authorize('admin'), updateB2CPlan);
router.delete('/admin/plans/:id', protect, authorize('admin'), deleteB2CPlan);

module.exports = router;
