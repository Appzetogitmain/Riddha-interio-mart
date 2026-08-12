const mongoose = require('mongoose');

const BOQItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ['Furniture', 'Flooring', 'Lighting', 'Paint', 'Hardware', 'Decor', 'Custom', 'Labor & Services'],
    default: 'Furniture'
  },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Pieces' }, // Pieces, Sq Ft, Sq Meters, Rolls, Boxes, Sets, Liters, Hours
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  productId: { type: mongoose.Schema.ObjectId, ref: 'Product' },
  supplier: { type: String, default: 'Riddha Preferred Vendor' },
  deliveryTimeline: { type: String, default: '1-2 weeks' },
  notes: { type: String, default: '' },
  priority: { type: String, enum: ['critical', 'essential', 'important', 'optional'], default: 'essential' },
  wastePercentage: { type: Number, default: 0 },
  isSourcingRequested: { type: Boolean, default: false },
  sourcingStatus: { type: String, enum: ['none', 'pending', 'in-review', 'sourced', 'unavailable'], default: 'none' },
  sourcingNotes: { type: String, default: '' },
  sourcingRequestedAt: { type: Date },
  addedAt: { type: Date, default: Date.now }
});

const BOQSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  briefId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ClientBrief'
  },
  quotationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quotation'
  },

  boqName: {
    type: String,
    required: true,
    default: 'Bill of Quantities'
  },
  description: {
    type: String,
    default: ''
  },
  boqType: {
    type: String,
    enum: ['manual', 'from-drawing', 'from-brief', 'hybrid'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'sent', 'used-in-quotation'],
    default: 'draft'
  },

  items: [BOQItemSchema],

  summary: {
    totalItems: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalEstimatedCost: { type: Number, default: 0 },
    costByCategory: {
      type: Map,
      of: Number,
      default: {}
    },
    completenessScore: { type: Number, default: 85 } // 0 - 100%
  },

  sourceData: {
    uploadedImageUrl: { type: String, default: '' },
    extractionNotes: { type: String, default: '' },
    geminiAnalysis: { type: String, default: '' }
  },

  aiAnalysis: {
    missingItems: [{ type: String }],
    warnings: [{ type: String }],
    costOptimization: [{
      suggestion: { type: String },
      savings: { type: Number, default: 0 },
      impact: { type: String, default: 'medium' }
    }],
    generatedAt: { type: Date }
  },

  clientEmail: { type: String, default: '' },
  sentAt: { type: Date },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
  }
}, { timestamps: true });

BOQSchema.index({ userId: 1, createdAt: -1 });
BOQSchema.index({ projectId: 1 });
BOQSchema.index({ briefId: 1 });

module.exports = mongoose.model('BOQ', BOQSchema);
