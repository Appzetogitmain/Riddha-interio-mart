const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateContent,
  getContentById,
  getSellerContentLibrary,
  updateContent,
  deleteContent,
  publishContentToProduct,
  bulkGenerateContent,
  createContentTemplate,
  getSellerTemplates
} = require('../controllers/contentGeneratorController');

router.use(protect);

router.post('/generate', generateContent);
router.get('/seller/library', getSellerContentLibrary);
router.post('/bulk-generate', bulkGenerateContent);

router.post('/templates', createContentTemplate);
router.get('/templates', getSellerTemplates);

router.get('/:contentId', getContentById);
router.put('/:contentId', updateContent);
router.delete('/:contentId', deleteContent);
router.post('/:contentId/publish', publishContentToProduct);

module.exports = router;
