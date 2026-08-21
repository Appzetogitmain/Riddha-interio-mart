const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEligibility,
  createSampleRequest,
  getSampleRequests,
  getSampleRequestById,
  approveSampleRequest,
  declineSampleRequest,
  dispatchSampleRequest,
  markDelivered,
  submitFeedback,
  refundSampleCharge
} = require('../controllers/sampleController');

router.use(protect);

// Static path first so "eligibility" is never read as an :id.
router.get('/eligibility', getEligibility);

router.route('/')
  .post(createSampleRequest)
  .get(getSampleRequests);

router.get('/:id', getSampleRequestById);

router.post('/:id/approve', authorize('seller', 'admin'), approveSampleRequest);
router.post('/:id/decline', authorize('seller', 'admin'), declineSampleRequest);
router.post('/:id/dispatch', authorize('seller', 'admin'), dispatchSampleRequest);
router.post('/:id/deliver', markDelivered);
router.post('/:id/feedback', submitFeedback);
router.post('/:id/refund', authorize('admin'), refundSampleCharge);

module.exports = router;
