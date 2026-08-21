const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  parseRFQ,
  createRFQ,
  getRFQs,
  getRFQById,
  updateRFQ,
  uploadAttachments,
  routeRFQ,
  submitQuote,
  postMessage,
  getMessages,
  acceptQuotation,
  rejectRFQ,
  convertToOrder,
  getAnalytics
} = require('../controllers/rfqController');

// Drawings and BOQs: PDF, XLSX, JPG, PNG, DWG — up to 5 files of 25MB each.
const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xlsm', '.xls', '.csv', '.txt', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 5;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`"${ext || 'This file type'}" is not accepted. Upload PDF, XLSX, JPG, PNG or DWG files.`));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter
});

/** Turn multer's terse errors into the API's standard error envelope. */
const handleUploadErrors = (handler) => (req, res, next) => {
  handler(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'Each file must be 25MB or smaller.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, error: 'You can attach at most 5 files to an RFQ.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  });
};

router.use(protect);

// Static paths first so "analytics" is never read as an :rfqId.
router.get('/analytics', authorize('admin'), getAnalytics);
router.post('/parse', handleUploadErrors(upload.single('file')), parseRFQ);

router.route('/')
  .post(createRFQ)
  .get(getRFQs);

router.route('/:rfqId')
  .get(getRFQById)
  .put(updateRFQ);

router.post('/:rfqId/attachments', handleUploadErrors(upload.array('files', MAX_FILES)), uploadAttachments);
router.post('/:rfqId/route', authorize('admin'), routeRFQ);
router.post('/:rfqId/quote', authorize('seller', 'admin'), submitQuote);

router.route('/:rfqId/messages')
  .post(postMessage)
  .get(getMessages);

router.post('/:rfqId/accept', acceptQuotation);
router.post('/:rfqId/reject', rejectRFQ);
router.post('/:rfqId/convert', convertToOrder);

module.exports = router;
