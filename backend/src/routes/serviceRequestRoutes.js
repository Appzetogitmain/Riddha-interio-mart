const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequestsForProfessional,
  getUserRequests,
  acceptRequest,
  markConsultancyDone,
  initiatePayment,
  getProfessionalsByCategory
} = require('../controllers/serviceRequestController');

const { protect } = require('../middleware/auth');

// Base path: /api/v1/service-requests

router.use(protect);

router.get('/professionals/:category', getProfessionalsByCategory);
router.post('/', createRequest);
router.get('/professional', getRequestsForProfessional);
router.get('/my-requests', getUserRequests);
router.put('/:id/accept', acceptRequest);
router.put('/:id/consultancy-done', markConsultancyDone);
router.post('/:id/payment', initiatePayment);

module.exports = router;
