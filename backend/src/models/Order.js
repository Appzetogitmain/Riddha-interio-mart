const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'sellerType'
  },
  sellerType: {
    type: String,
    required: true,
    enum: ['Seller', 'Admin'],
    default: 'Seller'
  },
  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
      },
      seller: {
        type: mongoose.Schema.ObjectId,
        required: true,
        refPath: 'orderItems.sellerType'
      },
      sellerType: {
        type: String,
        required: true,
        enum: ['Seller', 'Admin'],
        default: 'Seller'
      },
      returnStatus: {
        type: String,
        enum: ['None', 'Requested', 'Approved', 'Rejected', 'Received', 'Completed'],
        default: 'None'
      },
      returnRequest: {
        type: mongoose.Schema.ObjectId,
        ref: 'Return'
      }
    }
  ],
  shippingAddress: {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    fullAddress: { type: String, required: true },
    landmark: { type: String }
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Online'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  cgst: {
    type: Number,
    default: 0.0
  },
  sgst: {
    type: Number,
    default: 0.0
  },
  igst: {
    type: Number,
    default: 0.0
  },
  taxType: {
    type: String,
    enum: ['intra-state', 'inter-state'],
    default: 'intra-state'
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  pricingBreakdown: {
    subtotal: { type: Number, default: 0.0 },
    taxAmount: { type: Number, default: 0.0 },
    cgst: { type: Number, default: 0.0 },
    sgst: { type: Number, default: 0.0 },
    igst: { type: Number, default: 0.0 },
    shippingPrice: { type: Number, default: 0.0 },
    discountAmount: { type: Number, default: 0.0 },
    totalPrice: { type: Number, default: 0.0 }
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  invoiceUrl: {
    type: String
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  processingAt: {
    type: Date
  },
  packedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryBoy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Delivery'
  },
  deliveryStatus: {
    type: String,
    enum: ['None', 'Pending', 'Accepted', 'Picked', 'Out for Delivery', 'Delivered', 'Rejected'],
    default: 'None'
  },
  deliveryType: {
    type: String,
    enum: ['in-app', 'seller-managed', 'shiprocket'],
    default: 'in-app'
  },
  deliveryAssignmentTime: {
    type: Date
  },
  deliveryOtp: {
    type: String
  },
  pickupProofImages: {
    type: [String],
    default: []
  },
  pickupProofVideo: {
    type: String,
    default: null
  },
  deliveryProofImages: {
    type: [String],
    default: []
  },
  businessDetails: {
    shopName: String,
    gstNumber: String,
    taxationCode: String
  },
  isCashDeposited: {
    type: Boolean,
    default: false
  },
  invoiceUrl: {
    type: String
  },
  shippingCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  sellerCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
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

OrderSchema.index({ seller: 1, createdAt: -1, status: 1 });
OrderSchema.index({ 'orderItems.product': 1 }); // Useful for top products aggregation if needed
OrderSchema.index({ deliveryBoy: 1, deliveryStatus: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, user: 1 });
OrderSchema.index({ 'shippingAddress.fullName': 1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });

OrderSchema.post('save', function() {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('analytics:seller:*');
  } catch (e) {}
});

OrderSchema.post('findOneAndUpdate', function() {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('analytics:seller:*');
  } catch (e) {}
});

OrderSchema.post('updateMany', function() {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('analytics:seller:*');
  } catch (e) {}
});

module.exports = mongoose.model('Order', OrderSchema);
