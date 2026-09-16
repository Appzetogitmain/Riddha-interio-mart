const mongoose = require('mongoose');

// An individual item assigned to this seller
const AssignedItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  requestedQuantity: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 },
  availableQuantity: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { _id: false });

// One seller's slot in the bulk-order distribution
const AssignmentSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  matchType: { type: String, enum: ['product', 'category'], default: 'category' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  items: { type: [AssignedItemSchema], default: [] },
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
