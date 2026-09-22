const express = require('express');
const { 
  registerSeller, 
  loginSeller, 
  getSellerMe, 
  updateSellerProfile, 
  getSellerStockStatus, 
  verifySellerOtp, 
  resendSellerOtp,
  getSellerCustomers,
  retrySellerWelcomeNotifications,
  getSellerNotificationStatus
} = require('../controllers/sellerController');
const { getSellerAnalytics } = require('../controllers/sellerAnalyticsController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/register', upload.fields([
  { name: 'gstDoc', maxCount: 1 },
  { name: 'panDoc', maxCount: 1 },
  { name: 'shopDoc', maxCount: 1 }
]), [
  check('fullName', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  validate
], registerSeller);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  validate
], loginSeller);

router.post('/verify-otp', verifySellerOtp);
router.post('/resend-otp', resendSellerOtp);
router.get('/me', protect, getSellerMe);
router.put('/profile', protect, updateSellerProfile);
router.get('/stock-status', protect, getSellerStockStatus);
router.get('/analytics', protect, getSellerAnalytics);
router.get('/customers', protect, getSellerCustomers);

// Welcome notification endpoints (retry and status inspection)
router.post('/welcome-notifications/retry', protect, retrySellerWelcomeNotifications);
router.get('/welcome-notifications/status', protect, getSellerNotificationStatus);
router.get('/welcome-notifications/status/:sellerId', protect, getSellerNotificationStatus);

module.exports = router;
