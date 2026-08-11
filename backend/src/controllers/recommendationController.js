const mongoose = require('mongoose');
const Product = require('../models/Product');
const RecommendationEvent = require('../models/RecommendationEvent');
const {
  getSimilarProducts,
  getCrossSellProducts,
  getUpsellProducts,
  getBlendedProducts
} = require('../utils/recommendationEngine');

// @desc    Get AI-based product recommendations for a product
// @route   GET /api/recommendations/products
// @access  Public
exports.getRecommendations = async (req, res) => {
  try {
    const { productId, limit = 6, type = 'blended' } = req.query;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'A valid productId is required' });
    }

    const cappedLimit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 20);

    const product = await Product.findById(productId).populate('category', 'name').lean();
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let recommendations;
    switch (type) {
      case 'similar':
        recommendations = await getSimilarProducts(product, cappedLimit);
        break;
      case 'cross-sell':
        recommendations = await getCrossSellProducts(product, cappedLimit);
        break;
      case 'upsell':
        recommendations = await getUpsellProducts(product, cappedLimit);
        break;
      default:
        recommendations = await getBlendedProducts(product, cappedLimit);
    }

    // Fire-and-forget impression tracking; never block the response on analytics.
    RecommendationEvent.create({
      user: req.user?._id || null,
      sourceProduct: product._id,
      recommendationType: type === 'similar' || type === 'cross-sell' || type === 'upsell' ? type : 'blended',
      action: 'impression'
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Track a recommendation interaction (click / add_to_cart / purchase)
// @route   POST /api/recommendations/events
// @access  Public (optionally authenticated)
exports.trackEvent = async (req, res) => {
  try {
    const { productId, targetProductId, recommendationType, action = 'click' } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'A valid productId is required' });
    }
    if (!recommendationType) {
      return res.status(400).json({ success: false, error: 'recommendationType is required' });
    }

    const event = await RecommendationEvent.create({
      user: req.user?._id || null,
      sourceProduct: productId,
      targetProduct: targetProductId && mongoose.Types.ObjectId.isValid(targetProductId) ? targetProductId : null,
      recommendationType,
      action
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
