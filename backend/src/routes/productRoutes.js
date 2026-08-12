const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  getSellerProducts,
  deleteProduct,
  updateProduct,
  updateApprovalStatus,
  updateBulkStock,
  getSearchSuggestions,
  checkProductSku,
  generateHSNCodeHandler,
  generateProductContentHandler
} = require('../controllers/productController');
const { protect, authorize, tryProtect } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Include other resource routers
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:productId/reviews', reviewRouter);

router.get('/check-sku/:sku', protect, authorize('seller', 'admin'), checkProductSku);

router.post('/generate-hsn', protect, authorize('seller', 'admin'), generateHSNCodeHandler);
router.post('/generate-content', protect, authorize('seller', 'admin'), generateProductContentHandler);


router.route('/')
  .get(tryProtect, getProducts)
  .post(protect, authorize('seller', 'admin'), [
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric(),
    check('category', 'Category is required').not().isEmpty(),
    validate
  ], createProduct);

const multer = require('multer');
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const { aiImageSearch } = require('../controllers/aiSearchController');
const { aiRoomVisualize } = require('../controllers/roomVisualizerController');
const { generateAiMoodBoard } = require('../controllers/moodBoardController');

router.post('/ai-image-search', uploadMemory.single('image'), aiImageSearch);
router.post('/ai-room-visualize', uploadMemory.single('image'), aiRoomVisualize);
router.post('/ai-mood-board', generateAiMoodBoard);

router.get('/search/suggestions', tryProtect, getSearchSuggestions);

router.post('/bulk', protect, authorize('seller', 'admin'), require('../controllers/productController').createBulkProducts);

router.patch('/bulk-stock', protect, authorize('seller', 'admin'), [
  check('updates', 'Updates array is required').isArray({ min: 1 }),
  validate
], updateBulkStock);

router.get('/my-products', protect, authorize('seller', 'admin'), getSellerProducts);

router.put('/:id/approval', protect, authorize('admin'), updateApprovalStatus);

router.route('/:id')
  .get(tryProtect, getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .patch(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
