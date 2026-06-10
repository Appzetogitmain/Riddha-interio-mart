const express = require('express');
const {
  registerDelivery,
  loginDelivery,
  getDeliveryMe,
  updateDeliveryProfile,
  getAvailableDeliveryBoys,
  updateDeliveryStatus,
  getAllDeliveryPartners,
  updateDeliveryApprovalStatus,
  getPendingDeliveryBoys,
  updateDeliveryLocation,
  deleteDeliveryPartner,
  changeDeliveryPassword,
  deleteDeliveryAccount
} = require('../controllers/deliveryController');
const { getDeliveryAnalytics } = require('../controllers/deliveryAnalyticsController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', [
  check('fullName', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('phone', 'Please include a valid phone number').not().isEmpty(),
  validate
], registerDelivery);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  validate
], loginDelivery);
router.get('/me', protect, getDeliveryMe);
router.put('/profile', protect, updateDeliveryProfile);
router.put('/change-password', protect, changeDeliveryPassword);
router.delete('/me', protect, deleteDeliveryAccount);
router.get('/available', protect, getAvailableDeliveryBoys);
router.put('/status', protect, updateDeliveryStatus);
router.put('/location', protect, updateDeliveryLocation);
router.get('/analytics', protect, getDeliveryAnalytics);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingDeliveryBoys);
router.get('/', protect, authorize('admin'), getAllDeliveryPartners);
router.put('/:id/approve', protect, authorize('admin'), updateDeliveryApprovalStatus);
router.delete('/:id', protect, authorize('admin'), deleteDeliveryPartner);

module.exports = router;
