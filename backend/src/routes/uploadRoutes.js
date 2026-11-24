const express = require('express');
const fs = require('fs');
const { removeBackground } = require('@imgly/background-removal-node');
const { protect, authorize } = require('../middleware/auth');
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
      if (req.query.removeBg === 'true') {
        try {
          console.log(`[Background Removal] Processing file: ${file.path}`);
          const { pathToFileURL } = require('url');
          const fileUrl = pathToFileURL(file.path).href;
          const blob = await removeBackground(fileUrl);
          const buffer = Buffer.from(await blob.arrayBuffer());
          await fs.promises.writeFile(file.path, buffer);
          console.log(`[Background Removal] Completed for file: ${file.path}`);
        } catch (bgError) {
          console.error('[Background Removal] Failed for image:', file.path, bgError.message);
          // Fallback: continue with original image if background removal fails
        }
      }

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

// @desc    Upload category-banner artwork (image or video). Enforces the banner ratio on the server
// @route   POST /api/upload/banner-media
// @access  Private (seller / admin)
router.post('/banner-media', protect, authorize('seller', 'admin'), uploadRateLimiter, uploadParser.single('media'), validateUploadedFiles, async (req, res) => {
  const spec = require('../utils/bannerSpec');
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'Please choose an image or video' });
  const ext = require('path').extname(file.originalname).toLowerCase();
  const isVideo = ['.mp4', '.mov'].includes(ext);
  const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  let uploaded = null;
  try {
    if (!isVideo && !isImage) {
      return res.status(400).json({ success: false, error: 'Use a JPG, PNG or WEBP image, or an MP4/MOV video' });
    }
    uploaded = await cloudinary.uploader.upload(file.path, isVideo
      ? { folder: 'riddha_mart/banners', resource_type: 'video' }
      : { folder: 'riddha_mart/banners', image_metadata: false, transformation: [{ width: 2400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] });

    const { width, height } = uploaded;
    const ratio = width / height;
    const off = Math.abs(ratio - spec.RATIO) / spec.RATIO;
    let problem = null;
    if (off > spec.RATIO_TOLERANCE) {
      problem = `Wrong shape (${width} x ${height}). Banners must be ${spec.RECOMMENDED} (16:5) so nothing is cut off.`;
    } else if (width < spec.MIN_WIDTH) {
      problem = `Too small (${width}px wide). Minimum width is ${spec.MIN_WIDTH}px; recommended ${spec.RECOMMENDED}.`;
    } else if (isVideo && uploaded.duration && uploaded.duration > spec.MAX_VIDEO_SECONDS) {
      problem = `Video is too long (${Math.round(uploaded.duration)}s). Maximum is ${spec.MAX_VIDEO_SECONDS} seconds.`;
    }
    if (problem) {
      await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: isVideo ? 'video' : 'image' }).catch(() => {});
      return res.status(400).json({ success: false, error: problem });
    }

    res.json({ success: true, data: { url: uploaded.secure_url, type: isVideo ? 'video' : 'image', width, height } });
  } catch (error) {
    console.error('[Banner Upload] failed:', error.message);
    res.status(500).json({ success: false, error: 'Banner upload failed. Please try again.' });
  } finally {
    cleanupLocalFiles([file]);
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
    const isImage = req.file.mimetype.startsWith('image');
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'riddha_mart/images',
      resource_type: 'auto',
      image_metadata: false, // strips EXIF metadata
      transformation: isImage ? [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ] : undefined
    });

    console.log(`[Upload Audit] Single upload success. User: ${req.user.id}. Url: ${result.secure_url}`);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('[Secure Upload] Single upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'File upload processing failed.' });
  } finally {
    cleanupLocalFiles(req.file);
  }
});

module.exports = router;
