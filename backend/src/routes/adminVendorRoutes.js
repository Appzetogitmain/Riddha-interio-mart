const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const adminVendorController = require('../controllers/adminVendorController');

// All routes require admin authentication + the 'sellers' permission, matching the
// existing seller-management routes in adminRoutes.js (approve/suspend/etc.)
router.use(protect);
router.use(authorize('admin'));
router.use(checkPermission('sellers'));

// @route   GET /api/admin/sellers
// @desc    List all sellers with filters
// @access  Private/Admin
router.get('/', adminVendorController.getAllSellers);

// @route   GET /api/admin/sellers/:sellerId
// @desc    Get seller details
// @access  Private/Admin
router.get('/:sellerId', adminVendorController.getSellerDetails);

// @route   PATCH /api/admin/sellers/:sellerId/verify
// @desc    Set seller verification status
// @access  Private/Admin
router.patch('/:sellerId/verify', adminVendorController.setSellerVerificationStatus);

// @route   PATCH /api/admin/sellers/:sellerId/delivery-capabilities
// @desc    Update seller delivery capabilities
// @access  Private/Admin
router.patch('/:sellerId/delivery-capabilities', adminVendorController.updateDeliveryCapabilities);

module.exports = router;
