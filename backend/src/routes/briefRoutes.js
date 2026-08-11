const express = require('express');
const router = express.Router();
const {
  startBrief,
  saveAnswer,
  generateBrief,
  getBrief,
  getBriefStatus,
  updateBrief,
  exportBriefPdf,
  approveBrief,
  shareBrief,
  listBriefs
} = require('../controllers/briefController');

const { protect, tryProtect } = require('../middleware/auth');

router.route('/')
  .get(tryProtect, listBriefs);

router.route('/start')
  .post(tryProtect, startBrief);

router.route('/:briefId')
  .get(tryProtect, getBrief)
  .put(tryProtect, updateBrief);

router.route('/:briefId/answer')
  .post(tryProtect, saveAnswer);

router.route('/:briefId/generate')
  .post(tryProtect, generateBrief);

router.route('/:briefId/status')
  .get(tryProtect, getBriefStatus);

router.route('/:briefId/export')
  .post(tryProtect, exportBriefPdf);

router.route('/:briefId/approve')
  .post(tryProtect, approveBrief);

router.route('/:briefId/share')
  .post(tryProtect, shareBrief);

module.exports = router;
