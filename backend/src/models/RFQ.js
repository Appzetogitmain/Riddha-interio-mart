const mongoose = require('mongoose');
const { RFQ_STATUSES, RFQ_STATUS } = require('../utils/rfqStateMachine');

/** Units a B2B buyer actually quotes interior material in. */
const RFQ_UNITS = ['sq.ft', 'sq.m', 'pcs', 'nos', 'kg', 'box', 'rft', 'set'];

const RFQLineItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.ObjectId, ref: 'Product', default: null },
  productDescription: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: [0.0001, 'Quantity must be greater than zero'] },
  unit: { type: String, enum: RFQ_UNITS, required: true },
  size: { type: String, default: '' },
  finish: { type: String, default: '' },
  brandPreference: { type: String, default: '' },
  application: { type: String, default: '' },
  // Set by the AI parser when the line came from free text / an uploaded file.
  matchConfidence: { type: String, enum: ['high', 'medium', 'low'], default: 'high' }
});

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: RFQ_STATUSES, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.ObjectId, default: null },
  changedByRole: { type: String, enum: ['user', 'seller', 'admin', 'system'], default: 'system' },
  note: { type: String, default: '' }
}, { _id: false });

const RoutedToSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.ObjectId, ref: 'Seller', required: true },
  routedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date, default: null },
  quotationId: { type: mongoose.Schema.ObjectId, ref: 'Quotation', default: null },
  declinedAt: { type: Date, default: null },
  declineReason: { type: String, default: '' }
}, { _id: false });

const AttachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  sizeBytes: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const RFQSchema = new mongoose.Schema({
  rfqNumber: { type: String, required: true, unique: true, index: true },

  customerId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  // Requirement D (Contractor Accounts) is not built yet — kept nullable so the
  // link can be backfilled without a migration once that module lands.
  contractorAccountId: { type: mongoose.Schema.ObjectId, default: null },
  projectId: { type: mongoose.Schema.ObjectId, ref: 'Project', default: null },

  lineItems: {
    type: [RFQLineItemSchema],
    validate: [
      {
        validator: (items) => Array.isArray(items) && items.length >= 1,
        message: 'An RFQ needs at least 1 line item.'
      },
      {
        validator: (items) => items.length <= 50,
        message: 'An RFQ cannot contain more than 50 line items.'
      }
    ]
  },

  deliveryLocation: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, required: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  requiredDate: { type: Date, required: true },
  projectName: { type: String, default: '' },
  specialRequirements: { type: String, default: '' },
  budgetRange: {
    min: { type: Number, default: null },
    max: { type: Number, default: null }
  },

  // Auto-filled from the customer's business profile at submission time.
  companyName: { type: String, default: '' },
  gstin: { type: String, default: '' },

  attachments: { type: [AttachmentSchema], default: [] },

  status: { type: String, enum: RFQ_STATUSES, default: RFQ_STATUS.SUBMITTED, index: true },
  statusHistory: { type: [StatusHistorySchema], default: [] },
  rejectionReason: { type: String, default: '' },

  routedTo: { type: [RoutedToSchema], default: [] },
  routedToAdmin: { type: Boolean, default: false },
  quotations: [{ type: mongoose.Schema.ObjectId, ref: 'Quotation' }],
  acceptedQuotationId: { type: mongoose.Schema.ObjectId, ref: 'Quotation', default: null },
  convertedOrderId: { type: mongoose.Schema.ObjectId, ref: 'Order', default: null },

  aiParsed: {
    rawInput: { type: String, default: '' },
    parsedAt: { type: Date, default: null },
    ambiguities: { type: [String], default: [] },
    clarificationQuestions: { type: [String], default: [] }
  },

  // Estimated value, used by the routing threshold rule.
  estimatedValue: { type: Number, default: 0 },

  slaDueAt: { type: Date, default: null },
  slaBreachedAt: { type: Date, default: null },
  slaEscalatedAt: { type: Date, default: null },
  firstResponseAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }
}, {
  timestamps: true
});

RFQSchema.index({ customerId: 1, createdAt: -1 });
RFQSchema.index({ status: 1, slaDueAt: 1 });
RFQSchema.index({ 'routedTo.sellerId': 1 });
RFQSchema.index({ status: 1, expiresAt: 1 });

RFQSchema.virtual('lineItemCount').get(function () {
  return Array.isArray(this.lineItems) ? this.lineItems.length : 0;
});

RFQSchema.set('toJSON', { virtuals: true });
RFQSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RFQ', RFQSchema);
module.exports.RFQ_UNITS = RFQ_UNITS;
