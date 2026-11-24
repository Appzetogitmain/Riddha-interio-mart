const mongoose = require('mongoose');

// Permanent record of every manual change to rating / bestseller display (no TTL on purpose).
const ChangeSchema = new mongoose.Schema({
  field: { type: String, required: true },
  from: mongoose.Schema.Types.Mixed,
  to: mongoose.Schema.Types.Mixed
}, { _id: false });

const ProductDisplayAuditSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', default: null, index: true }, // null = global settings
  productName: { type: String, default: '' },
  action: { type: String, enum: ['override_update', 'override_reset', 'settings_update'], required: true },
  changes: [ChangeSchema],
  adminId: { type: mongoose.Schema.ObjectId, required: true },
  adminName: { type: String, default: '' },
  ipAddress: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

ProductDisplayAuditSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProductDisplayAudit', ProductDisplayAuditSchema);
