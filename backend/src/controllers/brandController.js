const Brand = require('../models/Brand');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all brands (Admin)
// @route   GET /api/brands/admin
// @access  Private/Admin
exports.getAdminBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin or Seller
exports.createBrand = async (req, res) => {
  try {
    const brandData = { ...req.body };
    if (req.user && req.user.role === 'seller') {
      brandData.isActive = false;
    }
    const brand = await Brand.create(brandData);
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    console.error('Create Brand Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Brand name already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
