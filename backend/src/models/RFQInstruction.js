const mongoose = require('mongoose');

/**
 * Admin-managed copy for the customer "Request a Quotation" page.
 * One document per category; a document with category = null is the default
 * used when a category has no entry of its own.
 */
const RFQInstructionSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.ObjectId, ref: 'Category', default: null },
  // Use {category} as a placeholder for the category name.
  pageHeading: { type: String, trim: true, maxlength: 120, default: 'Request a Quotation for {category}' },
  pageSubheading: { type: String, trim: true, maxlength: 300, default: '' },
  title: { type: String, trim: true, maxlength: 120, default: 'Have a list already?' },
  description: { type: String, trim: true, maxlength: 600, default: '' },
  placeholder: { type: String, trim: true, maxlength: 1000, default: '' },
  uploadHint: { type: String, trim: true, maxlength: 300, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// One entry per category (and a single default).
RFQInstructionSchema.index({ category: 1 }, { unique: true });

module.exports = mongoose.model('RFQInstruction', RFQInstructionSchema);
