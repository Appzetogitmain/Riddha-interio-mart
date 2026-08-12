const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  loadFromEstimate,
  loadFromBOQ,
  generateAIEnhancements,
  exportQuotationPDF,
  emailQuotation,
  updateQuotationStatus,
  saveQuotationTemplate,
  getQuotationTemplates,
  getQuotationAnalytics
} = require('../controllers/quotationController');

router.use(protect);

router.post('/', createQuotation);
router.get('/', getQuotations);
router.post('/ai-enhance', generateAIEnhancements);
router.get('/templates', getQuotationTemplates);
router.post('/templates', saveQuotationTemplate);
router.get('/analytics/dashboard', getQuotationAnalytics);

router.get('/:quotationId', getQuotationById);
router.put('/:quotationId', updateQuotation);
router.delete('/:quotationId', deleteQuotation);

router.post('/:quotationId/load-estimate', loadFromEstimate);
router.post('/:quotationId/load-boq', loadFromBOQ);
router.get('/:quotationId/export', exportQuotationPDF);
router.get('/:quotationId/export/pdf', exportQuotationPDF);
router.post('/:quotationId/send', emailQuotation);
router.put('/:quotationId/status', updateQuotationStatus);

module.exports = router;
