const mongoose = require('mongoose');

const ReturnDispatchEventSchema = new mongoose.Schema({
  returnReq: {
    type: mongoose.Schema.ObjectId,
    ref: 'Return',
    required: true
  },
  deliveryBoy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Delivery',
    required: true
  },
  broadcastStatus: {
    type: String,
    enum: ['Offered', 'Accepted', 'Rejected', 'Expired'],
    default: 'Offered'
  },
  offeredAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

ReturnDispatchEventSchema.index({ deliveryBoy: 1, broadcastStatus: 1 });
ReturnDispatchEventSchema.index({ returnReq: 1, broadcastStatus: 1 });

module.exports = mongoose.model('ReturnDispatchEvent', ReturnDispatchEventSchema);
