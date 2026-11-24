const mongoose = require('mongoose');

// One purchased banner campaign: payment + creative + moderation + stats.
const CategoryBannerAdSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.ObjectId, ref: 'Seller', required: true, index: true },
  plan: { type: mongoose.Schema.ObjectId, ref: 'CategoryBannerPlan', required: true },
  categories: [{ type: mongoose.Schema.ObjectId, ref: 'Category' }],

  media: {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    width: Number,
    height: Number
  },
  altText: { type: String, default: '', trim: true, maxlength: 120 },
  linkUrl: { type: String, default: '', trim: true, maxlength: 500 },

  // PendingPayment -> PendingReview -> Active -> Expired   (or Rejected, refunded to wallet)
  status: {
    type: String,
    enum: ['PendingPayment', 'PendingReview', 'Active', 'Rejected', 'Expired'],
    default: 'PendingPayment',
    index: true
  },
  rejectionReason: { type: String, default: '' },
  startDate: Date,
  endDate: Date,

  paymentMethod: { type: String, enum: ['Wallet', 'Online'], required: true },
  amountPaid: { type: Number, required: true },
  razorpayOrderId: String,
  transactionId: String,
  refunded: { type: Boolean, default: false },

  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, { timestamps: true });

CategoryBannerAdSchema.index({ status: 1, categories: 1, endDate: 1 });

module.exports = mongoose.model('CategoryBannerAd', CategoryBannerAdSchema);
