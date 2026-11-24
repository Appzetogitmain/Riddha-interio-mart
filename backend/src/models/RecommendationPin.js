const mongoose = require('mongoose');

// Admin-curated product shown in a specific storefront recommendation tab.
const RecommendationPinSchema = new mongoose.Schema({
  tab: { type: String, enum: ['personalized', 'trending', 'cross-sell'], required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

RecommendationPinSchema.index({ tab: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('RecommendationPin', RecommendationPinSchema);
