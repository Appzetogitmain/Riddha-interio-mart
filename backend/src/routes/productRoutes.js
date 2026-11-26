const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  getSellerProducts,
  deleteProduct,
  updateProduct,
  updateApprovalStatus,
  bulkPublishProducts,
  publishProduct,
  updateBulkStock,
  getSearchSuggestions,
  checkProductSku,
  generateHSNCodeHandler,
  generateProductContentHandler,
  generateColourVariantsHandler,
  analyzeProductPhotoHandler,
  generateSellerAiImagesHandler,
  smartSearch
} = require('../controllers/productController');
const { protect, authorize, tryProtect } = require('../middleware/auth');
const { downloadTemplate, exportProducts, importProducts } = require('../controllers/productCsvController');

const csvMulter = require('multer');
const csvUpload = csvMulter({
  storage: csvMulter.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /\.csv$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .csv files are allowed'), ok);
  }
});
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Include other resource routers
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:productId/reviews', reviewRouter);

// CSV bulk upload / export (admin only). Must stay above any '/:id' route.
router.get('/bulk/template', protect, authorize('admin'), downloadTemplate);
router.get('/bulk/export', protect, authorize('admin'), exportProducts);
router.post('/bulk/import', protect, authorize('admin'), csvUpload.single('file'), importProducts);
router.post('/bulk/publish', protect, authorize('admin'), bulkPublishProducts);

router.get('/check-sku/:sku', protect, authorize('seller', 'admin'), checkProductSku);

router.post('/generate-hsn', protect, authorize('seller', 'admin'), generateHSNCodeHandler);
router.post('/generate-content', protect, authorize('seller', 'admin'), generateProductContentHandler);
router.post('/generate-colour-variants', protect, authorize('seller', 'admin'), generateColourVariantsHandler);
router.post('/ai-scan-photo', protect, authorize('seller', 'admin'), analyzeProductPhotoHandler);
router.post('/ai-generate-images', protect, authorize('seller', 'admin'), generateSellerAiImagesHandler);


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
router.get('/smart-search', tryProtect, smartSearch);

router.post('/bulk', protect, authorize('seller', 'admin'), require('../controllers/productController').createBulkProducts);

router.patch('/bulk-stock', protect, authorize('seller', 'admin'), [
  check('updates', 'Updates array is required').isArray({ min: 1 }),
  validate
], updateBulkStock);

router.get('/my-products', protect, authorize('seller', 'admin'), getSellerProducts);

router.put('/:id/approval', protect, authorize('admin'), updateApprovalStatus);
router.patch('/:id/publish', protect, authorize('admin'), publishProduct);

router.route('/:id')
  .get(tryProtect, getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .patch(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
