const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const antivirusService = require('../services/antivirusService');

// Create temp_uploads directory if it doesn't exist
const TEMP_DIR = path.join(__dirname, '../../temp_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 1. Upload Rate Limiter: Max 500 requests per 15 minutes per IP
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit to allow bulk subcategory uploads
  message: {
    success: false,
    error: 'Too many file upload requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Local Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Prevent path traversal and sanitize filename
    const safeBaseName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeBaseName}${ext}`);
  }
});

// 3. Size Limits: 5MB for images/docs, 50MB for videos
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// 4. File Magic Numbers / Signatures Verification
const ALLOWED_SIGNATURES = {
  // JPG / JPEG
  'ffd8ff': { mime: 'image/jpeg', ext: ['.jpg', '.jpeg'] },
  // PNG
  '89504e47': { mime: 'image/png', ext: ['.png'] },
  // WEBP
  '52494646': { mime: 'image/webp', ext: ['.webp'] }, // RIFF header for webp
  // PDF
  '25504446': { mime: 'application/pdf', ext: ['.pdf'] }
};

const ALLOWED_HEIF_EXTENSIONS = ['.heic', '.heif', '.avif'];
const ALLOWED_HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif', 'avis'];

/**
 * Validates the binary header signature of a file.
 * Also handles MP4 / MOV checks (which contain 'ftyp' markers within the first 12 bytes).
 */
const validateFileSignature = (filePath, originalExt) => {
  if (!fs.existsSync(filePath)) return false;

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(12);
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  const hexSignature = buffer.toString('hex', 0, 4).toLowerCase();
  const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'];

  // 1. Check match in static signatures (Images, PDFs) using prefix matching
  const matchingKey = Object.keys(ALLOWED_SIGNATURES).find(key => hexSignature.startsWith(key));
  if (matchingKey) {
    const config = ALLOWED_SIGNATURES[matchingKey];
    if (config.mime.startsWith('image/') && validImageExts.includes(originalExt.toLowerCase())) {
      return true;
    }
    return config.ext.includes(originalExt.toLowerCase());
  }

  // WEBP check (starts with RIFF '52494646' and has WEBP '57454250' at index 8)
  if (buffer.toString('hex', 0, 4) === '52494646' && buffer.toString('hex', 8, 12) === '57454250') {
    return validImageExts.includes(originalExt.toLowerCase());
  }

  // 2. Check HEIC / HEIF formats (ISO BMFF with HEIF brands)
  const ftypHex = buffer.toString('hex', 4, 8);
  const isoBrand = buffer.toString('ascii', 8, 12).toLowerCase();
  if (ftypHex === '66747970' && ALLOWED_HEIF_BRANDS.includes(isoBrand)) {
    return ALLOWED_HEIF_EXTENSIONS.includes(originalExt.toLowerCase());
  }

  // 3. Check MP4 / MOV formats (starts with 'ftyp' at bytes 4-8)
  if (ftypHex === '66747970') { // 'ftyp' in ASCII
    const allowedVideoExts = ['.mp4', '.mov', '.avi'];
    return allowedVideoExts.includes(originalExt.toLowerCase());
  }

  return false;
};

// Multer instance for parsing incoming request payloads
const uploadParser = multer({
  storage: storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE // Enforce overall 50MB absolute cap at parsing level
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.mp4', '.mov', '.avi', '.pdf'];

    // Extension validation
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Extension not allowed: ${ext}. Supported types: Images (JPG, PNG, WEBP, HEIC, HEIF, AVIF), Videos (MP4, MOV), and PDFs.`), false);
    }
    cb(null, true);
  }
});

/**
 * Dedicated secure upload validation middleware.
 * Inspects all parsed files in memory/disk before streaming to Cloudinary.
 */
const validateUploadedFiles = async (req, res, next) => {
  // Collect all files uploaded under bulk or single formats
  const filesList = [];
  if (req.file) {
    filesList.push(req.file);
  }
  if (req.files) {
    Object.keys(req.files).forEach(fieldName => {
      filesList.push(...req.files[fieldName]);
    });
  }

  if (filesList.length === 0) {
    return next();
  }

  for (const file of filesList) {
    const ext = path.extname(file.originalname).toLowerCase();
    const filePath = file.path;

    // 1. File size validation based on category
    const isVideo = ['.mp4', '.mov', '.avi'].includes(ext);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (file.size > maxSize) {
      cleanupLocalFiles(filesList);
      return res.status(400).json({
        success: false,
        error: `File size limit exceeded for ${file.originalname}. Max limit is ${isVideo ? '50MB' : '5MB'}.`
      });
    }

    // 2. Binary signature (magic numbers) validation
    const signatureMatch = validateFileSignature(filePath, ext);
    if (!signatureMatch) {
      cleanupLocalFiles(filesList);
      return res.status(400).json({
        success: false,
        error: `File signature mismatch or dangerous masqueraded file detected for: ${file.originalname}`
      });
    }

    // 3. Antivirus scan pipeline
    const scanResult = await antivirusService.scanFile(filePath);
    if (!scanResult.safe) {
      cleanupLocalFiles(filesList);
      console.warn(`[Security Alert] Malicious payload rejected: ${scanResult.reason}`);
      return res.status(400).json({
        success: false,
        error: 'File upload blocked: Malicious content or executable script detected in payload.'
      });
    }
  }

  next();
};

/**
 * Safe local cleanup helper to delete processed files under all outcomes.
 */
const cleanupLocalFiles = (files) => {
  if (!files) return;
  const list = Array.isArray(files) ? files : [files];
  for (const file of list) {
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error('[Upload Security] Failed to cleanup local file:', err.message);
    }
  }
};

module.exports = {
  uploadRateLimiter,
  uploadParser,
  validateUploadedFiles,
  cleanupLocalFiles
};
