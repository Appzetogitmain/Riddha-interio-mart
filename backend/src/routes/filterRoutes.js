const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');

// @route   GET /api/filters/options
// @desc    Get available filter options
// @access  Public
router.get('/options', productController.getFilterOptions);

// @route   GET /api/filters/search
// @desc    Get products with advanced filtering
// @access  Public
router.get('/search', productController.getProductsWithFilters);

module.exports = router;
