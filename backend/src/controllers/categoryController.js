const Category = require('../models/Category');

// @desc    Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const cacheService = require('../services/cacheService');
    const cacheKey = 'categories:all';

    let categories = cacheService.get(cacheKey);
    let cached = true;

    if (!categories) {
      cached = false;
      categories = await Category.find().lean();
      cacheService.set(cacheKey, categories, 600); // 10 minutes cache
    }

    res.status(200).json({ success: true, cached, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Get category by name (slug)
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const rawSlug = req.params.slug;
    const slug = rawSlug.replace(/-/g, ' ');

    // Case insensitive match
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${slug}$`, 'i') } });

    // Fallback: If not found, do a robust space-ignoring match (handles stale frontend caches where 'modularkitchen' is sent instead of 'modular-kitchen')
    if (!category) {
      const allCats = await Category.find();
      category = allCats.find(c => c.name.replace(/\s+/g, '').toLowerCase() === rawSlug.replace(/[-]/g, '').toLowerCase());
    }

    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single category by ID
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new category
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    const cacheService = require('../services/cacheService');
    cacheService.del('categories:all');

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
exports.updateCategory = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const Product = require('../models/Product');

    const oldCategory = await Category.findById(req.params.id).session(session);
    if (!oldCategory) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const oldName = oldCategory.name;

    console.log("=== Category Update Request Body ===");
    console.log(JSON.stringify(req.body, null, 2));

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      session
    });

    console.log("=== Saved Category Document ===");
    console.log(JSON.stringify(category, null, 2));

    // Cascade name changes to products and catalog if name is updated
    if (req.body.name && req.body.name !== oldName) {
      const Catalog = require('../models/Catalog');
      await Promise.all([
        Product.updateMany(
          { category: oldName },
          { $set: { category: req.body.name } }
        ).session(session),
        Catalog.updateMany(
          { category: oldName },
          { $set: { category: req.body.name } }
        ).session(session)
      ]);
    }

    await session.commitTransaction();
    session.endSession();

    const cacheService = require('../services/cacheService');
    cacheService.del('categories:all');

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc    Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const Catalog = require('../models/Catalog');

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

    // Safeguard check: reject deletion if active products exist in the category
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category because it has ${productCount} active products associated with it in inventory. Please reassign the products first.`
      });
    }

    // Safeguard check: reject deletion if master catalog registry records exist under this category
    const catalogCount = await Catalog.countDocuments({ category: category.name });
    if (catalogCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category because it has ${catalogCount} master catalog registry items associated with it. Please reassign the catalog items first.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    const cacheService = require('../services/cacheService');
    cacheService.del('categories:all');

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
