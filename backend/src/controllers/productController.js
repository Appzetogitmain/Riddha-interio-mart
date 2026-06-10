const Product = require('../models/Product');
const Seller = require('../models/Seller');
const paginate = require('../utils/paginate');

// @desc    Get all products (Filter by Verified Sellers only for Public)
exports.getProducts = async (req, res, next) => {
  try {
    const searchService = require('../services/searchService');

    // Dump all database products to check their categories and subcategories
    try {
      const fs = require('fs');
      const path = require('path');
      const allProducts = await Product.find({}, 'name category subcategory subsubcategory');
      fs.writeFileSync(path.join(__dirname, '../../db_dump.json'), JSON.stringify(allProducts, null, 2));
    } catch (err) {
      console.error("Failed to dump products:", err);
    }

    // 1. Generate unique cache key based on query parameters
    const cacheService = require('../services/cacheService');
    const cacheKey = `products:list:${JSON.stringify(req.query)}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const filter = {};

    // 2. Apply Category, Brand, and Admin protections
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.subcategory && req.query.subcategory !== 'all') {
      filter.subcategory = { $regex: new RegExp(`^${req.query.subcategory.trim()}$`, 'i') };
    }

    if (req.query.subsubcategory && req.query.subsubcategory !== 'all') {
      filter.subsubcategory = { $regex: new RegExp(`^${req.query.subsubcategory.trim()}$`, 'i') };
    }
    
    if (req.query.brand && req.query.brand !== 'all') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.query.brand)) {
        filter.brand = req.query.brand;
      } else {
        const Brand = require('../models/Brand');
        const foundBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${req.query.brand.trim()}$`, 'i') } });
        if (foundBrand) {
          filter.brand = foundBrand._id;
        } else {
          filter.brand = new mongoose.Types.ObjectId();
        }
      }
    }

    // Default protections: only show approved/active unless Admin overrides
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      filter.isApproved = true;
      filter.isActive = true;
      
      // Filter out products from unverified sellers
      const unverifiedSellers = await Seller.find({ isVerified: { $ne: true } }).select('_id');
      const unverifiedSellerIds = unverifiedSellers.map(s => s._id);
      filter.seller = { $nin: unverifiedSellerIds };
    } else {
      if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
        filter.isActive = req.query.isActive === 'true' || req.query.isActive === true;
      }
      if (req.query.isApproved !== undefined && req.query.isApproved !== 'all') {
        filter.isApproved = req.query.isApproved === 'true' || req.query.isApproved === true;
      }
      if (req.query.approvalStatus && req.query.approvalStatus !== 'all') {
        filter.approvalStatus = req.query.approvalStatus;
      }
    }

    // 3. Dynamic Price Filters
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // 4. Availability Filters (Only show items in stock)
    if (req.query.inStock === 'true') {
      filter.$expr = {
        $gt: [{ $subtract: ['$countInStock', '$reservedStock'] }, 0]
      };
    }

    // 5. Ratings Threshold Filters
    if (req.query.rating) {
      filter.averageRating = { $gte: Number(req.query.rating) };
    }

    // 6. Typo-Tolerant & Fuzzy Search Integration
    let isFuzzyFallbackUsed = false;
    if (req.query.search) {
      const searchPhrase = req.query.search.trim();
      
      // Async log for trending analytics
      searchService.logSearch(req.user ? req.user.id : null, searchPhrase);

      // Attempt primary full-text match
      filter.$text = { $search: searchPhrase };
      
      const primaryCount = await Product.countDocuments(filter);
      if (primaryCount === 0) {
        // Fallback to typo-tolerant regex bounds on search miss
        delete filter.$text;
        isFuzzyFallbackUsed = true;
        
        const fuzzyPatterns = searchService.getFuzzyRegex(searchPhrase);
        filter.$or = [
          { name: { $all: fuzzyPatterns } },
          { description: { $all: fuzzyPatterns } }
        ];
      }
    }

    // 7. Paginate results
    const populateOptions = [
      { path: 'seller', select: 'fullName shopName' },
      { path: 'brand', select: 'name logo' }
    ];

    console.log("FILTER BUILT FOR PRODUCTS QUERY:", JSON.stringify(filter, null, 2));
    const result = await paginate(Product, filter, req, populateOptions);

    // Apply ranking sort based on Levenshtein distances if fuzzy regex fallback is active
    if (isFuzzyFallbackUsed && req.query.search) {
      const searchPhrase = req.query.search.trim();
      result.data.sort((a, b) => {
        const distA = searchService.getLevenshteinDistance(a.name, searchPhrase);
        const distB = searchService.getLevenshteinDistance(b.name, searchPhrase);
        return distA - distB;
      });
    }

    const outputPayload = {
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      fuzzyFallback: isFuzzyFallbackUsed,
      data: result.data
    };

    // Store in-memory cache
    cacheService.set(cacheKey, outputPayload, 300); // 5 minutes cache

    // Write to local debug file
    try {
      const fs = require('fs');
      const path = require('path');
      const debugPath = path.join(__dirname, '../../debug_products.json');
      fs.writeFileSync(debugPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        query: req.query,
        builtFilter: filter,
        resultCount: result.data.length,
        results: result.data.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          subsubcategory: p.subsubcategory
        }))
      }, null, 2));
    } catch (err) {
      console.error("Failed to write debug file:", err);
    }

    res.status(200).json({
      success: true,
      cached: false,
      ...outputPayload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get autocomplete recommendations, recent queries and trending terms
// @route   GET /api/products/search/suggestions
// @access  Public (Optional auth)
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const searchService = require('../services/searchService');
    const q = req.query.q || '';
    const userId = req.user ? req.user.id : null;

    const data = await searchService.getSuggestions(userId, q);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
exports.createProduct = async (req, res, next) => {
  try {
    const { source = 'new' } = req.body;
    
    // Clean up empty string brand to avoid BSON Error and assign a default brand fallback
    if (req.body.brand === '') {
      delete req.body.brand;
    }
    
    if (!req.body.brand) {
      const Brand = require('../models/Brand');
      let defaultBrand = await Brand.findOne({ name: 'General' });
      if (!defaultBrand) {
        defaultBrand = await Brand.findOne();
      }
      if (!defaultBrand) {
        defaultBrand = await Brand.create({ name: 'General' });
      }
      req.body.brand = defaultBrand._id;
    }
    
    // Automatically set seller and sellerType based on role if not provided
    if (!req.body.seller) {
      req.body.seller = req.user.id;
      req.body.sellerType = req.user.role === 'admin' ? 'Admin' : 'Seller';
    }

    // Handle Auto-approval logic
    // 1. Admin added products are auto-approved
    // 2. Catalog products are auto-approved
    // 3. New products from sellers need approval
    if (req.user.role === 'admin' || source === 'catalog') {
      req.body.isApproved = true;
      req.body.approvalStatus = 'approved';
    } else {
      req.body.isApproved = false;
      req.body.approvalStatus = 'pending';
    }

    // Set initial sellerPrice from the provided price
    if (req.body.price) {
      req.body.sellerPrice = req.body.price;
    }

    // 2. Create the product
    const product = await Product.create(req.body);

    // Admin is notified only when seller submits a batch, not on individual product adds
    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');
    
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Admin: Approve or Reject product
exports.updateApprovalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid approval status' });
    }

    const { adminCommission } = req.body;
    const updateData = {
      approvalStatus,
      isApproved: approvalStatus === 'approved'
    };

    if (adminCommission !== undefined) {
      updateData.adminCommission = adminCommission;
    }

    // Recalculate price if approved
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (approvalStatus === 'approved') {
      const commission = adminCommission !== undefined ? adminCommission : existingProduct.adminCommission;
      const sPrice = existingProduct.sellerPrice || existingProduct.price;
      updateData.price = Math.round(sPrice * (1 + commission / 100));
      updateData.sellerPrice = sPrice; // Ensure it's set
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Notify seller about approval/rejection
    const { notifySellerProductApproval } = require('../socket');
    notifySellerProductApproval(product.seller, {
      message: `Your product "${product.name}" has been ${approvalStatus}.`,
      productId: product._id,
      status: approvalStatus
    });

    // Log the admin action
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      const action = approvalStatus === 'approved' ? 'Approved Product Listing' 
        : approvalStatus === 'rejected' ? 'Rejected Product Listing'
        : 'Updated Product Approval Status';
      await logSystemActivity({
        action,
        target: product.name,
        user: req.user ? req.user.fullName : 'Admin',
        role: req.user && req.user.role === 'admin' ? 'Super Admin' : 'System',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr.message);
    }

    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');
    cacheService.del(`products:single:${id}`);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
exports.getProduct = async (req, res, next) => {
  try {
    const cacheService = require('../services/cacheService');
    const cacheKey = `products:single:${req.params.id}`;
    
    let product = cacheService.get(cacheKey);
    let cached = true;

    if (!product) {
      cached = false;
      product = await Product.findById(req.params.id)
        .populate('seller', 'fullName shopName isVerified')
        .populate('brand', 'name logo')
        .lean();
      
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      cacheService.set(cacheKey, product, 300); // 5 minutes cache
    }

    // Logic: Admin can see everything, others only see verified/approved products
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && product.seller?._id?.toString() === req.user?.id;
    
    // Check Seller Verification (Skip if seller is Admin)
    const isSellerAdmin = product.sellerType === 'Admin';
    if (!isAdmin && !isOwner && !isSellerAdmin && !product.seller?.isVerified) {
       return res.status(401).json({ success: false, error: 'This product is currently unavailable (Seller verification pending)' });
    }

    // Check Product Approval
    if (!isAdmin && !isOwner && !product.isApproved) {
      return res.status(401).json({ success: false, error: 'This product is currently under review.' });
    }

    res.status(200).json({ success: true, cached, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for the logged in seller
exports.getSellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user.id });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'User not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Log the deletion action if it's done by admin
    if (req.user && req.user.role === 'admin') {
      try {
        const { logSystemActivity } = require('../utils/activityLogger');
        await logSystemActivity({
          action: 'Deleted Product',
          target: product.name,
          user: req.user.fullName,
          role: 'Super Admin',
          ipAddress: req.ip
        });
      } catch (logErr) {
        console.error('Failed to log admin action:', logErr.message);
      }
    }

    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');
    cacheService.del(`products:single:${req.params.id}`);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete controller error:', error);
    next(error);
  }
};

// @desc    Update product
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'User not authorized to update this product' });
    }

    // Clean up empty string brand to avoid BSON Error
    if (req.body.brand === '') {
      delete req.body.brand;
    }

    // If admin is updating, handle commission logic
    if (req.user.role === 'admin') {
      const { adminCommission, price: newPrice, sellerPrice: newSPrice } = req.body;
      
      const sPrice = newSPrice || product.sellerPrice || product.price;
      const commission = adminCommission !== undefined ? adminCommission : product.adminCommission;
      
      // If adminCommission was updated, recalculate price
      if (adminCommission !== undefined) {
        req.body.price = Math.round(sPrice * (1 + commission / 100));
        req.body.sellerPrice = sPrice;
      }
    } else {
      // If seller is updating, update sellerPrice instead of final price if they try to change price
      if (req.body.price) {
        req.body.sellerPrice = req.body.price;
        // Keep final price synced but wait for admin to re-approve or just keep commission the same
        req.body.price = Math.round(req.body.price * (1 + product.adminCommission / 100));
      }
      // Sellers shouldn't touch commission
      delete req.body.adminCommission;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');
    cacheService.del(`products:single:${req.params.id}`);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create multiple products
// @route   POST /api/products/bulk
// @access  Private/Admin or Seller
exports.createBulkProducts = async (req, res, next) => {
  try {
    const { products } = req.body;
    const Brand = require('../models/Brand');

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, error: 'Please provide an array of products' });
    }

    const seller = req.user.id;
    const sellerType = req.user.role === 'admin' ? 'Admin' : 'Seller';
    const isApproved = req.user.role === 'admin';
    const approvalStatus = req.user.role === 'admin' ? 'approved' : 'pending';

    const productsToCreate = await Promise.all(products.map(async (p, index) => {
      let brandId = p.brand;
      
      // If brand is a string (name), find or create it
      if (typeof p.brand === 'string' && p.brand.trim() !== '') {
        let brand = await Brand.findOne({ name: { $regex: new RegExp(`^${p.brand.trim()}$`, 'i') } });
        if (!brand) {
          console.log(`Creating new brand: ${p.brand.trim()}`);
          brand = await Brand.create({ name: p.brand.trim() });
        }
        brandId = brand._id;
      } else if (!p.brand) {
        let defaultBrand = await Brand.findOne({ name: 'General' });
        if (!defaultBrand) {
          defaultBrand = await Brand.create({ name: 'General' });
        }
        brandId = defaultBrand._id;
      }

      return {
        ...p,
        brand: brandId,
        seller,
        sellerType,
        isApproved,
        approvalStatus,
        sellerPrice: p.price,
        description: p.description || `${p.name} - Quality product from Riddha Mart.`
      };
    }));

    const createdProducts = await Product.insertMany(productsToCreate);

    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');

    res.status(201).json({
      success: true,
      count: createdProducts.length,
      data: createdProducts
    });
  } catch (error) {
    console.error('Bulk Create Error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('Validation Errors:', messages);
    }
    next(error);
  }
};

// @desc    Update stock for multiple products
// @route   PATCH /api/products/bulk-stock
// @access  Private/Admin or Seller
exports.updateBulkStock = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { productId, newStock }
    const results = [];

    for (const update of updates) {
      const { productId, newStock } = update;
      
      const product = await Product.findById(productId);
      if (!product) {
        results.push({ productId, success: false, message: 'Product not found' });
        continue;
      }

      // Sellers can only update their own products
      if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
        results.push({ productId, success: false, message: 'Not authorized' });
        continue;
      }

      product.countInStock = newStock;
      await product.save();
      results.push({ productId, success: true, countInStock: newStock });
    }

    const cacheService = require('../services/cacheService');
    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');
    if (updates && Array.isArray(updates)) {
      for (const update of updates) {
        cacheService.del(`products:single:${update.productId}`);
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Check SKU uniqueness in live products
// @route   GET /api/products/check-sku/:sku
// @access  Private/Admin
exports.checkProductSku = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const exists = await Product.findOne({ sku: sku.trim() });
    res.status(200).json({ success: true, exists: !!exists });
  } catch (error) {
    next(error);
  }
};
