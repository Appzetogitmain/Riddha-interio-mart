const express = require('express');
const {
  getPromoCards,
  createPromoCard,
  updatePromoCard,
  deletePromoCard,
  reorderPromoCards
} = require('../controllers/promoCardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getPromoCards)
  .post(protect, authorize('admin'), createPromoCard);

router.route('/reorder')
  .put(protect, authorize('admin'), reorderPromoCards);

router.route('/:id')
  .put(protect, authorize('admin'), updatePromoCard)
  .delete(protect, authorize('admin'), deletePromoCard);

module.exports = router;
