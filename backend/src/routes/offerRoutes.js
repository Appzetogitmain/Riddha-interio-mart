const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const {
  createOffer,
  getOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  updateApprovalStatus
} = require('../controllers/offerController');
const OFFER_TYPES = require('../constants/offerTypes');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply auth middleware
router.use(protect);
router.use(authorize('seller', 'admin'));

// Routes
router.route('/')
  .get(getOffers)
  .post([
    check('type', 'Valid offer type is required').isIn(OFFER_TYPES),
    check('title', 'Title is required').not().isEmpty().trim(),
    check('products', 'At least one product must be selected').isArray({ min: 1 }),
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601(),
    validate
  ], createOffer);

router.route('/:id')
  .get(getOffer)
  .put(updateOffer)
  .delete(deleteOffer);

router.patch('/:id/approval', authorize('admin'), updateApprovalStatus);

module.exports = router;
