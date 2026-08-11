const crypto = require('crypto');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

// In-memory cache for AI image analysis results (hash -> analysis result)
// Limited to 500 items to manage memory footprint
const aiAnalysisCache = new Map();
const MAX_CACHE_SIZE = 500;

const getCacheKey = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// @desc    Perform AI Image Recognition & Visual Search via Gemini 3.6 Flash
// @route   POST /api/products/ai-image-search
// @access  Public
exports.aiImageSearch = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file for AI visual search.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured in environment variables.'
      });
    }

    // 1. Calculate SHA-256 Hash of uploaded image file to detect duplicate uploads
    const imageHash = getCacheKey(req.file.buffer);
    let cachedAnalysis = aiAnalysisCache.get(imageHash);

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    let aiAnalysis = null;

    if (cachedAnalysis) {
      console.log(`[AI Image Search] Cache HIT for image hash: ${imageHash.substring(0, 12)}... (Saved Gemini API call)`);
      aiAnalysis = cachedAnalysis;
    } else {
      console.log(`[AI Image Search] Cache MISS for image hash: ${imageHash.substring(0, 12)}... Calling Gemini API.`);

    const storeCategories = [
      "Marble", "Furniture", "Flooring", "Lighting", "Wall Solutions", "OutDoor", 
      "ModularKitchen", "Hardware", "Electricals", "Bath Fitting", "False Ceiling", 
      "Paint", "Laminates & Boards", "Doors & Windows", "Air Conditioner", 
      "Security & Automation", "Adhesives & Chemicals", "Fire Alarm System"
    ];

    const promptText = `You are an expert visual AI assistant for "Riddha Interior Mart" (RIMX), an e-commerce platform specializing in home interiors, furniture, sanitaryware, tiles, building materials, and hardware.

Analyze this uploaded image and map it strictly to home interior, building materials, and decor items in our store catalog.

Available Store Categories: ${storeCategories.join(', ')}.

Provide a structured JSON output with the following fields:
1. "primaryItem": String (the product name or closest home interior product in our domain, e.g., "Modular Velvet Sofa", "Marble Floor Slab", "Golden Faucet", "Concealed Hinge").
2. "category": String (choose the single best matching category from the available Store Categories list).
3. "color": String (dominant colors, e.g., "Beige", "Emerald Green", "Gold", "Matte Black").
4. "material": String (material type, e.g., "Marble", "Wood", "Brass", "Ceramic", "Velvet").
5. "style": String (aesthetic style, e.g., "Modern", "Luxury", "Minimalist").
6. "keywords": Array of 5 to 8 search terms to query in our product database (e.g. ["marble", "sofa", "faucet", "hinge", "tile", "wood"]).
7. "shopTheLookItems": Array of objects if this is a room scene containing interior elements. Each object should have:
   - "label": String (short item name, e.g. "Sofa", "Coffee Table", "Wall Panel")
   - "query": String (search query phrase, e.g. "sofa")

Output ONLY valid JSON. No markdown codeblocks surrounding it.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('[AI Image Search] Gemini API error:', errText);
      return res.status(500).json({
        success: false,
        message: 'AI Image Analysis service error'
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    let parsedAi = {};
    try {
      parsedAi = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[AI Image Search] JSON Parse error:', parseErr);
      parsedAi = {
        primaryItem: 'Interior Product',
        category: 'Furniture',
        color: '',
        material: '',
        keywords: ['furniture', 'marble', 'hardware'],
        shopTheLookItems: []
      };
    }

    aiAnalysis = parsedAi;

    // Cache the result to save API calls on duplicate image uploads
    if (aiAnalysisCache.size >= MAX_CACHE_SIZE) {
      const firstKey = aiAnalysisCache.keys().next().value;
      aiAnalysisCache.delete(firstKey);
    }
    aiAnalysisCache.set(imageHash, aiAnalysis);
    } // End of API call / cache fetch block

    // Build database search queries based on AI keywords & tags
    const searchTerms = [
      aiAnalysis.primaryItem,
      ...(aiAnalysis.keywords || []),
      aiAnalysis.category,
      aiAnalysis.color,
      aiAnalysis.material
    ].filter(Boolean);

    // Split words to form individual keyword tokens for better matching
    const keywordTokens = [];
    searchTerms.forEach(term => {
      if (typeof term === 'string') {
        term.split(/\s+/).forEach(token => {
          if (token.length > 2 && !['and', 'the', 'for', 'with', 'metal', 'plastic'].includes(token.toLowerCase())) {
            keywordTokens.push(token);
          }
        });
      }
    });

    // Escape regex special chars
    const regexTerms = Array.from(new Set(keywordTokens)).map(term => new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

    // Find category ID if matched category name exists
    let matchedCategory = await Category.findOne({ name: { $regex: new RegExp(aiAnalysis.category, 'i') } });

    const dbQuery = {
      isActive: true,
      $or: [
        { name: { $in: regexTerms } },
        { description: { $in: regexTerms } },
        { material: { $in: regexTerms } },
        { color: { $in: regexTerms } },
        { seoKeywords: { $in: regexTerms } }
      ]
    };

    if (matchedCategory) {
      dbQuery.$or.push({ category: matchedCategory._id });
    }

    // Query DB products matching any of the regex terms or category
    let matchedProducts = await Product.find(dbQuery)
      .populate('category', 'name slug')
      .populate('brand', 'name logo slug')
      .limit(20)
      .lean();

    // If no keyword match found, filter strictly by matched category or top store products in catalog
    if (matchedProducts.length === 0 && matchedCategory) {
      matchedProducts = await Product.find({ isActive: true, category: matchedCategory._id })
        .populate('category', 'name slug')
        .populate('brand', 'name logo slug')
        .limit(10)
        .lean();
    }

    if (matchedProducts.length === 0) {
      matchedProducts = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name logo slug')
        .limit(10)
        .lean();
    }

    // Process "Shop The Look" item queries
    const shopTheLookGroups = [];
    if (aiAnalysis.shopTheLookItems && aiAnalysis.shopTheLookItems.length > 0) {
      for (const item of aiAnalysis.shopTheLookItems) {
        const itemRegex = new RegExp(item.query || item.label, 'i');
        const itemProducts = await Product.find({
          isActive: true,
          $or: [
            { name: itemRegex },
            { description: itemRegex },
            { seoKeywords: itemRegex }
          ]
        })
        .populate('category', 'name slug')
        .populate('brand', 'name logo slug')
        .limit(6)
        .lean();

        if (itemProducts.length > 0) {
          shopTheLookGroups.push({
            label: item.label,
            query: item.query,
            products: itemProducts
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      aiAnalysis: {
        primaryItem: aiAnalysis.primaryItem || 'Detected Product',
        category: aiAnalysis.category || 'Home & Hardware',
        color: aiAnalysis.color || '',
        material: aiAnalysis.material || '',
        style: aiAnalysis.style || '',
        keywords: aiAnalysis.keywords || []
      },
      similarProducts: matchedProducts,
      shopTheLookGroups
    });

  } catch (error) {
    console.error('[AI Image Search] Controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI image search.'
    });
  }
};
