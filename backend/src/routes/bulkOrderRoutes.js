const express = require('express');
const router = express.Router();
const {
  createBulkOrder,
  getAllBulkOrders,
  getSellerBulkOrders,
  updateBulkOrderStatus,
  deleteBulkOrder
} = require('../controllers/bulkOrderController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// Public route for customers to create bulk orders
router.post('/', createBulkOrder);

// Seller route — returns only orders containing this seller's products
router.get('/seller', protect, authorize('seller'), getSellerBulkOrders);

// Protected Admin Routes
router.get('/', protect, authorize('admin'), checkPermission('orders'), getAllBulkOrders);
router.put('/:id', protect, authorize('admin'), checkPermission('orders'), updateBulkOrderStatus);
router.delete('/:id', protect, authorize('admin'), checkPermission('orders'), deleteBulkOrder);

module.exports = router;
