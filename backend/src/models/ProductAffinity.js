const mongoose = require('mongoose');

const ProductAffinitySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
    index: true
  },

  userSegments: {
    style: [
      {
        style: { type: String },
        affinity: { type: Number, default: 0 }
      }
    ],
    priceRange: [
      {
        range: { type: String },
        affinity: { type: Number, default: 0 }
      }
    ],
    behavior: [
      {
        behavior: { type: String },
        affinity: { type: Number, default: 0 }
      }
    ]
  },

  frequentlyBoughtWith: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      count: { type: Number, default: 1 },
      coOccurrence: { type: Number, default: 0.1 }
    }
  ],

  frequentlyViewedWith: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      count: { type: Number, default: 1 },
      coOccurrence: { type: Number, default: 0.1 }
    }
  ],

  complementaryProducts: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  ],

  viewCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, {
  timestamps: true
});

ProductAffinitySchema.index({ 'userSegments.style.style': 1 });

module.exports = mongoose.model('ProductAffinity', ProductAffinitySchema);
