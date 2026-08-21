# Database Schema Changes - Detailed Breakdown

## 1. UPDATE: Seller Model
**File:** `backend/src/models/Seller.js`

### ADD these fields:

```javascript
{
  // Vendor Verification Status (Set by Admin)
  verificationStatus: {
    type: String,
    enum: [
      'unverified',      // Default for new vendors
      'verified',        // General verified vendor
      'manufacturer',    // Manufactures own products
      'authorized_distributor', // Official distributor
      'dealer',          // Dealer/Reseller
      'wholesaler',      // Bulk/Wholesale supplier
      'local_supplier',  // Local area supplier
      'premium_vendor',  // Premium quality vendor
      'project_supplier' // Handles large projects
    ],
    default: 'unverified',
    required: true
  },

  // Vendor Location Data
  location: {
    address: String,           // Full address
    city: String,              // City name
    state: String,             // State/Province
    zipCode: String,           // Postal code
    country: String,           // Country (default: 'India')
    
    // Geospatial coordinates for distance-based filtering
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],  // [longitude, latitude]
        validate: {
          validator: function(v) {
            return v && v.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      }
    }
  },

  // Region (computed from coordinates)
  region: {
    type: String,
    enum: [
      'kolkata',          // Kolkata city
      'west_bengal',      // All of West Bengal
      'east_india',       // Eastern India
      'pan_india'         // All of India
    ],
    default: 'pan_india'
    // This should be computed based on coordinates, or set manually during registration
  },

  // Vendor Type for filtering
  vendorType: {
    type: [String],
    enum: ['manufacturer', 'distributor', 'retailer', 'wholesaler', 'project_supplier'],
    default: ['retailer']
  },

  // Optional: Vendor Certifications
  certifications: [{
    name: String,        // e.g., 'ISO 9001', 'GST Registered'
    document: String,    // URL to certificate
    verifiedBy: String,  // Admin who verified
    verifiedDate: Date
  }],

  // Delivery capabilities
  deliveryCapabilities: {
    sameDay: { type: Boolean, default: false },
    nextDay: { type: Boolean, default: false },
    standardDelivery: { type: Boolean, default: true },
    bulkDelivery: { type: Boolean, default: false },
    siteDelivery: { type: Boolean, default: false },
    hyperlocal: { type: Boolean, default: false },
    express: { type: Boolean, default: false }
  }
}

// ADD INDEXES for Location-based Queries
schema.index({ 'location.coordinates': '2dsphere' });
schema.index({ region: 1 });
schema.index({ verificationStatus: 1 });
schema.index({ city: 1, state: 1 });
```

---

## 2. UPDATE: Product Model
**File:** `backend/src/models/Product.js`

### ADD these fields:

```javascript
{
  // Stock/Availability Status
  stock: {
    type: String,
    enum: [
      'in_stock',              // Immediately available
      'limited_stock',         // Few units left
      'made_to_order',         // Made after order
      'pre_order',             // Coming soon
      'available_on_request',  // Call to check
      'out_of_stock'           // Currently unavailable
    ],
    default: 'in_stock'
  },

  // Detailed Specifications
  specifications: {
    // Dimensions
    size: String,              // e.g., '2.5m x 1.2m'
    thickness: String,         // e.g., '18mm', '2mm'
    length: String,
    width: String,
    height: String,
    weight: String,
    
    // Visual Properties
    finish: String,            // e.g., 'matte', 'glossy', 'textured'
    colour: String,            // e.g., 'Walnut Brown', 'Venetian Gold'
    pattern: String,           // e.g., 'checkered', 'solid', 'floral'
    
    // Material Properties
    material: String,          // e.g., 'Teak Wood', 'Ceramic'
    grade: {
      type: String,
      enum: ['residential', 'commercial', 'industrial'],
      default: 'residential'
    },
    
    // Functional Properties
    waterproof: { type: Boolean, default: false },
    fireProof: { type: Boolean, default: false },
    antiSlip: { type: Boolean, default: false },
    dustProof: { type: Boolean, default: false },
    ecoFriendly: { type: Boolean, default: false },
    sustainableMaterial: { type: Boolean, default: false },
    
    // Certifications & Standards
    warranty: String,          // e.g., '5 years structural', '10 years frame'
    fireRating: String,        // e.g., 'A1', 'B1', 'Class A'
    waterproofRating: String,  // e.g., 'IP54', 'IP65'
    
    // Mounting & Installation
    requiresProfessionalInstallation: { type: Boolean, default: false },
    installationCost: Number,
    maintenanceRequirements: String,
    
    // Additional Info
    sku: String,
    model: String,
    Brand: String              // Brand name for filter
  },

  // Project Application (Multiple applicable)
  projectApplication: [{
    type: String,
    enum: [
      'home',           // Residential
      'office',         // Commercial office
      'retail',         // Retail shops
      'hotel',          // Hospitality
      'restaurant',     // F&B
      'hospital',       // Healthcare
      'school',         // Educational
      'corporate',      // Corporate
      'industrial',     // Industrial
      'institutional'   // Institutional (govt, banks)
    ]
  }],

  // Bulk Order Info
  bulkDiscount: {
    enabled: { type: Boolean, default: false },
    minimumQuantity: Number,   // Min qty for bulk price
    discountPercentage: Number,
    bulkPrice: Number
  },

  // Availability for different regions
  availabilityByRegion: [{
    region: String,            // 'kolkata', 'west_bengal', etc.
    available: Boolean,
    deliveryDays: Number,
    inStock: Boolean
  }],

  // New Arrival Date (for "New Arrivals" filter)
  newArrivalDate: {
    type: Date,
    default: Date.now
  },

  // Professional Grade Info
  professionalGrade: {
    type: Boolean,
    default: false
  }
}

// ADD INDEXES
schema.index({ stock: 1 });
schema.index({ 'specifications.grade': 1 });
schema.index({ 'projectApplication': 1 });
schema.index({ newArrivalDate: -1 });
schema.index({ price: 1 });
schema.index({ averageRating: -1 });
schema.index({ seller: 1, stock: 1 });
```

---

## 3. NEW MODEL: FilterMetadata
**File:** `backend/src/models/FilterMetadata.js`

### CREATE this new model:

```javascript
const mongoose = require('mongoose');

const FilterMetadataSchema = new mongoose.Schema({
  // Link to product
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },

  // Delivery Options (from Offer model or manual entry)
  deliveryOptions: {
    days: [{
      type: String,
      enum: [
        'same_day',
        'next_day',
        '2_days',
        '3_5_days',
        'scheduled',
        'bulk'
      ]
    }],
    types: [{
      type: String,
      enum: [
        'hyperlocal',
        'standard',
        'express',
        'heavy_bulk',
        'site_delivery'
      ]
    }],
    freeOptions: [{
      type: String,
      enum: [
        'free',
        'included',
        'vendor_pickup',
        'negotiable'
      ]
    }]
  },

  // Pricing
  priceRange: {
    min: Number,
    max: Number,
    current: Number
  },

  // Vendor Info
  vendorVerification: {
    type: String,
    enum: [
      'unverified',
      'verified',
      'manufacturer',
      'authorized_distributor',
      'dealer',
      'wholesaler',
      'local_supplier',
      'premium_vendor',
      'project_supplier'
    ]
  },

  // Location
  vendorLocation: {
    distance: Number,        // In km
    region: String,
    city: String,
    state: String
  },

  // Rating & Reviews
  rating: {
    score: Number,           // 1-5 stars
    count: Number,           // Total reviews
    verifiedBuyerRating: Number,
    verifiedVendorRating: Boolean,
    projectRated: Boolean
  },

  // Availability
  availabilityStatus: {
    type: String,
    enum: [
      'in_stock',
      'limited_stock',
      'made_to_order',
      'pre_order',
      'available_on_request',
      'out_of_stock'
    ]
  },

  // Deals & Offers
  activeOffers: [{
    offerId: mongoose.Schema.ObjectId,
    type: String,            // 'today_deals', 'vendor_offers', etc.
    discountPercentage: Number,
    discountAmount: Number,
    offerPrice: Number
  }],

  // New Arrival
  isNewArrival: Boolean,
  newArrivalDays: Number,    // Days since added (7, 30, 90)

  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
FilterMetadataSchema.index({ product: 1 });
FilterMetadataSchema.index({ vendorVerification: 1 });
FilterMetadataSchema.index({ 'priceRange.current': 1 });
FilterMetadataSchema.index({ availabilityStatus: 1 });
FilterMetadataSchema.index({ isNewArrival: 1, newArrivalDays: 1 });
FilterMetadataSchema.index({ 'rating.score': -1 });

module.exports = mongoose.model('FilterMetadata', FilterMetadataSchema);
```

---

## 4. UPDATE: Offer Model
**File:** `backend/src/models/Offer.js`

### ADD these fields (if not already present):

```javascript
{
  // Delivery-specific offer details
  deliveryOptions: {
    days: [{
      type: String,
      enum: ['same_day', 'next_day', '2_days', '3_5_days', 'scheduled', 'bulk']
    }],
    types: [{
      type: String,
      enum: ['hyperlocal', 'standard', 'express', 'heavy_bulk', 'site_delivery']
    }],
    freeDelivery: [{
      type: String,
      enum: ['free', 'included', 'vendor_pickup', 'negotiable']
    }]
  },

  // Add if missing: Active date range
  startDate: Date,
  endDate: Date,

  // Add if missing: Approval status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}

// Indexes
schema.index({ type: 1, approvalStatus: 1, startDate: 1, endDate: 1 });
```

---

## 5. UPDATE: Order Model (Optional - for tracking delivery options used)
**File:** `backend/src/models/Order.js`

### ADD these fields (optional but recommended):

```javascript
{
  // Delivery method used for this order
  deliveryMethod: {
    day: String,           // 'same_day', 'next_day', etc.
    type: String,          // 'hyperlocal', 'standard', etc.
    freeDelivery: Boolean,
    cost: Number
  },

  // Which offer (if any) was applied
  appliedOffer: {
    offerId: mongoose.Schema.ObjectId,
    type: String,
    discountAmount: Number
  }
}
```

---

## 6. UPDATE: User Profile Model (Optional but Recommended)
**File:** `backend/src/models/UserProfile.js`

### ADD these fields:

```javascript
{
  // User location for distance-based filtering
  location: {
    address: String,
    city: String,
    state: String,
    
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]  // [longitude, latitude]
    }
  },

  // Saved filters/preferences
  savedFilters: [{
    name: String,          // e.g., 'My usual search'
    filters: Object,       // Saved filter state
    createdAt: Date
  }],

  // Filter preferences
  filterPreferences: {
    preferredDeliveryDays: [String],
    preferredVendorType: [String],
    preferredPriceRange: {
      min: Number,
      max: Number
    }
  }
}

// Index for location
schema.index({ 'location.coordinates': '2dsphere' });
```

---

## 7. MIGRATION: Existing Data Updates

### For existing Sellers:
```javascript
// Migration to set coordinates if not present
db.sellers.updateMany(
  { 'location.coordinates': { $exists: false } },
  {
    $set: {
      'location.coordinates': {
        type: 'Point',
        coordinates: [88.3639, 22.5726]  // Default: Kolkata center
      },
      region: 'kolkata',
      verificationStatus: 'verified'  // Mark existing as verified
    }
  }
);
```

### For existing Products:
```javascript
// Set default stock status
db.products.updateMany(
  { stock: { $exists: false } },
  { $set: { stock: 'in_stock' } }
);
```

---

## 8. SUMMARY: Changes by Model

| Model | New Fields | Why | Priority |
|-------|-----------|-----|----------|
| **Seller** | verificationStatus, location, coordinates, region, vendorType, deliveryCapabilities | Vendor filtering & location | 🔴 HIGH |
| **Product** | stock, specifications, projectApplication, newArrivalDate, bulkDiscount | Product filtering | 🔴 HIGH |
| **FilterMetadata** | (New model) All filter-related data | Optimize filter queries | 🟡 MEDIUM |
| **Offer** | deliveryOptions details | Delivery filtering | 🔴 HIGH |
| **UserProfile** | location, coordinates, savedFilters | User location & preferences | 🟡 MEDIUM |
| **Order** | deliveryMethod, appliedOffer | Track what was used | 🟢 LOW |

---

## 9. Indexes to Create

```javascript
// Seller indexes
db.sellers.createIndex({ 'location.coordinates': '2dsphere' });
db.sellers.createIndex({ region: 1 });
db.sellers.createIndex({ verificationStatus: 1 });

// Product indexes
db.products.createIndex({ stock: 1 });
db.products.createIndex({ 'specifications.grade': 1 });
db.products.createIndex({ 'projectApplication': 1 });
db.products.createIndex({ newArrivalDate: -1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ averageRating: -1 });

// Combined indexes for common queries
db.products.createIndex({ seller: 1, stock: 1 });
db.products.createIndex({ price: 1, averageRating: -1 });
```

---

## 10. Priority Implementation Order

### **Phase 1 (MUST DO FIRST):**
1. ✅ Update Seller model - add verificationStatus, location, region
2. ✅ Update Product model - add stock, specifications
3. ✅ Update Offer model - add deliveryOptions details
4. ✅ Create indexes

### **Phase 2 (Can do after Phase 1):**
5. Create FilterMetadata model
6. Update UserProfile model
7. Data migration script

### **Phase 3 (Nice to have):**
8. Update Order model
9. Add saved filters feature

---

## 11. Data Validation Requirements

### Seller Location Validation:
```javascript
// Coordinates validation
- Longitude: -180 to 180
- Latitude: -90 to 90
- India: Longitude (68-97), Latitude (8-35)

// Required before filtering:
- seller.location.coordinates must be set
- seller.region must be set
```

### Product Specifications Validation:
```javascript
// At least one of these should be set:
- specifications.size
- specifications.finish
- specifications.material
- specifications.warranty
```

---

## 12. Backwards Compatibility

⚠️ **Important**: Existing data will have:
- Null/undefined location coordinates
- Missing stock status
- No specifications

**Solution**: Set default values during migration:
- Default stock: `'in_stock'`
- Default verificationStatus: `'verified'` (for existing vendors)
- Default location: Center of Kolkata (88.3639, 22.5726)

