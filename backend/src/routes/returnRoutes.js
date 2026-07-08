const express = require('express');
const {
  requestReturn,
  getMyReturns,
  getSellerReturns,
  getDeliveryReturns,
  getAllReturns,
  updateReturnStatus,
  autoAssignReturn
} = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requestReturn);
router.get('/my-returns', protect, getMyReturns);
router.get('/seller', protect, authorize('seller'), getSellerReturns);
router.get('/delivery', protect, authorize('delivery'), getDeliveryReturns);
router.get('/', protect, authorize('admin'), getAllReturns);
router.put('/:id/status', protect, authorize('seller', 'admin', 'delivery'), updateReturnStatus);
router.post('/:id/auto-assign', protect, authorize('admin'), autoAssignReturn);

module.exports = router;
