const mongoose = require('mongoose');

const BundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a bundle name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  roomType: {
    type: String,
    enum: ['living', 'bedroom', 'bathroom', 'kitchen', 'office', 'dining', 'outdoor', null],
    default: null
  },
  products: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  bundlePrice: {
    type: Number,
    required: [true, 'Please add a bundle price']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please add the original (sum of parts) price']
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  // Companion single-line-item Product auto-synced from this bundle so it can be
  // added to cart/checkout through the existing product pipeline unchanged.
  virtualProduct: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: null
  },
  validUntil: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    default: null
  },
  analytics: {
    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

BundleSchema.index({ isActive: 1, roomType: 1 });

module.exports = mongoose.model('Bundle', BundleSchema);
