const mongoose = require('mongoose');

const CatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Please add a product code (SKU)'],
    unique: true,
    trim: true
  },
  brand: {
    type: mongoose.Schema.ObjectId,
    ref: 'Brand',
    required: [true, 'Please select a brand']
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
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Please add a detailed description']
  },
  images: {
    type: [String],
    required: [true, 'Please add at least one product image']
  },
  material: {
    type: String,
    trim: true
  },
  dimensions: {
    type: String,
    trim: true
  },
  variants: [{
    sku: String,
    price: Number,
    discountPrice: Number,
    countInStock: { type: Number, default: 0 },
    attributes: { type: Map, of: String },
    image: String,
    images: {
      type: [String],
      validate: {
        validator: (arr) => !arr || arr.length <= 10,
        message: 'A variant can have at most 10 images'
      }
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  targetCustomer: {
    type: String,
    enum: ['individual', 'enterpriser', 'both'],
    default: 'both'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Catalog', CatalogSchema);
