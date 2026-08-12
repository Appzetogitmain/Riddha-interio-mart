const mongoose = require('mongoose');

const RecommendationEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  sourceProduct: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  targetProduct: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    default: null
  },
  recommendationType: {
    type: String,
    enum: ['similar', 'cross-sell', 'upsell', 'blended', 'complete-room', 'bundle'],
    required: true
  },
  action: {
    type: String,
    enum: ['impression', 'click', 'add_to_cart', 'purchase'],
    default: 'impression'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

RecommendationEventSchema.index({ sourceProduct: 1, recommendationType: 1 });
// Auto-purge analytics events after 180 days to keep the collection bounded.
RecommendationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('RecommendationEvent', RecommendationEventSchema);
