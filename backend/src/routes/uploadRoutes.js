const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  uploadRateLimiter, 
  uploadParser, 
  validateUploadedFiles, 
  cleanupLocalFiles 
} = require('../middleware/uploadSecurity');
const { cloudinary } = require('../config/cloudinary');

const router = express.Router();

// @desc    Upload multiple images and one video with premium security controls
// @route   POST /api/upload/bulk
// @access  Private
router.post('/bulk', protect, uploadRateLimiter, uploadParser.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), validateUploadedFiles, async (req, res) => {
  const localFiles = [];
  try {
    const images = req.files['images'] || [];
    const videoArray = req.files['video'] || [];
    localFiles.push(...images, ...videoArray);

    const imageUrls = [];
    let videoUrl = null;

    // Securely stream images to Cloudinary with compression, resizing, and metadata stripping
    for (const file of images) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'riddha_mart/images',
        image_metadata: false, // strips EXIF metadata
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      });
      imageUrls.push(result.secure_url);
    }

    // Securely stream video to Cloudinary with quality optimizations
    if (videoArray.length > 0) {
      const videoFile = videoArray[0];
      const result = await cloudinary.uploader.upload(videoFile.path, {
        folder: 'riddha_mart/videos',
        resource_type: 'video',
        image_metadata: false, // strips metadata
        transformation: [{ quality: 'auto' }]
      });
      videoUrl = result.secure_url;
    }

    // Log the successful upload audit trails
    console.log(`[Upload Audit] Bulk upload success. User: ${req.user.id}. Images: ${imageUrls.length}, Videos: ${videoUrl ? 1 : 0}`);

    res.status(200).json({
      success: true,
      images: imageUrls,
      videoUrl
    });
  } catch (error) {
    console.error('[Secure Upload] Bulk upload failed:', error.message);
    res.status(500).json({ success: false, error: 'File upload processing failed.' });
  } finally {
    // Absolutely guarantee the local temporary files are securely unlinked
    cleanupLocalFiles(localFiles);
  }
});

// @desc    Upload registration documents securely without authentication (for signup)
// @route   POST /api/upload/register-document
// @access  Public
router.post('/register-document', uploadRateLimiter, uploadParser.single('image'), validateUploadedFiles, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a file' });
  }

  try {
    const isImage = req.file.mimetype.startsWith('image');
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'riddha_mart/documents',
      image_metadata: false, // strips EXIF metadata
      transformation: isImage ? [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ] : undefined
    });

    console.log(`[Upload Audit] Public document upload success. Url: ${result.secure_url}`);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('[Secure Upload] Public document upload failed:', error.message);
    res.status(500).json({ success: false, error: 'File upload processing failed.' });
  } finally {
    cleanupLocalFiles(req.file);
  }
});

// @desc    Upload single image to Cloudinary (Legacy support) with premium security controls
// @route   POST /api/upload
// @access  Private
router.post('/', protect, uploadRateLimiter, uploadParser.single('image'), validateUploadedFiles, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a file' });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'riddha_mart/images',
      image_metadata: false, // strips EXIF metadata
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log(`[Upload Audit] Single upload success. User: ${req.user.id}. Url: ${result.secure_url}`);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('[Secure Upload] Single upload failed:', error.message);
    res.status(500).json({ success: false, error: 'File upload processing failed.' });
  } finally {
    cleanupLocalFiles(req.file);
  }
});

module.exports = router;
