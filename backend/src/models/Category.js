const mongoose = require('mongoose');

const SubSubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a sub-subcategory name'],
    trim: true
  },
  image: {
    type: String,
    default: ''
  }
});

const SubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subcategory name'],
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  subsubcategories: [SubSubcategorySchema]
});

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  description: {
    type: String,
    required: [false],
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  icon: {
    type: String,
    default: ''
  },
  subcategories: [SubcategorySchema],
  productCount: {
    type: Number,
    default: 0
  },
  defaultGstRate: {
    type: Number,
    default: 18
  },
  attributes: [{
    name: { type: String, required: true },
    type: { type: String, default: 'select', enum: ['select', 'text', 'number'] },
    options: [String],
    isVariant: { type: Boolean, default: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);
