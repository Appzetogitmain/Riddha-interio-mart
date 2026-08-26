const mongoose = require('mongoose');

// One seller's slot in the bulk-order distribution: admin assigns, seller responds with
// their own availability/pricing/delivery estimate (or rejects), admin then picks the
// best response to send back to the customer as the final offer.
const AssignmentSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  matchType: { type: String, enum: ['product', 'category'], default: 'category' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  availableQuantity: { type: Number },
  unitPrice: { type: Number },
  deliveryEstimate: { type: String },
  notes: { type: String },
  assignedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
}, { _id: true });

const bulkOrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    quantity: { type: Number },
    category: { type: String }
  }],
  message: { type: String },
  status: { type: String, default: 'Pending' },

  // Seller distribution
  assignments: [AssignmentSchema],

  // The assignment (by _id, within assignments[]) admin picked as the final offer
  finalAssignment: { type: mongoose.Schema.Types.ObjectId },
  offerSentAt: { type: Date },
  customerConfirmedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
