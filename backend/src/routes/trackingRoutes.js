const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrderTracking,
  getLiveLocation,
  getStatusHistory,
  getETAPrediction,
  checkDelays,
  reportDeliveryIssue,
  getIssueById,
  uploadProofOfDelivery,
  rateDelivery,
  getPartnerRoute,
  updatePartnerStatus,
  getTrackingAnalytics
} = require('../controllers/trackingController');

router.use(protect);

router.get('/analytics/dashboard', getTrackingAnalytics);

router.get('/orders/:orderId/track', getOrderTracking);
router.get('/orders/:orderId/live-location', getLiveLocation);
router.get('/orders/:orderId/status-history', getStatusHistory);
router.get('/orders/:orderId/eta', getETAPrediction);
router.post('/orders/:orderId/check-delays', checkDelays);

router.post('/orders/:orderId/report-issue', reportDeliveryIssue);
router.get('/issues/:issueId', getIssueById);

router.post('/orders/:orderId/proof-of-delivery', uploadProofOfDelivery);
router.post('/orders/:orderId/rate', rateDelivery);

router.get('/delivery-partners/:partnerId/route', getPartnerRoute);
router.post('/delivery-partners/:partnerId/status', updatePartnerStatus);

module.exports = router;
