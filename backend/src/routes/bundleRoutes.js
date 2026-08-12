const express = require('express');
const {
  createBundle,
  getBundles,
  getAdminBundles,
  getBundleSuggestions,
  getBundle,
  updateBundle,
  deleteBundle
} = require('../controllers/bundleController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminBundles);
router.get('/suggestions', getBundleSuggestions);

router.route('/')
  .get(getBundles)
  .post(protect, authorize('admin'), [
    check('name', 'Name is required').not().isEmpty(),
    check('products', 'At least 2 products are required').isArray({ min: 2 }),
    check('bundlePrice', 'bundlePrice is required').isFloat({ gt: 0 }),
    validate
  ], createBundle);

router.route('/:id')
  .get(getBundle)
  .put(protect, authorize('admin'), updateBundle)
  .delete(protect, authorize('admin'), deleteBundle);

module.exports = router;
