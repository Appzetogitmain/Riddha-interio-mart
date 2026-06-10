const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitBatch,
  getSellerBatches,
  getAllBatches,
  getBatchDetail,
  reviewBatchProduct
} = require('../controllers/productBatchController');

// Seller routes
router.post('/', protect, authorize('seller'), submitBatch);
router.get('/my-batches', protect, authorize('seller'), getSellerBatches);

// Admin routes
router.get('/', protect, authorize('admin'), getAllBatches);
router.get('/:batchId', protect, authorize('admin'), getBatchDetail);
router.patch('/:batchId/products/:productId', protect, authorize('admin'), reviewBatchProduct);

module.exports = router;
