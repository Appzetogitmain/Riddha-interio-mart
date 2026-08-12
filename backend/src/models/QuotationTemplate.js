const mongoose = require('mongoose');

const QuotationTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  items: [
    {
      description: String,
      quantity: Number,
      unit: String,
      unitRate: Number,
      taxRate: Number,
      hsnCode: String
    }
  ],
  paymentStructure: {
    type: String,
    enum: ['full', '2-installment', '3-installment', 'custom'],
    default: '2-installment'
  },
  deliveryMode: {
    type: String,
    default: 'site-delivery'
  },
  termsAndConditions: {
    type: String,
    default: ''
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuotationTemplate', QuotationTemplateSchema);
