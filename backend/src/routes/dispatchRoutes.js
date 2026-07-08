const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  clockInShift, 
  clockOutShift, 
  getLiveOffers, 
  acceptOffer, 
  rejectOffer,
  getLiveReturnOffers,
  acceptReturnOffer,
  rejectReturnOffer,
  updateReturnDeliveryStatus
} = require('../controllers/dispatchController');

const router = express.Router();

router.put('/clock-in', protect, clockInShift);
router.put('/clock-out', protect, clockOutShift);
router.get('/offers', protect, getLiveOffers);
router.post('/offers/:eventId/accept', protect, acceptOffer);
router.post('/offers/:eventId/reject', protect, rejectOffer);

// Return Offers
router.get('/returns/offers', protect, getLiveReturnOffers);
router.post('/returns/offers/:eventId/accept', protect, acceptReturnOffer);
router.post('/returns/offers/:eventId/reject', protect, rejectReturnOffer);
router.put('/returns/:returnId/status', protect, updateReturnDeliveryStatus);

module.exports = router;
