const mongoose = require('mongoose');

const DeliveryPartnerSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  name: {
    type: String,
    required: true,
    default: 'Vikram Singh'
  },
  phone: {
    type: String,
    required: true,
    default: '+91 98765 43210'
  },
  email: {
    type: String,
    default: 'delivery.partner@riddhamart.com'
  },
  photo: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  vehicle: {
    type: String,
    enum: ['electric-van', 'cargo-truck', 'scooter', 'tempo'],
    default: 'electric-van'
  },
  vehicleNo: {
    type: String,
    default: 'KA-01-EQ-9876'
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'on-break', 'offline'],
    default: 'active'
  },

  // Geospatial Current GPS Location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.6412, 12.9716] // Default Bengaluru coordinates
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    speed: {
      type: Number,
      default: 35 // km/h
    },
    heading: {
      type: Number,
      default: 90 // degrees
    }
  },

  performance: {
    totalDeliveries: { type: Number, default: 142 },
    onTimeDeliveries: { type: Number, default: 138 },
    onTimeRate: { type: Number, default: 97.1 },
    avgDeliveryTime: { type: Number, default: 32 }, // minutes
    rating: { type: Number, default: 4.9 },
    issuesCount: { type: Number, default: 2 }
  },

  todayStats: {
    assignedDeliveries: { type: Number, default: 5 },
    completedDeliveries: { type: Number, default: 3 },
    pendingDeliveries: { type: Number, default: 2 }
  }
}, {
  timestamps: true
});

DeliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', DeliveryPartnerSchema);
