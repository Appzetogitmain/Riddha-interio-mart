const mongoose = require('mongoose');

const ContentTemplateSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
    required: true,
    default: 'Luxury Modern Furniture Template'
  },
  contentType: {
    type: String,
    default: 'description'
  },
  tone: {
    type: String,
    default: 'luxury'
  },
  style: {
    type: String,
    default: 'sales'
  },
  prompt: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContentTemplate', ContentTemplateSchema);
