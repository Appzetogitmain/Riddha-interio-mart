const express = require('express');
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview,
  voteHelpful,
  reportReview,
  respondToReview,
  getAdminReviews,
  getSellerReviews,
  getMyReviews,
  adminCreateReview
} = require('../controllers/reviewController');

const { protect, authorize } = require('../middleware/auth');
const { check, param } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router({ mergeParams: true }); // Important for nested routes like /products/:productId/reviews

router.route('/')
  .get([
    param('productId', 'Invalid product ID format').optional().isMongoId(),
    validate
  ], getReviews)
  .post(protect, [
    param('productId', 'Invalid product ID format').isMongoId(),
    check('rating', 'Rating is required between 1 and 5').isInt({ min: 1, max: 5 }),
    check('review', 'Review text is required').not().isEmpty(),
    validate
  ], createReview);

router.get('/admin', protect, authorize('admin'), getAdminReviews);
router.post('/admin/create', protect, authorize('admin'), adminCreateReview);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerReviews);
router.get('/me', protect, getMyReviews);

router.route('/:id')
  .put(protect, authorize('user', 'admin'), [
    param('id', 'Invalid review ID format').isMongoId(),
    check('rating', 'Rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    validate
  ], updateReview)
  .delete(protect, authorize('user', 'admin'), [
    param('id', 'Invalid review ID format').isMongoId(),
    validate
  ], deleteReview);

router.put('/:id/moderation', protect, authorize('admin'), [
  param('id', 'Invalid review ID format').isMongoId(),
  check('isApproved', 'isApproved boolean is required').isBoolean(),
  validate
], moderateReview);

router.post('/:id/helpful', protect, [
  param('id', 'Invalid review ID format').isMongoId(),
  validate
], voteHelpful);

router.post('/:id/report', protect, [
  param('id', 'Invalid review ID format').isMongoId(),
  check('reason', 'reason text is required').not().isEmpty(),
  validate
], reportReview);

router.post('/:id/response', protect, authorize('seller', 'admin'), [
  param('id', 'Invalid review ID format').isMongoId(),
  check('text', 'Response text is required').not().isEmpty(),
  validate
], respondToReview);

module.exports = router;
