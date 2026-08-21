const mongoose = require('mongoose');
const { SAMPLE_STATUSES, SAMPLE_STATUS } = require('../utils/rfqStateMachine');

const SampleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
  productName: { type: String, default: '' },
  variantId: { type: String, default: '' },
  shade: { type: String, default: '' },
  quantity: { type: Number, default: 1, min: 1 },
  // Snapshot so a later product price change never rewrites a past request.
  chargeAtRequest: { type: Number, default: 0 }
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: SAMPLE_STATUSES, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.ObjectId, default: null },
  changedByRole: { type: String, enum: ['user', 'seller', 'admin', 'system'], default: 'system' },
  note: { type: String, default: '' }
}, { _id: false });

const SampleRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },

  items: {
    type: [SampleItemSchema],
    validate: [
      {
        validator: (items) => Array.isArray(items) && items.length >= 1,
        message: 'A sample request needs at least 1 product.'
      },
      {
        validator: (items) => items.length <= 5,
        message: 'A sample request is limited to 5 products.'
      }
    ]
  },

  deliveryAddress: {
    fullName: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    pincode: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    fullAddress: { type: String, required: true },
    landmark: { type: String, default: '' }
  },

  companyName: { type: String, default: '' },
  gstin: { type: String, default: '' },
  purpose: {
    type: String,
    enum: ['personal', 'project', 'client_presentation', 'comparison'],
    default: 'personal'
  },
  notes: { type: String, default: '' },

  status: { type: String, enum: SAMPLE_STATUSES, default: SAMPLE_STATUS.REQUESTED, index: true },
  statusHistory: { type: [StatusHistorySchema], default: [] },
  declineReason: { type: String, default: '' },
  autoApproved: { type: Boolean, default: false },

  // Rules engine outcome captured at request time.
  chargeAmount: { type: Number, default: 0 },
  chargeRefunded: { type: Boolean, default: false },
  refundedAgainstOrderId: { type: mongoose.Schema.ObjectId, ref: 'Order', default: null },
  freeQuotaUsed: { type: Boolean, default: false },

  // Requirement #13 — samples ride the normal order tracking pipeline.
  trackingOrderId: { type: mongoose.Schema.ObjectId, ref: 'Order', default: null },
  courier: {
    partnerName: { type: String, default: '' },
    awb: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    dispatchedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }
  },

  feedback: {
    verdict: { type: String, enum: ['like', 'dislike', 'need_different_shade', null], default: null },
    comment: { type: String, default: '' },
    givenAt: { type: Date, default: null },
    // Populated by AI when the verdict is need_different_shade.
    suggestedAlternates: [{
      productId: { type: mongoose.Schema.ObjectId, ref: 'Product' },
      name: { type: String, default: '' },
      reason: { type: String, default: '' }
    }]
  },
  followUpSentAt: { type: Date, default: null }
}, {
  timestamps: true
});

SampleRequestSchema.index({ customerId: 1, createdAt: -1 });
SampleRequestSchema.index({ status: 1, createdAt: -1 });
SampleRequestSchema.index({ 'items.productId': 1 });
// Drives the "3 days after delivery" follow-up sweep.
SampleRequestSchema.index({ status: 1, followUpSentAt: 1, 'courier.deliveredAt': 1 });

module.exports = mongoose.model('SampleRequest', SampleRequestSchema);
