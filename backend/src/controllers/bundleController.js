const mongoose = require('mongoose');
const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function getSystemCategoryAndBrand() {
  let category = await Category.findOne({ name: 'Bundles' });
  if (!category) {
    category = await Category.create({ name: 'Bundles', description: 'Auto-generated category for smart bundle checkout items' });
  }
  let brand = await Brand.findOne({ name: 'Riddha Bundles' });
  if (!brand) {
    brand = await Brand.create({ name: 'Riddha Bundles' });
  }
  return { category, brand };
}

// Creates (or refreshes) the single "virtual" Product that represents this bundle as
// one purchasable line item, so it flows through the existing cart/checkout/order
// pipeline without any changes to those systems.
async function syncVirtualProduct(bundle, adminId) {
  const { category, brand } = await getSystemCategoryAndBrand();

  const componentProducts = await Product.find({ _id: { $in: bundle.products.map((p) => p.product) } }).select('countInStock');
  const stockMap = new Map(componentProducts.map((p) => [String(p._id), p.countInStock]));
  const maxUnits = bundle.products.length
    ? Math.min(...bundle.products.map((p) => Math.floor((stockMap.get(String(p.product)) || 0) / p.quantity)))
    : 0;

  const productData = {
    name: `Bundle: ${bundle.name}`,
    description: bundle.description || `Smart bundle of ${bundle.products.length} products`,
    price: bundle.bundlePrice,
    category: category._id,
    brand: brand._id,
    images: bundle.image ? [bundle.image] : [],
    countInStock: Math.max(0, Number.isFinite(maxUnits) ? maxUnits : 0),
    seller: adminId,
    sellerType: 'Admin',
    isActive: bundle.isActive,
    isApproved: true,
    approvalStatus: 'approved',
    isBundle: true,
    bundleRef: bundle._id,
    unit: 'bundle'
  };

  if (bundle.virtualProduct) {
    await Product.findByIdAndUpdate(bundle.virtualProduct, productData);
    return bundle.virtualProduct;
  }

  const created = await Product.create(productData);
  return created._id;
}

function normalizeProductLines(products) {
  return products.map((p) => ({ product: p.productId || p.product, quantity: p.quantity || 1 }));
}

async function computeOriginalPrice(productLines, overridePrice) {
  if (overridePrice) return overridePrice;
  const productDocs = await Product.find({ _id: { $in: productLines.map((p) => p.product) } }).select('price');
  return productLines.reduce((sum, line) => {
    const doc = productDocs.find((p) => String(p._id) === String(line.product));
    return sum + (doc ? doc.price * line.quantity : 0);
  }, 0);
}

// @desc    Create a smart bundle
// @route   POST /api/bundles
// @access  Private/Admin
exports.createBundle = async (req, res) => {
  try {
    const { name, description, image, roomType, products, bundlePrice, originalPrice, validFrom, validUntil } = req.body;

    if (!name || !Array.isArray(products) || products.length < 2) {
      return res.status(400).json({ success: false, error: 'A bundle needs a name and at least 2 products' });
    }
    if (!bundlePrice || bundlePrice <= 0) {
      return res.status(400).json({ success: false, error: 'A valid bundlePrice is required' });
    }

    const productLines = normalizeProductLines(products);
    const invalidId = productLines.find((line) => !isValidId(line.product));
    if (invalidId) {
      return res.status(400).json({ success: false, error: `Invalid product id: ${invalidId.product}` });
    }

    const uniqueIds = new Set(productLines.map((line) => String(line.product)));
    const existingCount = await Product.countDocuments({ _id: { $in: [...uniqueIds] } });
    if (existingCount !== uniqueIds.size) {
      return res.status(400).json({ success: false, error: 'One or more products were not found' });
    }

    const computedOriginalPrice = await computeOriginalPrice(productLines, originalPrice);
    if (bundlePrice >= computedOriginalPrice) {
      return res.status(400).json({ success: false, error: 'Bundle price must be lower than the combined original price' });
    }

    const bundle = new Bundle({
      name,
      description,
      image,
      roomType: roomType || null,
      products: productLines,
      bundlePrice,
      originalPrice: computedOriginalPrice,
      discountPercentage: Number((((computedOriginalPrice - bundlePrice) / computedOriginalPrice) * 100).toFixed(2)),
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      createdBy: req.user._id
    });

    bundle.virtualProduct = await syncVirtualProduct(bundle, req.user._id);
    await bundle.save();

    const populated = await Bundle.findById(bundle._id)
      .populate('products.product', 'name price images')
      .populate('virtualProduct', 'price countInStock');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    List active bundles (storefront)
// @route   GET /api/bundles
// @access  Public
exports.getBundles = async (req, res) => {
  try {
    const { roomType, limit = 12, skip = 0 } = req.query;
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] }
      ]
    };
    if (roomType) filter.roomType = roomType;

    const cappedLimit = Math.min(parseInt(limit, 10) || 12, 50);
    const bundles = await Bundle.find(filter)
      .populate('products.product', 'name price images')
      .sort({ createdAt: -1 })
      .limit(cappedLimit)
      .skip(parseInt(skip, 10) || 0);

    const total = await Bundle.countDocuments(filter);

    return res.json({ success: true, data: bundles, pagination: { total, limit: cappedLimit, skip: parseInt(skip, 10) || 0 } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    List all bundles regardless of status (admin dashboard)
// @route   GET /api/bundles/admin
// @access  Private/Admin
exports.getAdminBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({})
      .populate('products.product', 'name price images')
      .populate('virtualProduct', 'price countInStock')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: bundles });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    AI-suggested bundles containing any of the given products
// @route   GET /api/bundles/suggestions
// @access  Public
exports.getBundleSuggestions = async (req, res) => {
  try {
    const { productIds, limit = 5 } = req.query;
    if (!productIds) {
      return res.status(400).json({ success: false, error: 'productIds is required' });
    }
    const ids = productIds.split(',').map((s) => s.trim()).filter(isValidId);
    if (ids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const bundles = await Bundle.find({
      'products.product': { $in: ids },
      isActive: true
    })
      .populate('products.product', 'name price images')
      .limit(Math.min(parseInt(limit, 10) || 5, 20));

    return res.json({ success: true, data: bundles });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get bundle details
// @route   GET /api/bundles/:id
// @access  Public
exports.getBundle = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid bundle id' });
    }
    const bundle = await Bundle.findById(req.params.id)
      .populate('products.product')
      .populate('virtualProduct', 'price countInStock images');

    if (!bundle) {
      return res.status(404).json({ success: false, error: 'Bundle not found' });
    }

    Bundle.updateOne({ _id: bundle._id }, { $inc: { 'analytics.views': 1 } }).catch(() => {});

    return res.json({ success: true, data: bundle });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a bundle
// @route   PUT /api/bundles/:id
// @access  Private/Admin
exports.updateBundle = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid bundle id' });
    }
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ success: false, error: 'Bundle not found' });
    }

    const { name, description, image, roomType, products, bundlePrice, originalPrice, isActive, validFrom, validUntil } = req.body;

    if (products) {
      if (!Array.isArray(products) || products.length < 2) {
        return res.status(400).json({ success: false, error: 'A bundle needs at least 2 products' });
      }
      const productLines = normalizeProductLines(products);
      const invalidId = productLines.find((line) => !isValidId(line.product));
      if (invalidId) {
        return res.status(400).json({ success: false, error: `Invalid product id: ${invalidId.product}` });
      }
      const uniqueIds = new Set(productLines.map((line) => String(line.product)));
      const existingCount = await Product.countDocuments({ _id: { $in: [...uniqueIds] } });
      if (existingCount !== uniqueIds.size) {
        return res.status(400).json({ success: false, error: 'One or more products were not found' });
      }
      bundle.products = productLines;
    }

    if (name !== undefined) bundle.name = name;
    if (description !== undefined) bundle.description = description;
    if (image !== undefined) bundle.image = image;
    if (roomType !== undefined) bundle.roomType = roomType || null;
    if (isActive !== undefined) bundle.isActive = isActive;
    if (validFrom !== undefined) bundle.validFrom = validFrom || null;
    if (validUntil !== undefined) bundle.validUntil = validUntil || null;

    if (bundlePrice !== undefined || originalPrice !== undefined || products) {
      const computedOriginalPrice = await computeOriginalPrice(bundle.products, originalPrice);
      const newBundlePrice = bundlePrice !== undefined ? bundlePrice : bundle.bundlePrice;

      if (newBundlePrice >= computedOriginalPrice) {
        return res.status(400).json({ success: false, error: 'Bundle price must be lower than the combined original price' });
      }

      bundle.bundlePrice = newBundlePrice;
      bundle.originalPrice = computedOriginalPrice;
      bundle.discountPercentage = Number((((computedOriginalPrice - newBundlePrice) / computedOriginalPrice) * 100).toFixed(2));
    }

    bundle.virtualProduct = await syncVirtualProduct(bundle, req.user._id);
    await bundle.save();

    const populated = await Bundle.findById(bundle._id)
      .populate('products.product', 'name price images')
      .populate('virtualProduct', 'price countInStock');

    return res.json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a bundle
// @route   DELETE /api/bundles/:id
// @access  Private/Admin
exports.deleteBundle = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid bundle id' });
    }
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ success: false, error: 'Bundle not found' });
    }

    // Deactivate rather than delete the companion product — past orders may still
    // reference it, and deleting would break order-history population.
    if (bundle.virtualProduct) {
      await Product.findByIdAndUpdate(bundle.virtualProduct, { isActive: false, isApproved: false });
    }
    await bundle.deleteOne();

    return res.json({ success: true, message: 'Bundle deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
