const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Static / User-declared Preferences
  stylePreferences: [{ type: String, trim: true }],       // e.g. ['modern', 'minimalist', 'industrial']
  colorPreferences: [{ type: String, trim: true }],       // e.g. ['white', 'navy', 'wood', 'gold']
  materialPreferences: [{ type: String, trim: true }],    // e.g. ['marble', 'teak', 'glass', 'brass']
  budgetRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 500000 },
    typical: { type: Number, default: 50000 }
  },

  // User location with geospatial coordinates for distance-based filtering
  location: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v) {
            return !v || (v && v.length === 2);
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      }
    }
  },

  // Saved filter searches
  savedFilters: [{
    name: { type: String, default: '' },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  }],

  // Filter preferences
  filterPreferences: {
    preferredDeliveryDays: [{ type: String }],
    preferredVendorType: [{ type: String }],
    preferredPriceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 500000 }
    }
  },

  // Design Profile from Quiz (Req #4)
  designProfile: {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserQuizResult' },
    roomType: { type: String },
    personality: { type: String },
    completedAt: { type: Date }
  },

  // Behavior Tracking
  behaviorData: {
    browsedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    browsedCategories: [{ type: String }],
    searchHistory: [
      {
        query: { type: String },
        timestamp: { type: Date, default: Date.now },
        resultCount: { type: Number, default: 0 }
      }
    ],
    wishlistProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    purchaseHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cartHistory: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        addedAt: { type: Date, default: Date.now },
        purchasedAt: { type: Date }
      }
    ]
  },

  // Engagement Metrics
  engagement: {
    ratingsGiven: { type: Number, default: 0 },
    reviewsWritten: { type: Number, default: 0 },
    productsShared: { type: Number, default: 0 },
    emailOpens: { type: Number, default: 0 },
    emailClicks: { type: Number, default: 0 }
  },

  // Recommendation Interaction
  recommendationInteraction: {
    recommendationsShown: { type: Number, default: 0 },
    recommendationsClicked: { type: Number, default: 0 },
    recommendationsPurchased: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },

  // Calculated Scores & Affinities
  scores: {
    styleAffinity: {
      style: { type: String },
      score: { type: Number, default: 0 }
    },
    segmentAffinity: { type: String, default: 'Mid-range Modern' },
    loyaltyScore: { type: Number, default: 0.5 },
    valueScore: { type: Number, default: 0.5 }
  },

  lastActiveAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

UserProfileSchema.index({ stylePreferences: 1 });
UserProfileSchema.index({ 'budgetRange.min': 1, 'budgetRange.max': 1 });
UserProfileSchema.index({ lastActiveAt: -1 });
UserProfileSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
