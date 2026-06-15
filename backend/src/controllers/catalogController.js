const Catalog = require('../models/Catalog');

// @desc    Get all catalog items
// @route   GET /api/catalog
// @access  Public (or Admin? usually public for searching, but admin for management)
exports.getCatalogItems = async (req, res, next) => {
  try {
    const items = await Catalog.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new catalog item
// @route   POST /api/catalog
// @access  Private/Admin
exports.createCatalogItem = async (req, res, next) => {
  try {
    const item = await Catalog.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Product code (SKU) already exists' });
    }
    next(error);
  }
};

// @desc    Get single catalog item
// @route   GET /api/catalog/:id
// @access  Public
exports.getCatalogItem = async (req, res, next) => {
  try {
    const item = await Catalog.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Catalog item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Update catalog item
// @route   PUT /api/catalog/:id
// @access  Private/Admin
exports.updateCatalogItem = async (req, res, next) => {
  try {
    const item = await Catalog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Catalog item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete catalog item
// @route   DELETE /api/catalog/:id
// @access  Private/Admin
exports.deleteCatalogItem = async (req, res, next) => {
  try {
    const item = await Catalog.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Catalog item not found' });
    }

    // Safeguard check: reject deletion if active shop inventory references this SKU
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ sku: item.sku });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete catalog item because its SKU code (${item.sku}) is currently referenced by ${productCount} active products in active shop inventory. Please remove those inventory records first.`
      });
    }

    await Catalog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Check SKU uniqueness in master catalog
// @route   GET /api/catalog/check-sku/:sku
// @access  Private/Admin
exports.checkCatalogSku = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const exists = await Catalog.findOne({ sku: sku.trim() });
    res.status(200).json({ success: true, exists: !!exists });
  } catch (error) {
    next(error);
  }
};
