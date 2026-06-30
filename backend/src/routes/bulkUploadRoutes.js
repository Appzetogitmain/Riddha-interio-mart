const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { bulkUpload } = require('../controllers/bulkUploadController');
const { protect, authorize } = require('../middleware/auth'); // Adjust if auth middleware is different

// Temp storage for multer
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/bulk-upload', 
  // protect, authorize('admin'), // Commented out for dev, enable in production or if middleware exists
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'images', maxCount: 1 }]), 
  bulkUpload
);

module.exports = router;
