const mongoose = require('mongoose');

const QuotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Pieces' },
  unitRate: { type: Number, required: true, default: 0 },
  amount: { type: Number, default: 0 },
  hsnCode: { type: String, default: '' },
  taxRate: { type: Number, default: 18 }, // 0, 5, 12, 18
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  productId: { type: mongoose.Schema.ObjectId, ref: 'Product' }
});

const QuotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  estimateId: {
    type: mongoose.Schema.ObjectId,
    ref: 'CostEstimate'
  },
  boqId: {
    type: mongoose.Schema.ObjectId,
    ref: 'BOQ'
  },

  // Quote Metadata
  clientName: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  projectName: { type: String, default: 'Interior Design Project' },
  quoteDate: { type: Date, default: Date.now },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
  },

  // Items
  items: [QuotationItemSchema],

  // Pricing & Taxes
  pricing: {
    subtotal: { type: Number, default: 0 },
    discounts: {
      lineItemDiscounts: { type: Number, default: 0 },
      globalDiscountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
      globalDiscountValue: { type: Number, default: 0 },
      globalDiscountAmount: { type: Number, default: 0 }
    },
    subtotalAfterDiscount: { type: Number, default: 0 },
    taxes: {
      sgst5: { type: Number, default: 0 },
      cgst5: { type: Number, default: 0 },
      sgst12: { type: Number, default: 0 },
      cgst12: { type: Number, default: 0 },
      sgst18: { type: Number, default: 0 },
      cgst18: { type: Number, default: 0 },
      totalGST: { type: Number, default: 0 }
    },
    grandTotal: { type: Number, default: 0 }
  },

  // Payment Terms
  paymentTerms: {
    structure: { type: String, enum: ['full', '2-installment', '3-installment', 'custom'], default: '2-installment' },
    installments: [
      {
        installmentNo: { type: Number, default: 1 },
        amount: { type: Number, default: 0 },
        percentage: { type: Number, default: 50 },
        dueDate: { type: Date },
        description: { type: String, default: '' },
        paymentMethod: { type: String, default: 'Bank Transfer / UPI' }
      }
    ]
  },

  // Delivery & Installation
  delivery: {
    address: { type: String, default: '' },
    mode: { type: String, enum: ['door-delivery', 'site-delivery', 'pickup'], default: 'site-delivery' },
    estimatedFrom: { type: Date },
    estimatedTo: { type: Date },
    charges: { type: Number, default: 0 },
    included: { type: Boolean, default: true }
  },
  installation: {
    required: { type: Boolean, default: true },
    cost: { type: Number, default: 0 },
    timelineFrom: { type: Date },
    timelineTo: { type: Date }
  },

  // Company Info & Branding
  company: {
    name: { type: String, default: 'Riddha Interio Mart Pvt Ltd' },
    address: { type: String, default: 'Suite 402, Interior Design Hub, Indiranagar, Bengaluru, KA - 560038' },
    gstNumber: { type: String, default: '29AAACR1234F1Z5' },
    contactPerson: { type: String, default: 'Riddha Design Concierge' },
    phone: { type: String, default: '+91 80 4567 8900' },
    email: { type: String, default: 'quotations@riddhainterio.com' },
    logo: { type: String, default: '' },
    bankDetails: {
      accountNumber: { type: String, default: '91800293847561' },
      bankName: { type: String, default: 'HDFC Bank Ltd' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      accountHolderName: { type: String, default: 'Riddha Interio Mart Pvt Ltd' }
    }
  },

  // Terms & Conditions
  termsAndConditions: {
    type: { type: String, enum: ['default', 'custom'], default: 'default' },
    content: {
      type: String,
      default: `1. Prices are valid for 30 days from the quote date.
2. 50% advance payment required to initiate procurement and site scheduling.
3. Applicable Indian GST (5%, 12%, 18%) is calculated as per standard tax guidelines.
4. Any design modifications post-quote approval will incur additional itemized charges.
5. Delivery & installation timelines depend on site readiness.`
    }
  },

  // Messages & Gemini Content
  openingMessage: { type: String, default: '' },
  closingMessage: { type: String, default: '' },
  summaryText: { type: String, default: '' },
  personalMessage: { type: String, default: '' },

  // Status & Tracking
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'interested', 'query', 'negotiation', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  sentAt: { type: Date },
  sentTo: [{ type: String }],
  viewedAt: { type: Date },
  viewCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  acceptedAt: { type: Date },
  acceptedBy: { type: String },

  // PDF Export
  pdfUrl: { type: String, default: '' },
  pdfGeneratedAt: { type: Date },

  // Templates & Notes
  templateName: { type: String, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

QuotationSchema.index({ userId: 1, createdAt: -1 });
QuotationSchema.index({ quotationNumber: 1 }, { unique: true });
QuotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', QuotationSchema);
