const mongoose = require('mongoose');

/** Threaded negotiation messages between the customer, sellers and admin. */
const RFQMessageSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.ObjectId, ref: 'RFQ', required: true, index: true },
  senderId: { type: mongoose.Schema.ObjectId, required: true },
  senderRole: { type: String, enum: ['user', 'seller', 'admin'], required: true },
  senderName: { type: String, default: '' },
  // Scopes the thread when several sellers quote the same RFQ competitively:
  // the customer and one seller only ever see their own sub-thread.
  sellerId: { type: mongoose.Schema.ObjectId, ref: 'Seller', default: null },

  message: { type: String, required: true, trim: true, maxlength: 4000 },
  attachments: [{
    url: { type: String, required: true },
    filename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 }
  }],
  readAt: { type: Date, default: null }
}, {
  timestamps: true
});

RFQMessageSchema.index({ rfqId: 1, createdAt: 1 });
RFQMessageSchema.index({ rfqId: 1, sellerId: 1, createdAt: 1 });

module.exports = mongoose.model('RFQMessage', RFQMessageSchema);
