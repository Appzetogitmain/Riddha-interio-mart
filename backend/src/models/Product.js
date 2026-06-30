const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  sku: {
    type: String
  },
  hsnCode: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\d{4}$|^\d{6}$|^\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid HSN code! It must be a 4, 6, or 8 digit numeric code.`
    }
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'] // Final Price (shown to user)
  },
  sellerPrice: {
    type: Number // Original Price from Seller
  },
  adminCommission: {
    type: Number,
    default: 0 // Percentage
  },
  gstRate: {
    type: Number,
    default: 18
  },
  discountPrice: {
    type: Number
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  subcategory: {
    type: String
  },
  subsubcategory: {
    type: String
  },
  brand: {
    type: mongoose.Schema.ObjectId,
    ref: 'Brand',
    required: [true, 'Please select a brand']
  },
  material: {
    type: String
  },
  dimensions: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?(\s*[xX]\s*\d+(\.\d+)?)?\s*(mm|cm|inches|inch|feet|ft|m|mtrs|in)?)$|^([a-zA-Z0-9\s\-\/\(\)\.\,]+)$/i.test(v.trim());
      },
      message: props => `${props.value} is not a valid dimensions layout! Must be a numeric size (e.g., 600x600 mm, 24x24 inches) or descriptive text (e.g., Standard, King Size).`
    }
  },
  thickness: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(\d+(\.\d+)?\s*(mm|cm|inches|inch|feet|ft|m|mtrs|in)?)$|^([a-zA-Z0-9\s\-\/\(\)\.\,]+)$/i.test(v.trim());
      },
      message: props => `${props.value} is not a valid thickness layout! Must be a numeric size (e.g., 12mm, 6 inch) or descriptive text (e.g., Medium, Thick).`
    }
  },
  color: {
    type: String
  },
  unit: {
    type: String,
    default: 'piece'
  },
  unitValue: {
    type: String,
    default: '1'
  },
  images: [String],
  videoUrl: {
    type: String
  },
  countInStock: {
    type: Number,
    required: true,
    default: 0,
    index: true
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0,
    index: true
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
  isActive: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['new', 'catalog'],
    default: 'new'
  },
  isCodAllowed: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    required: true,
    default: 1.5
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  batchId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ProductBatch',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ProductSchema.index({ seller: 1, countInStock: 1 });
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text', category: 'text' });
ProductSchema.index({ category: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ subcategory: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ brand: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ price: 1, isApproved: 1, isActive: 1 });

ProductSchema.post('save', function(doc) {
  try {
    const searchService = require('../services/searchService');
    searchService.clearCache();
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('products:list:*');
    if (doc) {
      cacheService.del(`products:single:${doc._id}`);
    }
  } catch (err) {}
});

ProductSchema.post('findOneAndUpdate', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('products:list:*');
    if (doc) {
      cacheService.del(`products:single:${doc._id}`);
    }
  } catch (err) {}
});

ProductSchema.post('remove', function(doc) {
  try {
    const searchService = require('../services/searchService');
    searchService.clearCache();
    const cacheService = require('../services/cacheService');
    cacheService.del('analytics:admin:dashboard');
    cacheService.delPattern('products:list:*');
    if (doc) {
      cacheService.del(`products:single:${doc._id}`);
    }
  } catch (err) {}
});

module.exports = mongoose.model('Product', ProductSchema);
