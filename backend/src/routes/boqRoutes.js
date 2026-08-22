const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  createBOQ,
  getBOQs,
  getBOQById,
  updateBOQ,
  addItemToBOQ,
  updateBOQItem,
  deleteBOQItem,
  extractFromDrawing,
  generateFromBrief,
  exportBOQPDF,
  exportBOQCSV,
  emailBOQ,
  enhanceItemDescription,
  deleteBOQ,
  requestItemSourcing,
  requestAllUnlistedSourcing,
  getAdminSourcingRequests,
  updateAdminSourcingStatus
} = require('../controllers/boqController');

const storage = multer.memoryStorage();
const ALLOWED_DRAWING_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DRAWING_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a JPG, PNG, WEBP image or a PDF file.'));
    }
  }
});

router.use(protect);

// Admin Procurement Sourcing Routes
router.get('/admin/sourcing-requests', getAdminSourcingRequests);
router.put('/admin/sourcing-requests/:boqId/items/:itemId', updateAdminSourcingStatus);

router.post('/', createBOQ);
router.get('/', getBOQs);
router.post('/upload-drawing', upload.single('drawing'), extractFromDrawing);
router.post('/from-brief/:briefId', generateFromBrief);
router.get('/:boqId', getBOQById);
router.put('/:boqId', updateBOQ);
router.delete('/:boqId', deleteBOQ);

// Items CRUD & Sourcing
router.post('/:boqId/items', addItemToBOQ);
router.put('/:boqId/items/:itemId', updateBOQItem);
router.delete('/:boqId/items/:itemId', deleteBOQItem);
router.post('/:boqId/items/:itemId/enhance-description', enhanceItemDescription);
router.post('/:boqId/items/:itemId/request-sourcing', requestItemSourcing);
router.post('/:boqId/request-all-sourcing', requestAllUnlistedSourcing);

// Export & Email
router.get('/:boqId/export', exportBOQPDF);
router.get('/:boqId/export/pdf', exportBOQPDF);
router.get('/:boqId/export/csv', exportBOQCSV);
router.post('/:boqId/email', emailBOQ);

module.exports = router;
