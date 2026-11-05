const mongoose = require('mongoose');

const InventoryReservationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  variantId: {
    type: mongoose.Schema.ObjectId,
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['reserved', 'completed', 'released'],
    default: 'reserved',
    index: true
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for high-speed stock hold queries
InventoryReservationSchema.index({ status: 1, expiresAt: 1 });
InventoryReservationSchema.index({ order: 1, status: 1 });
InventoryReservationSchema.index({ product: 1, user: 1, status: 1 });

module.exports = mongoose.model('InventoryReservation', InventoryReservationSchema);
