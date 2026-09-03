const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlans,
  getAdminPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptionStatus,
  createSubscriptionOrder,
  verifySubscriptionPayment
} = require('../controllers/subscriptionController');

// User facing endpoints
router.get('/plans', getPlans);
router.get('/status', protect, getSubscriptionStatus);
router.post('/create-order', protect, createSubscriptionOrder);
router.post('/verify-payment', protect, verifySubscriptionPayment);

// Admin facing CRUD endpoints
router.get('/admin/plans', protect, authorize('admin'), getAdminPlans);
router.post('/admin/plans', protect, authorize('admin'), createPlan);
router.put('/admin/plans/:id', protect, authorize('admin'), updatePlan);
router.delete('/admin/plans/:id', protect, authorize('admin'), deletePlan);

module.exports = router;
