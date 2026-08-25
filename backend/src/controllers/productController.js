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

    // Exclude auto-generated bundle "virtual" products from normal catalog
    // browsing/search — they're surfaced through the dedicated /api/bundles endpoints.
    if (req.query.includeBundles !== 'true') {
      filter.isBundle = { $ne: true };
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

    // 7. Offer Type Filter (Deals & Discounts)
    if (req.query.offerType && req.query.offerType !== 'all') {
      const Offer = require('../models/Offer');
      const now = new Date();
      const offerQuery = { isActive: true, approvalStatus: 'approved', startDate: { $lte: now }, endDate: { $gte: now } };
      if (req.query.offerType !== 'any') {
        offerQuery.type = req.query.offerType;
      }
      const offerProductIds = await Offer.find(offerQuery).distinct('products');
      filter._id = { $in: offerProductIds };
    }

    // 8. Paginate results
    const populateOptions = [
      { path: 'seller', select: 'fullName shopName' },
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' }
    ];

    console.log("FILTER BUILT FOR PRODUCTS QUERY:", JSON.stringify(filter, null, 2));
    const result = await paginate(Product, filter, req, populateOptions);

    // Attach offer pricing to products
    if (result.data && result.data.length > 0) {
      await attachOfferPricing(result.data);
    }

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

// In-memory cache for parsed smart-search queries (normalized query -> parsed filters)
const smartSearchCache = new Map();
const SMART_SEARCH_CACHE_LIMIT = 300;

function keywordFieldClause(term) {
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { name: regex },
      { description: regex },
      { 'specifications.material': regex },
      { 'specifications.colour': regex },
      { 'specifications.finish': regex },
      { 'specifications.pattern': regex }
    ]
  };
}

function humanizeSmartSearchValue(value) {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildSmartSearchChips(parsed) {
  const chips = [];
  if (parsed.projectApplication) chips.push({ key: 'projectApplication', label: humanizeSmartSearchValue(parsed.projectApplication), value: parsed.projectApplication });
  if (parsed.grade) chips.push({ key: 'grade', label: humanizeSmartSearchValue(parsed.grade), value: parsed.grade });
  if (parsed.stock) chips.push({ key: 'stock', label: humanizeSmartSearchValue(parsed.stock), value: parsed.stock });
  if (parsed.region) chips.push({ key: 'region', label: humanizeSmartSearchValue(parsed.region), value: parsed.region });
  if (parsed.minRating) chips.push({ key: 'minRating', label: `${parsed.minRating}+ Stars`, value: parsed.minRating });
  if (parsed.maxPrice) chips.push({ key: 'maxPrice', label: `Under ₹${Number(parsed.maxPrice).toLocaleString('en-IN')}`, value: parsed.maxPrice });
  if (parsed.minPrice) chips.push({ key: 'minPrice', label: `Above ₹${Number(parsed.minPrice).toLocaleString('en-IN')}`, value: parsed.minPrice });
  if (parsed.antiSlip) chips.push({ key: 'antiSlip', label: 'Anti-Skid', value: true });
  if (parsed.waterproof) chips.push({ key: 'waterproof', label: 'Waterproof', value: true });
  if (parsed.fireProof) chips.push({ key: 'fireProof', label: 'Fire-Resistant', value: true });
  if (parsed.ecoFriendly) chips.push({ key: 'ecoFriendly', label: 'Eco-Friendly', value: true });
  (parsed.keywords || []).forEach((kw) => {
    const term = String(kw || '').trim();
    if (term) chips.push({ key: `keyword:${term}`, label: humanizeSmartSearchValue(term), value: term });
  });
  return chips;
}

function buildSmartSearchInterpretation(parsed) {
  const parts = [];
  if (parsed.keywords?.length) parts.push(parsed.keywords.slice(0, 4).map(humanizeSmartSearchValue).join(', '));
  if (parsed.projectApplication) parts.push(humanizeSmartSearchValue(parsed.projectApplication));
  if (parsed.maxPrice) parts.push(`Under ₹${Number(parsed.maxPrice).toLocaleString('en-IN')}`);
  else if (parsed.minPrice) parts.push(`Above ₹${Number(parsed.minPrice).toLocaleString('en-IN')}`);
  if (parsed.minRating) parts.push(`${parsed.minRating}+ Stars`);
  if (parsed.region) parts.push(humanizeSmartSearchValue(parsed.region));
  return parts.join(' · ');
}

// @desc    Natural-language product search. Parses a free-text query (e.g.
//          "white marble for luxury reception under Rs 250/sq.ft") into
//          structured filters via OpenAI. Pass `filters` (a previously
//          returned parsedFilters object, JSON-encoded) instead of `search`
//          to re-run with an adjusted filter set (chip removal) without
//          re-invoking OpenAI.
// @route   GET /api/products/smart-search
// @access  Public
exports.smartSearch = async (req, res, next) => {
  try {
    const searchService = require('../services/searchService');
    const filterService = require('../services/filterService');

    const rawQuery = (req.query.search || '').trim();
    let parsedFilters = null;
    let usedAi = false;
    let fuzzyFallback = false;

    if (req.query.filters) {
      try {
        parsedFilters = JSON.parse(req.query.filters);
      } catch (e) {
        parsedFilters = null;
      }
    }

    if (!parsedFilters && rawQuery) {
      const cacheKey = rawQuery.toLowerCase();
      if (smartSearchCache.has(cacheKey)) {
        parsedFilters = smartSearchCache.get(cacheKey);
        usedAi = true;
      } else if (process.env.OPENAI_API_KEY) {
        try {
          const openaiClient = require('../services/openaiService');
          const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
          const OpenAIUsageTracker = require('../services/openaiUsageTracker');

          const filterOptions = await filterService.getFilterOptions();
          const projectApplications = filterOptions.projectApplication.options.map(o => o.value);
          const grades = filterOptions.grade.options.map(o => o.value);
          const stockStatuses = filterOptions.availability.options.map(o => o.value);
          const regions = filterOptions.region.options.map(o => o.value);

          const systemPrompt = `You are a search-query parser for "Riddha Interior Mart", an e-commerce platform selling marble, tiles, furniture, lighting, sanitaryware, and building materials. Convert the shopper's free-text search into strict JSON describing what they want. Only use these exact enum values where applicable — never invent new ones:
- projectApplication: one of ${JSON.stringify(projectApplications)} or null
- grade: one of ${JSON.stringify(grades)} or null
- stock: one of ${JSON.stringify(stockStatuses)} or null (only set if the shopper explicitly asks about availability, e.g. "in stock", "ready to ship")
- region: one of ${JSON.stringify(regions)} or null (only set if a place name is mentioned)

Return exactly this JSON shape:
{
  "minPrice": number|null,
  "maxPrice": number|null,
  "minRating": number|null,
  "projectApplication": string|null,
  "grade": string|null,
  "stock": string|null,
  "region": string|null,
  "antiSlip": boolean,
  "waterproof": boolean,
  "fireProof": boolean,
  "ecoFriendly": boolean,
  "keywords": string[]
}
Rules:
- "keywords" holds every remaining descriptive term (product type, material, colour, finish, size/dimensions, pattern, style) lowercased, e.g. "white marble 600x600" -> ["marble","white","600x600"]. Never drop the shopper's core product intent from keywords.
- Prices are in Indian Rupees. "under X"/"below X" -> maxPrice. "above X"/"over X" -> minPrice. Ignore unit suffixes like "/sq.ft", just use the number.
- Only set antiSlip/waterproof/fireProof/ecoFriendly to true when the text implies it (e.g. "anti-skid"/"non-slip" -> antiSlip, "waterproof"/"water resistant" -> waterproof, "fireproof"/"fire rated" -> fireProof, "eco-friendly"/"sustainable" -> ecoFriendly). Otherwise false.
- Respond with ONLY the JSON object, no other text.`;

          const result = await OpenAIErrorHandler.callWithRetry(
            () => openaiClient.generateText(rawQuery, {
              systemPrompt,
              modelType: 'general',
              expectJson: true,
              temperature: 0.2,
              maxTokens: 400
            }),
            2
          );

          OpenAIUsageTracker.trackUsage(result, 'smart-search', req.user ? req.user.id : null, '/api/products/smart-search', result.model);

          parsedFilters = JSON.parse(result.text.replace(/```json|```/g, '').trim());
          usedAi = true;

          if (smartSearchCache.size >= SMART_SEARCH_CACHE_LIMIT) {
            smartSearchCache.delete(smartSearchCache.keys().next().value);
          }
          smartSearchCache.set(cacheKey, parsedFilters);
        } catch (aiErr) {
          console.error('[Smart Search] OpenAI parse failed, falling back to fuzzy search:', aiErr.message);
          parsedFilters = null;
        }
      }
    }

    if (rawQuery) {
      searchService.logSearch(req.user ? req.user.id : null, rawQuery);
    }

    // Base visibility filter — mirrors getProducts' default (non-admin) protections
    const filter = { isActive: true, isApproved: true, isBundle: { $ne: true } };
    const unverifiedSellers = await Seller.find({ isVerified: { $ne: true } }).select('_id');
    const unverifiedIdSet = new Set(unverifiedSellers.map(s => String(s._id)));
    filter.seller = { $nin: unverifiedSellers.map(s => s._id) };

    let keywordTerms = [];

    if (parsedFilters) {
      Object.assign(filter, filterService.buildFilterQuery({
        minPrice: parsedFilters.minPrice,
        maxPrice: parsedFilters.maxPrice,
        minRating: parsedFilters.minRating,
        grade: parsedFilters.grade,
        stock: parsedFilters.stock,
        projectApplication: parsedFilters.projectApplication,
        ecoFriendly: parsedFilters.ecoFriendly,
        waterproof: parsedFilters.waterproof
      }));
      // buildFilterQuery re-asserts isActive/isApproved but knows nothing about
      // seller verification — restore our exclusion after merging its output.
      filter.seller = { $nin: unverifiedSellers.map(s => s._id) };

      if (parsedFilters.antiSlip) filter['specifications.antiSlip'] = true;
      if (parsedFilters.fireProof) filter['specifications.fireProof'] = true;

      if (parsedFilters.region) {
        const sellerIds = await filterService.resolveSellerIds({ region: parsedFilters.region });
        if (sellerIds) {
          filter.seller = { $in: sellerIds.filter(id => !unverifiedIdSet.has(String(id))) };
        }
      }

      keywordTerms = (parsedFilters.keywords || []).map(kw => String(kw).trim()).filter(Boolean);
      if (keywordTerms.length > 0) {
        // AND the keywords together (each must match *somewhere*, any field) —
        // OR-ing every keyword/field pair together let a single generic word
        // like "marble" pull in results that ignored a more specific term like
        // "italian" entirely. If this strict match comes back empty, retry once
        // with the old loose OR behavior below so a real term isn't a dead end.
        filter.$and = keywordTerms.map(term => keywordFieldClause(term));
      }
    } else if (rawQuery) {
      // No AI available / parse failed — plain fuzzy fallback (same approach as getProducts)
      fuzzyFallback = true;
      const fuzzyPatterns = searchService.getFuzzyRegex(rawQuery);
      filter.$or = [
        { name: { $all: fuzzyPatterns } },
        { description: { $all: fuzzyPatterns } }
      ];
    }

    const populateOptions = [
      { path: 'seller', select: 'fullName shopName' },
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' }
    ];

    let result = await paginate(Product, filter, req, populateOptions);
    let relaxedMatch = false;

    // Strict AND-of-keywords came back empty — relax to the old OR-across-everything
    // behavior once, rather than leaving a real search term as a dead end.
    if (result.totalResults === 0 && keywordTerms.length > 1) {
      const relaxedFilter = { ...filter };
      delete relaxedFilter.$and;
      relaxedFilter.$or = keywordTerms.flatMap(term => keywordFieldClause(term).$or);
      result = await paginate(Product, relaxedFilter, req, populateOptions);
      relaxedMatch = result.totalResults > 0;
    }

    if (result.data && result.data.length > 0) {
      await attachOfferPricing(result.data);
    }

    const formattedData = result.data.map(p => {
      const pObj = p.toObject ? p.toObject() : { ...p };
      if (pObj.category && typeof pObj.category === 'object') {
        pObj.categoryId = pObj.category._id;
        pObj.category = pObj.category.name;
      }
      return pObj;
    });

    res.status(200).json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      usedAi,
      fuzzyFallback,
      relaxedMatch,
      parsedFilters,
      chips: parsedFilters ? buildSmartSearchChips(parsedFilters) : [],
      interpretation: parsedFilters ? buildSmartSearchInterpretation(parsedFilters) : ''
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

    // Attach offer pricing
    await attachOfferPricing(product);

    res.status(200).json({ success: true, cached, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for the logged in seller
exports.getSellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
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

// Helper function to attach offer pricing to products
async function attachOfferPricing(products) {
  try {
    const Offer = require('../models/Offer');
    const { pickBestOffer } = require('../utils/offerPricing');

    const list = Array.isArray(products) ? products : [products];
    const ids = list.map(p => p._id);
    const now = new Date();

    const offers = await Offer.find({
      products: { $in: ids },
      isActive: true,
      approvalStatus: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean();

    for (const product of list) {
      const applicable = offers.filter(o =>
        o.products.some(id => id.toString() === product._id.toString())
      );

      if (!applicable.length) continue;

      const best = pickBestOffer(product.price, applicable);
      if (best && best.price < (product.discountPrice || product.price)) {
        product.discountPrice = Math.round(best.price);
        product.appliedOffer = {
          id: best.offer._id,
          type: best.offer.type,
          title: best.offer.title
        };
      }
    }
  } catch (err) {
    console.error('Error attaching offer pricing:', err);
  }
  return products;
}

// @desc    Generate Product description, sku, hsn, keywords using AI
// @route   POST /api/products/generate-content
// @access  Private/Admin or Seller
exports.generateProductContentHandler = async (req, res, next) => {
  try {
    const { name, category, subcategory, subsubcategory, brand, material, color, dimensions, thickness, sku, generateImage, customPrompt, imageCount } = req.body;
    // Image generation is admin-only: sellers can still generate description/SKU/HSN/SEO
    // content, but any requested image generation is ignored server-side for non-admins,
    // regardless of what the client sends.
    const isAdmin = (req.user?.role || '').toLowerCase() === 'admin';
    const generateImageBool = isAdmin && (generateImage === true || generateImage === 'true');
    const parsedImageCount = parseInt(imageCount, 10);
    const resolvedImageCount = generateImageBool && Number.isFinite(parsedImageCount)
      ? Math.min(Math.max(parsedImageCount, 1), 10)
      : null;
    console.log("POST /api/products/generate-content body:", req.body, "parsed generateImage:", generateImageBool, "imageCount:", resolvedImageCount);
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
      generateImageBool,
      customPrompt,
      resolvedImageCount
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

// @desc    Get available filter options for the UI
// @route   GET /api/products/filters/options
// @access  Public
exports.getFilterOptions = async (req, res, next) => {
  try {
    const filterService = require('../services/filterService');
    const options = await filterService.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('[Filter Options Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get products with advanced filtering (location, specs, delivery, etc.)
// @route   GET /api/products/filters/search
// @access  Public
exports.getProductsWithFilters = async (req, res, next) => {
  try {
    const filterService = require('../services/filterService');
    const cacheService = require('../services/cacheService');
    const paginate = require('../utils/paginate');

    // Build cache key from all filter parameters
    const cacheKey = `products:filters:${JSON.stringify(req.query)}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    // Parse user location from query
    let userLocation = null;
    if (req.query.userLat && req.query.userLon) {
      userLocation = [Number(req.query.userLon), Number(req.query.userLat)];
    }

    // Build base product filter (price, stock, specs, delivery, payment — all Product-level)
    const productFilter = filterService.buildFilterQuery(req.query);

    // Resolve seller-side (verification/region/distance) and offer-type restrictions
    // against their full collections — NOT scoped to any one page — then fold the
    // resulting id lists into the main query. Doing this before paginate() runs means
    // totalResults/totalPages reflect the true filtered count, and no matching product
    // is silently dropped just because it fell outside the first page's unfiltered slice.
    const sellerIds = await filterService.resolveSellerIds({
      verifiedOnly: req.query.verifiedOnly,
      verificationStatus: req.query.verificationStatus,
      region: req.query.region,
      distance: req.query.distance,
      userCoordinates: userLocation
    });
    if (sellerIds) {
      productFilter.seller = { $in: sellerIds };
    }

    const offerProductIds = await filterService.resolveOfferProductIds(req.query.offerType);
    if (offerProductIds) {
      productFilter._id = { $in: offerProductIds };
    }

    // Get paginated products
    const populateOptions = [
      { path: 'seller', select: 'fullName shopName location region verificationStatus deliveryCapabilities' },
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' }
    ];

    let result = await paginate(Product, productFilter, req, populateOptions);

    // Attach offer pricing
    if (result.data && result.data.length > 0) {
      await attachOfferPricing(result.data);
    }

    // Format response
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
      data: formattedData
    };

    // Cache results
    cacheService.set(cacheKey, outputPayload, 300);

    res.status(200).json({
      success: true,
      cached: false,
      ...outputPayload
    });
  } catch (error) {
    console.error('[Products with Filters Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
