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
  b2bAdminCommission: {
    type: Number,
    default: 0
  },
  gstRate: {
    type: Number,
    default: 18
  },
  discountPrice: {
    type: Number
  },
  // B2B pricing — shown when order qualifies as a bulk/B2B order
  b2bPrice: {
    type: Number,
    default: null
  },
  sellerB2bPrice: {
    type: Number,
    default: null
  },
  // Minimum quantity for B2B price on this product (overrides global setting if set)
  b2bMinQty: {
    type: Number,
    default: null
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  subcategory: {
    type: mongoose.Schema.ObjectId
  },
  subsubcategory: {
    type: mongoose.Schema.ObjectId
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
  // Stock/Availability status for filtering
  stock: {
    type: String,
    enum: ['in_stock', 'limited_stock', 'made_to_order', 'pre_order', 'available_on_request', 'out_of_stock'],
    default: 'in_stock',
    index: true
  },
  // Detailed product specifications
  specifications: {
    size: { type: String, default: '' },
    thickness: { type: String, default: '' },
    length: { type: String, default: '' },
    width: { type: String, default: '' },
    height: { type: String, default: '' },
    weight: { type: String, default: '' },
    finish: { type: String, default: '' },
    colour: { type: String, default: '' },
    pattern: { type: String, default: '' },
    material: { type: String, default: '' },
    grade: {
      type: String,
      enum: ['residential', 'commercial', 'industrial'],
      default: 'residential',
      index: true
    },
    waterproof: { type: Boolean, default: false },
    fireProof: { type: Boolean, default: false },
    antiSlip: { type: Boolean, default: false },
    dustProof: { type: Boolean, default: false },
    ecoFriendly: { type: Boolean, default: false },
    sustainableMaterial: { type: Boolean, default: false },
    warranty: { type: String, default: '' },
    fireRating: { type: String, default: '' },
    waterproofRating: { type: String, default: '' },
    requiresProfessionalInstallation: { type: Boolean, default: false },
    installationCost: { type: Number, default: 0 },
    maintenanceRequirements: { type: String, default: '' },
    sku: { type: String, default: '' },
    model: { type: String, default: '' },
    Brand: { type: String, default: '' }
  },
  // Project applications
  projectApplication: [{
    type: String,
    enum: ['home', 'office', 'retail', 'hotel', 'restaurant', 'hospital', 'school', 'corporate', 'industrial', 'institutional']
  }],
  // Bulk discount info
  bulkDiscount: {
    enabled: { type: Boolean, default: false },
    minimumQuantity: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    bulkPrice: { type: Number, default: 0 }
  },
  // New arrival date for filtering
  newArrivalDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Availability by region
  availabilityByRegion: [{
    region: String,
    available: Boolean,
    deliveryDays: Number,
    inStock: Boolean
  }],
  // Professional grade indicator
  professionalGrade: {
    type: Boolean,
    default: false
  },
  // Delivery options selected by vendor at listing time
  deliveryOptions: {
    availableDeliveryDays: [{ type: String }],
    deliveryTypes: [{ type: String }],
    freeDeliveryEligibility: [{ type: String }]
  },
  // Payment options accepted for this product
  paymentOptions: [{ type: String }],
  dynamicAttributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  variants: [{
    sku: String,
    price: Number,
    sellerPrice: Number,
    discountPrice: Number,
    attributes: {
      type: Map,
      of: String
    },
    countInStock: {
      type: Number,
      default: 0
    },
    image: String
  }],
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
  },
  isAdvertised: {
    type: Boolean,
    default: false
  },
  advertisementEndDate: {
    type: Date,
    default: null
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  // Signals used by the recommendation/room-completion engine. All optional so
  // existing products keep working without backfill.
  tags: {
    type: [String],
    default: []
  },
  roomType: {
    type: String,
    enum: ['living', 'bedroom', 'bathroom', 'kitchen', 'office', 'dining', 'outdoor', null],
    default: null
  },
  // Marks a synthetic "single cart item" Product auto-generated for a Bundle
  // so bundles can flow through the existing cart/checkout/order pipeline untouched.
  isBundle: {
    type: Boolean,
    default: false
  },
  bundleRef: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bundle',
    default: null
  },
  // Requirement A — Sample Requests. Interior materials are bought by touch, so
  // a seller/admin opts each product into the sample programme individually.
  sampleAvailable: {
    type: Boolean,
    default: false,
    index: true
  },
  // Charged only once the customer is past their free-sample quota. 0 = free.
  sampleCharge: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

ProductSchema.index({ seller: 1, countInStock: 1 });
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ subcategory: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ brand: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ price: 1, isApproved: 1, isActive: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ 'specifications.grade': 1 });
ProductSchema.index({ projectApplication: 1 });
ProductSchema.index({ newArrivalDate: -1 });
ProductSchema.index({ price: 1, averageRating: -1 });
ProductSchema.index({ seller: 1, stock: 1 });
ProductSchema.index({ 'deliveryOptions.availableDeliveryDays': 1 });
ProductSchema.index({ 'deliveryOptions.deliveryTypes': 1 });
ProductSchema.index({ 'specifications.material': 1 });
ProductSchema.index({ 'specifications.finish': 1 });

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
