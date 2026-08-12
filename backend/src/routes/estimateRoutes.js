const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  getTierComparison,
  exportEstimatePDF,
  emailEstimate,
  saveAsTemplate,
  getTemplates,
  deleteEstimate,
  getCostingRates,
  updateCostingRate
} = require('../controllers/estimateController');

router.use(protect);

router.post('/', createEstimate);
router.get('/', getEstimates);
router.get('/templates', getTemplates);
router.get('/rates', getCostingRates);
router.put('/rates/:rateId', updateCostingRate);
router.get('/:estimateId', getEstimateById);
router.put('/:estimateId', updateEstimate);
router.get('/:estimateId/comparison', getTierComparison);
router.get('/:estimateId/export', exportEstimatePDF);
router.get('/:estimateId/pdf', exportEstimatePDF);
router.post('/:estimateId/email', emailEstimate);
router.post('/:estimateId/save-template', saveAsTemplate);
router.delete('/:estimateId', deleteEstimate);

module.exports = router;
