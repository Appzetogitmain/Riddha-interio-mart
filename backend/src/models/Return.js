const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: true
  },
  orderItem: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Seller',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a return reason'],
    enum: [
      'Defective or Damaged',
      'Wrong Item Delivered',
      'Missing Parts or Accessories',
      'Item does not match description',
      'Changed Mind',
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the return'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: {
    type: [String],
    validate: [arrayLimit, 'You can upload up to 5 images']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Received', 'Completed'],
    default: 'Pending'
  },
  refundStatus: {
    type: String,
    enum: ['Pending', 'Processed', 'Failed'],
    default: 'Pending'
  },
  refundAmount: {
    type: Number,
    required: true
  },
  adminComment: {
    type: String
  },
  sellerComment: {
    type: String
  },
  deliveryBoy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Delivery'
  },
  deliveryStatus: {
    type: String,
    enum: ['None', 'Pending', 'Accepted', 'Picked', 'Out for Return Delivery', 'Returned', 'Rejected'],
    default: 'None'
  },
  pickupProofImages: {
    type: [String],
    default: []
  },
  pickupProofVideo: {
    type: String,
    default: null
  },
  dropoffProofImages: {
    type: [String],
    default: []
  },
  rejectedBy: [{
    deliveryBoy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Delivery'
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Prevent duplicate returns for the same order item
returnSchema.index({ order: 1, orderItem: 1 }, { unique: true });

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('Return', returnSchema);
