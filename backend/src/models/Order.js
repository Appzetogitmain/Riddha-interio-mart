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
  // Seller's own staff member handling this delivery, when deliveryType is 'seller-managed'
  assignedStaff: {
    type: mongoose.Schema.ObjectId,
    ref: 'SellerStaff',
    default: null
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
  // General order-related photos the seller attaches (packaging, condition, etc.) —
  // distinct from pickupProofImages/deliveryProofImages which gate delivery status changes.
  orderImages: {
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
  sellerInvoiceNumber: String,
  marketplaceInvoiceNumber: String,
  eWayBillNumber: String,
  sellerInvoiceShared: {
    type: Boolean,
    default: false
  },
  sellerInvoiceSharedAt: {
    type: Date
  },
  labelDownloadEnabled: {
    type: Boolean,
    default: false
  },
  customerInvoiceSentAt: {
    type: Date
  },
  customerInvoiceSentStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
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
  }],
  orderNumber: {
    type: String
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: {
      latitude: Number,
      longitude: Number
    },
    notes: String,
    updatedBy: { type: String, default: 'system' }
  }],
  deliveryPartnerDetails: {
    partnerId: { type: mongoose.Schema.ObjectId, ref: 'DeliveryPartner' },
    name: String,
    phone: String,
    photo: String,
    rating: Number,
    vehicle: String,
    vehicleNo: String
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.6412, 12.9716]
    },
    timestamp: { type: Date, default: Date.now },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 }
  },
  deliveryTimeline: {
    pickedUpAt: Date,
    outForDeliveryAt: Date,
    expectedDeliveryTime: Date,
    actualDeliveryTime: Date,
    delayMinutes: { type: Number, default: 0 }
  },
  aiPredictions: {
    estimatedDeliveryTime: String,
    confidenceLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
    delayPredicted: { type: Boolean, default: false },
    delayReasons: [String],
    message: String,
    generatedAt: Date
  },
  proofOfDelivery: {
    photos: [String],
    signature: String,
    otp: String,
    verifiedAt: Date,
    notes: String
  },
  customerRating: {
    rating: Number,
    review: String,
    ratedAt: Date
  }
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
OrderSchema.index({ currentLocation: '2dsphere' });

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
