const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: {
    type: String,
    enum: ['Designer', 'Contractor', 'Architect'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Consultancy', 'Pending Payment', 'Hired', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  broadcastedTo: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  acceptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  projectDetails: {
    type: String,
    default: ''
  },
  commissionRate: {
    type: Number,
    default: 10 // Riddha takes 10%
  },
  payment: {
    amount: { type: Number, default: 0 },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for finding requests broadcasted to a specific user
ServiceRequestSchema.index({ broadcastedTo: 1 });
ServiceRequestSchema.index({ customerId: 1 });
ServiceRequestSchema.index({ acceptedBy: 1 });
ServiceRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
