const mongoose = require('mongoose');
const OFFER_TYPES = require('../constants/offerTypes');

const OfferSchema = new mongoose.Schema({
  type: { type: String, enum: OFFER_TYPES, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  createdBy: { type: mongoose.Schema.ObjectId, required: true, refPath: 'creatorType' },
  creatorType: { type: String, enum: ['Seller', 'Admin'], required: true },

  products: [{ type: mongoose.Schema.ObjectId, ref: 'Product', required: true }],

  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  isActive: { type: Boolean, default: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Pricing impact — how this offer changes the product's displayed price.
  // 'percentage' / 'flat' = discount off current price. 'fixedPrice' = directly set new price.
  // discountValue's meaning depends on discountType:
  //   percentage -> % off, flat -> amount off, fixedPrice -> the new price itself.
  discountType: { type: String, enum: ['percentage', 'flat', 'fixedPrice'], required: true },
  discountValue: { type: Number, required: true, min: 0 },

  minQuantity: { type: Number },       // Bulk Purchase Discount only
  couponCode: { type: String, trim: true, uppercase: true }, // Coupon only
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  comboPrice: { type: Number }         // Combo Offers only
}, { timestamps: true });

OfferSchema.index({ type: 1, isActive: 1, approvalStatus: 1, startDate: 1, endDate: 1 });
OfferSchema.index({ products: 1 });
OfferSchema.index({ createdBy: 1, creatorType: 1 });
OfferSchema.index({ couponCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Offer', OfferSchema);
