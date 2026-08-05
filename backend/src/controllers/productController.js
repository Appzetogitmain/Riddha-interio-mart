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
    const mongoose = require('mongoose');
    const Category = require('../models/Category');

    if (req.query.category && req.query.category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(req.query.category)) {
        filter.category = req.query.category;
      } else {
        const foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') } });
        if (foundCat) {
          filter.category = foundCat._id;
          
          if (req.query.subcategory && req.query.subcategory !== 'all') {
            let subcatId = null;
            if (mongoose.Types.ObjectId.isValid(req.query.subcategory)) {
               subcatId = req.query.subcategory;
            } else {
               const subRegex = new RegExp(`^${req.query.subcategory.trim()}$`, 'i');
               const subObj = foundCat.subcategories.find(s => subRegex.test(s.name));
               if (subObj) subcatId = subObj._id;
            }
            if (subcatId) {
               filter.subcategory = subcatId;
               
               if (req.query.subsubcategory && req.query.subsubcategory !== 'all') {
                 let subsubId = null;
                 if (mongoose.Types.ObjectId.isValid(req.query.subsubcategory)) {
                    subsubId = req.query.subsubcategory;
                 } else {
                    const subsubRegex = new RegExp(`^${req.query.subsubcategory.trim()}$`, 'i');
                    const targetSub = foundCat.subcategories.find(s => s._id.toString() === subcatId.toString());
                    if (targetSub && targetSub.subsubcategories) {
                       const subsubObj = targetSub.subsubcategories.find(ss => subsubRegex.test(ss.name));
                       if (subsubObj) subsubId = subsubObj._id;
                    }
                 }
                 if (subsubId) filter.subsubcategory = subsubId;
                 else filter.subsubcategory = new mongoose.Types.ObjectId();
               }
            } else {
               filter.subcategory = new mongoose.Types.ObjectId();
            }
          }
        } else {
          filter.category = new mongoose.Types.ObjectId();
        }
      }
    } else if (req.query.subcategory && req.query.subcategory !== 'all') {
      // Fallback if category not provided but subcategory is
      if (mongoose.Types.ObjectId.isValid(req.query.subcategory)) {
         filter.subcategory = req.query.subcategory;
      } else {
         const subRegex = new RegExp(`^${req.query.subcategory.trim()}$`, 'i');
         const cats = await Category.find({ "subcategories.name": subRegex });
         const subIds = [];
         cats.forEach(c => {
           c.subcategories.forEach(s => {
             if (subRegex.test(s.name)) subIds.push(s._id);
           });
         });
         if (subIds.length > 0) filter.subcategory = { $in: subIds };
         else filter.subcategory = new mongoose.Types.ObjectId();
      }
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
      const unverifiedSellerIds = unverifiedSellers.map(s => s._id.toString());

      if (req.query.seller) {
        if (unverifiedSellerIds.includes(req.query.seller.toString())) {
          // If the requested seller is unverified, don't show any products
          const mongoose = require('mongoose');
          filter.seller = new mongoose.Types.ObjectId();
        } else {
          filter.seller = req.query.seller;
        }
      } else {
        filter.seller = { $nin: unverifiedSellers.map(s => s._id) };
      }
    } else {
      if (req.query.seller) {
        filter.seller = req.query.seller;
      }
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
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' }
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

    // Map populated category back to string for frontend compatibility, and provide categoryId
    const formattedData = result.data.map(p => {
      const pObj = p.toObject ? p.toObject() : { ...p };
      if (pObj.category && typeof pObj.category === 'object') {
        pObj.categoryId = pObj.category._id;
        pObj.category = pObj.category.name;
      }
      return pObj;
    });

    const outputPayload = {
      count: formattedData.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      fuzzyFallback: isFuzzyFallbackUsed,
      data: formattedData
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
      if (!req.body.sellerType) {
        req.body.sellerType = req.user.role === 'admin' ? 'Admin' : 'Seller';
      }
    }

    // Handle Auto-approval logic
    // 1. Admin added products via Admin Panel (sends isApproved: true) are auto-approved
    // 2. Products added via Seller Panel (no isApproved flag) need approval, even if added by Admin
    if (req.user.role === 'admin' && req.body.isApproved === true) {
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
    if (req.body.b2bPrice) {
      req.body.sellerB2bPrice = req.body.b2bPrice;
    }

    // Resolve Category, Subcategory, Subsubcategory from Strings to ObjectIds
    if (req.body.category && typeof req.body.category === 'string') {
      const mongoose = require('mongoose');
      const Category = require('../models/Category');
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        const foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${req.body.category.trim()}$`, 'i') } });
        if (foundCat) {
          req.body.category = foundCat._id;
          
          if (req.body.subcategory && typeof req.body.subcategory === 'string') {
            if (!mongoose.Types.ObjectId.isValid(req.body.subcategory)) {
              const subRegex = new RegExp(`^${req.body.subcategory.trim()}$`, 'i');
              const subObj = foundCat.subcategories.find(s => subRegex.test(s.name));
              if (subObj) {
                req.body.subcategory = subObj._id;
                
                if (req.body.subsubcategory && typeof req.body.subsubcategory === 'string') {
                  if (!mongoose.Types.ObjectId.isValid(req.body.subsubcategory)) {
                    const subsubRegex = new RegExp(`^${req.body.subsubcategory.trim()}$`, 'i');
                    if (subObj.subsubcategories) {
                      const subsubObj = subObj.subsubcategories.find(ss => subsubRegex.test(ss.name));
                      if (subsubObj) {
                        req.body.subsubcategory = subsubObj._id;
                      } else delete req.body.subsubcategory;
                    } else delete req.body.subsubcategory;
                  }
                }
              } else {
                delete req.body.subcategory;
                delete req.body.subsubcategory;
              }
            }
          } else {
            // If there's no subcategory, we can't have a subsubcategory
            delete req.body.subsubcategory;
          }
        } else {
          // If category not found, we can't save it because it's required to be an ObjectId
          // Or we create a new one? For now, if not found, we delete it to trigger validation error
          delete req.body.category;
          delete req.body.subcategory;
          delete req.body.subsubcategory;
        }
      }
    }

    // Safety net: ensure any remaining subcategory/subsubcategory are valid ObjectIds
    // to prevent Cast to ObjectId errors
    const mongoose = require('mongoose');
    if (req.body.subcategory && !mongoose.Types.ObjectId.isValid(req.body.subcategory)) {
      delete req.body.subcategory;
    }
    if (req.body.subsubcategory && !mongoose.Types.ObjectId.isValid(req.body.subsubcategory)) {
      delete req.body.subsubcategory;
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
    
    const { b2bAdminCommission } = req.body;
    if (b2bAdminCommission !== undefined) {
      updateData.b2bAdminCommission = b2bAdminCommission;
    }

    // Recalculate price if approved
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (approvalStatus === 'approved') {
      // Admin must specify commission or it defaults to existing (or 0 if never set)
      const commission = adminCommission !== undefined ? adminCommission : (existingProduct.adminCommission || 0);
      const sPrice = existingProduct.sellerPrice || existingProduct.price;
      updateData.adminCommission = commission;
      updateData.price = Math.round(sPrice * (1 + commission / 100));
      updateData.sellerPrice = sPrice;
      updateData.discountPrice = 0; // Clear stale discount — seller price may have changed after commission

      const b2bComm = b2bAdminCommission !== undefined ? b2bAdminCommission : (existingProduct.b2bAdminCommission || 0);
      const sB2bPrice = existingProduct.sellerB2bPrice || existingProduct.b2bPrice;
      if (sB2bPrice) {
         updateData.b2bAdminCommission = b2bComm;
         updateData.b2bPrice = Math.round(sB2bPrice * (1 + b2bComm / 100));
         updateData.sellerB2bPrice = sB2bPrice;
      }
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
        .populate('category', 'name')
        .lean();
      
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      cacheService.set(cacheKey, product, 300); // 5 minutes cache
    }

    // Logic: Admin can see everything, others only see verified/approved products
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && product.seller && (product.seller._id?.toString() === req.user._id?.toString());
    
    // Check Seller Verification (Skip if seller is Admin)
    const isSellerAdmin = product.sellerType === 'Admin';
    if (!isAdmin && !isOwner && !isSellerAdmin && !product.seller?.isVerified) {
       return res.status(401).json({ success: false, error: 'This product is currently unavailable (Seller verification pending)' });
    }

    // Check Product Approval
    if (!isAdmin && !isOwner && !product.isApproved) {
      return res.status(401).json({ success: false, error: 'This product is currently under review.' });
    }

    // Format category for frontend
    if (product.category && typeof product.category === 'object') {
      product.categoryId = product.category._id;
      product.category = product.category.name;
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

    try {
      if (product.seller && req.user && req.user.role === 'admin') {
        const { notifySellerProductDeleted } = require('../socket');
        await notifySellerProductDeleted(product.seller, {
          message: `Your product "${product.name}" was deleted by the admin team.`,
          productId: product._id,
          productName: product.name,
          deletedBy: req.user.fullName || req.user.name || 'Admin'
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify seller about product deletion:', notifyErr.message);
    }

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

    // Make sure user is product owner or admin (support both .id and ._id)
    const userId = req.user._id?.toString() || req.user.id?.toString();
    if (product.seller.toString() !== userId && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'User not authorized to update this product' });
    }

    // Clean up empty string ObjectId fields to avoid BSON cast errors
    if (req.body.brand === '') delete req.body.brand;
    if (req.body.subcategory === '') delete req.body.subcategory;
    if (req.body.subsubcategory === '') delete req.body.subsubcategory;
    if (req.body.category === '') delete req.body.category;

      // If admin is updating, handle commission logic
    if (req.user.role === 'admin') {
      const { adminCommission, b2bAdminCommission, price: newPrice, sellerPrice: newSPrice, b2bPrice: newB2b, sellerB2bPrice: newSB2b } = req.body;
      
      const sPrice = newSPrice || product.sellerPrice || product.price;
      const commission = adminCommission !== undefined ? adminCommission : product.adminCommission;
      
      // If adminCommission was updated, recalculate price
      if (adminCommission !== undefined || newSPrice || newPrice) {
        req.body.price = Math.round(sPrice * (1 + (commission || 0) / 100));
        req.body.sellerPrice = sPrice;
      }

      const sbPrice = newSB2b || product.sellerB2bPrice || product.b2bPrice;
      const bComm = b2bAdminCommission !== undefined ? b2bAdminCommission : (product.b2bAdminCommission || 0);
      
      // If b2bAdminCommission was updated, recalculate b2bPrice
      if ((b2bAdminCommission !== undefined || newSB2b || newB2b) && sbPrice) {
         req.body.b2bPrice = Math.round(sbPrice * (1 + (bComm || 0) / 100));
         req.body.sellerB2bPrice = sbPrice;
      }
    } else {
      // If seller is updating, update sellerPrice instead of final price if they try to change price
      if (req.body.price) {
        req.body.sellerPrice = req.body.price;
        // Automatically apply the product's existing commission rate.
        // No additional approval is required for commission recalculation.
        req.body.price = Math.round(req.body.price * (1 + (product.adminCommission || 0) / 100));
      }
      if (req.body.b2bPrice) {
        req.body.sellerB2bPrice = req.body.b2bPrice;
        req.body.b2bPrice = Math.round(req.body.b2bPrice * (1 + (product.b2bAdminCommission || 0) / 100));
      }
      // Sellers shouldn't touch commission
      delete req.body.adminCommission;
      delete req.body.b2bAdminCommission;
      
      // Ensure product stays approved if it was already approved
      delete req.body.approvalStatus;
      delete req.body.isApproved;
    }

    // Resolve Category, Subcategory, Subsubcategory from Strings to ObjectIds
    if (req.body.category && typeof req.body.category === 'string') {
      const mongoose = require('mongoose');
      const Category = require('../models/Category');
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        const foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${req.body.category.trim()}$`, 'i') } });
        if (foundCat) {
          req.body.category = foundCat._id;
          
          if (req.body.subcategory && typeof req.body.subcategory === 'string') {
            if (!mongoose.Types.ObjectId.isValid(req.body.subcategory)) {
              const subRegex = new RegExp(`^${req.body.subcategory.trim()}$`, 'i');
              const subObj = foundCat.subcategories.find(s => subRegex.test(s.name));
              if (subObj) {
                req.body.subcategory = subObj._id;
                
                if (req.body.subsubcategory && typeof req.body.subsubcategory === 'string') {
                  if (!mongoose.Types.ObjectId.isValid(req.body.subsubcategory)) {
                    const subsubRegex = new RegExp(`^${req.body.subsubcategory.trim()}$`, 'i');
                    if (subObj.subsubcategories) {
                      const subsubObj = subObj.subsubcategories.find(ss => subsubRegex.test(ss.name));
                      if (subsubObj) {
                        req.body.subsubcategory = subsubObj._id;
                      } else delete req.body.subsubcategory;
                    } else delete req.body.subsubcategory;
                  }
                }
              } else delete req.body.subcategory;
            }
          }
        } else {
          delete req.body.category;
        }
      }
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

      let catId = p.category;
      let subcatId = p.subcategory;
      let subsubId = p.subsubcategory;

      if (p.category && typeof p.category === 'string') {
        const mongoose = require('mongoose');
        const Category = require('../models/Category');
        if (!mongoose.Types.ObjectId.isValid(p.category)) {
          const foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${p.category.trim()}$`, 'i') } });
          if (foundCat) {
            catId = foundCat._id;
            if (p.subcategory && typeof p.subcategory === 'string' && !mongoose.Types.ObjectId.isValid(p.subcategory)) {
              const subRegex = new RegExp(`^${p.subcategory.trim()}$`, 'i');
              const subObj = foundCat.subcategories.find(s => subRegex.test(s.name));
              if (subObj) {
                subcatId = subObj._id;
                if (p.subsubcategory && typeof p.subsubcategory === 'string' && !mongoose.Types.ObjectId.isValid(p.subsubcategory)) {
                  const subsubRegex = new RegExp(`^${p.subsubcategory.trim()}$`, 'i');
                  if (subObj.subsubcategories) {
                    const subsubObj = subObj.subsubcategories.find(ss => subsubRegex.test(ss.name));
                    if (subsubObj) subsubId = subsubObj._id;
                    else subsubId = undefined;
                  } else subsubId = undefined;
                }
              } else {
                subcatId = undefined;
                subsubId = undefined;
              }
            }
          } else {
            catId = undefined;
          }
        }
      }

      return {
        ...p,
        category: catId,
        subcategory: subcatId,
        subsubcategory: subsubId,
        brand: brandId,
        seller,
        sellerType,
        isApproved,
        approvalStatus,
        sellerPrice: p.price,
        sellerB2bPrice: p.b2bPrice,
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

// @desc    Generate HSN code using AI
// @route   POST /api/products/generate-hsn
// @access  Private/Admin or Seller
exports.generateHSNCodeHandler = async (req, res, next) => {
  try {
    const { category, subcategory, subsubcategory, name, description } = req.body;
    const aiService = require('../services/aiService');
    const hsnCode = await aiService.generateHSNCode(
      category, 
      subcategory, 
      subsubcategory, 
      name, 
      description
    );

    if (hsnCode) {
      res.status(200).json({ success: true, hsnCode });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate HSN code' });
    }
  } catch (error) {
    console.error('HSN Code Generation Error:', error);
    res.status(500).json({ success: false, error: 'AI Service Error: ' + error.message });
  }
};

// @desc    Generate Product description, sku, hsn, keywords using AI
// @route   POST /api/products/generate-content
// @access  Private/Admin or Seller
exports.generateProductContentHandler = async (req, res, next) => {
  try {
    const { name, category, subcategory, subsubcategory, brand, material, color, dimensions, thickness, sku, generateImage } = req.body;
    const generateImageBool = generateImage === true || generateImage === 'true';
    console.log("POST /api/products/generate-content body:", req.body, "parsed generateImage:", generateImageBool);
    const aiService = require('../services/aiService');
    const content = await aiService.generateProductContent(
      name,
      category,
      subcategory,
      subsubcategory,
      brand,
      material,
      color,
      dimensions,
      thickness,
      sku,
      generateImageBool
    );

    if (content) {
      res.status(200).json({ success: true, ...content });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate product content' });
    }
  } catch (error) {
    console.error('Product Content Generation Error:', error);
    res.status(500).json({ success: false, error: 'AI Service Error: ' + error.message });
  }
};
