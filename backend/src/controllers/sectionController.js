const mongoose = require('mongoose');
const Section = require('../models/Section');
const Category = require('../models/Category');
const Product = require('../models/Product');
const PromoBanner = require('../models/PromoBanner');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeIdArray = (value) => {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return [...new Set(
    items
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'object') {
          return String(item._id || item.id || '').trim();
        }
        return String(item).trim();
      })
      .filter(Boolean)
  )];
};

const normalizeBannerItems = (value) => {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];

  return items
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return {
          title: item.trim(),
          subtitle: '',
          image: '',
          ctaText: 'Shop Now',
          ctaLink: '',
          alt: ''
        };
      }

      return {
        _id: item._id || item.id,
        title: String(item.title || '').trim(),
        subtitle: String(item.subtitle || '').trim(),
        image: String(item.image || item.bgImage?.src || item.bannerImage || '').trim(),
        ctaText: String(item.ctaText || '').trim() || 'Shop Now',
        ctaLink: String(item.ctaLink || '').trim(),
        alt: String(item.alt || item.bgImage?.alt || '').trim()
      };
    })
    .filter((item) => item && item.title && item.image);
};

const buildSectionPayload = (body = {}) => {
  const displayType = ['product', 'category', 'banner'].includes(body.displayType)
    ? body.displayType
    : 'product';
  const categoryIds = normalizeIdArray(body.categoryIds);
  const productIds = normalizeIdArray(body.productIds);
  const bannerIds = normalizeIdArray(body.bannerIds);
  const bannerItems = normalizeBannerItems(body.bannerItems);

  return {
    title: body.title,
    subtitle: body.subtitle,
    displayType,
    displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0,
    isActive: body.isActive === false || body.isActive === 'false' ? false : true,
    categoryIds: displayType === 'product' || displayType === 'category' ? categoryIds : [],
    productIds: displayType === 'product' ? productIds : [],
    bannerIds: displayType === 'banner' && !bannerItems.length ? bannerIds : [],
    bannerItems: displayType === 'banner' ? bannerItems : []
  };
};

const populateSection = (query) =>
  query.populate('categoryIds').populate('productIds').populate('bannerIds');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const validateSectionPayload = async (payload) => {
  if (!payload.title || !payload.title.trim()) {
    return 'Please add a section title.';
  }

  if (!payload.displayType) {
    return 'Please choose a display type.';
  }

  if (payload.displayType === 'product') {
    if (!payload.categoryIds.length) {
      return 'Please select at least one category for product sections.';
    }
    if (!payload.productIds.length) {
      return 'Please select at least one product for product sections.';
    }

    const categories = await Category.find({ _id: { $in: payload.categoryIds } }).select('name');
    if (categories.length !== payload.categoryIds.length) {
      return 'One or more selected categories are no longer available.';
    }

    const allowedCategoryNames = new Set(categories.map((category) => normalizeText(category.name)));
    const products = await Product.find({ _id: { $in: payload.productIds } }).select('category name');
    if (products.length !== payload.productIds.length) {
      return 'One or more selected products are no longer available.';
    }

    const invalidProduct = products.find(
      (product) => !allowedCategoryNames.has(normalizeText(product.category))
    );
    if (invalidProduct) {
      return 'Every selected product must belong to one of the chosen categories.';
    }
  }

  if (payload.displayType === 'category' && !payload.categoryIds.length) {
    return 'Please select at least one category for category sections.';
  }

  if (payload.displayType === 'category') {
    const categories = await Category.find({ _id: { $in: payload.categoryIds } }).select('name');
    if (categories.length !== payload.categoryIds.length) {
      return 'One or more selected categories are no longer available.';
    }
  }

  if (payload.displayType === 'banner' && !payload.bannerItems.length && !payload.bannerIds.length) {
    return 'Please add at least one custom banner for banner sections.';
  }

  if (payload.displayType === 'banner' && payload.bannerItems.length === 0 && payload.bannerIds.length) {
    const banners = await PromoBanner.find({ _id: { $in: payload.bannerIds } }).select('_id');
    if (banners.length !== payload.bannerIds.length) {
      return 'One or more selected banners are no longer available.';
    }
  }

  return null;
};

// @desc    Get all sections
// @route   GET /api/sections
// @access  Public
exports.getSections = async (req, res) => {
  try {
    const cacheService = require('../services/cacheService');
    const cacheKey = 'home:sections';

    let sections = cacheService.get(cacheKey);
    let cached = true;

    if (!sections) {
      cached = false;
      sections = await populateSection(
        Section.find().sort({ displayOrder: 1, createdAt: -1 })
      ).lean();

      // Auto-clean: remove null productIds (deleted products) from each section
      const cleanupPromises = [];
      sections = sections.map((section) => {
        const originalProductIds = section.productIds || [];
        const validProducts = originalProductIds.filter((p) => p !== null && p !== undefined);

        // If any products were null (deleted), update the DB to remove dead references
        if (validProducts.length !== originalProductIds.length) {
          cleanupPromises.push(
            Section.findByIdAndUpdate(section._id, {
              $set: { productIds: validProducts.map((p) => p._id) }
            })
          );
        }

        return { ...section, productIds: validProducts };
      });

      // Run DB cleanup in background (don't block response)
      if (cleanupPromises.length > 0) {
        Promise.all(cleanupPromises).catch((err) =>
          console.error('[Sections] Failed to auto-clean deleted product refs:', err.message)
        );
      }

      cacheService.set(cacheKey, sections, 3600); // 1 hour cache
    }

    res.status(200).json({
      success: true,
      cached,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single section
// @route   GET /api/sections/:id
// @access  Public
exports.getSectionById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await populateSection(Section.findById(req.params.id));
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Get section by id error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create section
// @route   POST /api/sections
// @access  Private/Admin
exports.createSection = async (req, res) => {
  try {
    const payload = buildSectionPayload(req.body);
    const validationError = await validateSectionPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const section = await Section.create(payload);

    const cacheService = require('../services/cacheService');
    cacheService.del('home:sections');

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private/Admin
exports.updateSection = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const payload = buildSectionPayload(req.body);
    const validationError = await validateSectionPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const section = await Section.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    const cacheService = require('../services/cacheService');
    cacheService.del('home:sections');

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private/Admin
exports.deleteSection = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID' });
    }

    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    const cacheService = require('../services/cacheService');
    cacheService.del('home:sections');

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
