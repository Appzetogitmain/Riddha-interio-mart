const mongoose = require('mongoose');

const ProductBatchSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Seller',
    required: true
  },
  sellerName: { type: String, default: '' },
  shopName: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending_review', 'in_progress', 'completed'],
    default: 'pending_review'
  },
  totalProducts: { type: Number, default: 0 },
  approvedCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  products: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      rejectionReason: { type: String, default: '' },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' }
    }
  ]
}, { timestamps: true });

ProductBatchSchema.index({ seller: 1, submittedAt: -1 });
ProductBatchSchema.index({ status: 1 });

module.exports = mongoose.model('ProductBatch', ProductBatchSchema);
