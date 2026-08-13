const Product = require('../models/Product');
const Category = require('../models/Category');
const UserProfile = require('../models/UserProfile');
const ProductAffinity = require('../models/ProductAffinity');
const UserQuizResult = require('../models/UserQuizResult');

const CARD_FIELDS = 'name price discountPrice images category subcategory brand tags roomType style color material averageRating totalReviews countInStock createdAt';

const COMPLEMENT_GROUPS = [
  { match: ['marble', 'tile', 'granite', 'flooring', 'stone', 'vitrified', 'slate', 'terracotta', 'mosaic', 'travertine'], complements: ['rug', 'carpet', 'wall panel', 'skirting', 'border', 'highlighter'] },
  { match: ['bed', 'wardrobe', 'mattress'], complements: ['lamp', 'rug', 'curtain', 'light'] },
  { match: ['sofa', 'chair', 'desk', 'table', 'office'], complements: ['rug', 'lamp', 'light', 'panel'] },
  { match: ['faucet', 'tap', 'sanitary', 'basin', 'shower'], complements: ['tile', 'marble', 'granite', 'mirror'] },
  { match: ['led', 'light', 'lamp', 'lighting', 'panel'], complements: ['tile', 'furniture', 'desk', 'wall panel'] },
  { match: ['rug', 'carpet'], complements: ['sofa', 'flooring', 'tile'] }
];

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const baseVisibilityFilter = () => ({ isActive: true, isApproved: true, countInStock: { $gt: 0 }, isBundle: { $ne: true } });
const round = (n) => Math.round(n * 100) / 100;

const formatRecommendation = (doc, reason, score, type = 'personalized') => {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    id: p._id,
    _id: p._id,
    name: p.name,
    price: p.price,
    discountPrice: p.discountPrice || null,
    image: p.images?.[0] || null,
    images: p.images || [],
    category: p.category?.name || p.category,
    style: p.style || 'Modern',
    color: p.color || '',
    material: p.material || '',
    averageRating: p.averageRating || 4.5,
    totalReviews: p.totalReviews || 0,
    reason: reason || 'Recommended for you',
    score: round(Math.min(1, Math.max(0, score || 0.8))),
    type
  };
};

/**
 * 1. Style Similarity (0 - 1)
 */
function getStyleSimilarity(productStyle, userStyles = []) {
  if (!productStyle || !userStyles.length) return 0.5;
  const pStyle = String(productStyle).toLowerCase();
  const match = userStyles.some(s => pStyle.includes(String(s).toLowerCase()));
  return match ? 1.0 : 0.2;
}

/**
 * 2. Budget Similarity (0 - 1)
 */
function getBudgetSimilarity(price, budget = {}) {
  if (!price) return 0.5;
  const min = budget.min || 0;
  const max = budget.max || 500000;
  if (price >= min && price <= max) return 1.0;
  if (price < min) return 0.7; // cheaper than budget
  const diffRatio = (price - max) / max;
  return Math.max(0.1, 1.0 - diffRatio);
}

/**
 * 3. Category Similarity (0 - 1)
 */
function getCategorySimilarity(productCategory, viewedCategories = []) {
  if (!productCategory || !viewedCategories.length) return 0.5;
  const catName = (productCategory.name || productCategory.title || String(productCategory)).toLowerCase();
  const match = viewedCategories.some(c => catName.includes(String(c).toLowerCase()));
  return match ? 1.0 : 0.3;
}

/**
 * 4. Color Similarity (0 - 1)
 */
function getColorSimilarity(productColor, preferredColors = []) {
  if (!productColor || !preferredColors.length) return 0.5;
  const pColor = String(productColor).toLowerCase();
  const match = preferredColors.some(c => pColor.includes(String(c).toLowerCase()));
  return match ? 1.0 : 0.2;
}

/**
 * 5. Material Similarity (0 - 1)
 */
function getMaterialSimilarity(productMaterial, preferredMaterials = []) {
  if (!productMaterial || !preferredMaterials.length) return 0.5;
  const pMat = String(productMaterial).toLowerCase();
  const match = preferredMaterials.some(m => pMat.includes(String(m).toLowerCase()));
  return match ? 1.0 : 0.2;
}

/**
 * Freshness Score based on createdAt date
 */
function calculateFreshness(createdAt) {
  if (!createdAt) return 0.5;
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 1.0;
  if (ageDays <= 30) return 0.8;
  if (ageDays <= 90) return 0.5;
  return 0.3;
}

/**
 * Collaborative Score = (0.3 × Style Match) + (0.2 × Budget Match) + (0.2 × Category Match) + (0.15 × Color Match) + (0.15 × Material Match)
 */
function calculateCollaborativeScore(product, userProfile) {
  if (!userProfile) return 0.5;

  const styleMatch = getStyleSimilarity(product.style, userProfile.stylePreferences);
  const budgetMatch = getBudgetSimilarity(product.price, userProfile.budgetRange);
  const categoryMatch = getCategorySimilarity(product.category, userProfile.behaviorData?.browsedCategories);
  const colorMatch = getColorSimilarity(product.color, userProfile.colorPreferences);
  const materialMatch = getMaterialSimilarity(product.material, userProfile.materialPreferences);

  return (0.3 * styleMatch) + (0.2 * budgetMatch) + (0.2 * categoryMatch) + (0.15 * colorMatch) + (0.15 * materialMatch);
}

/**
 * Content-Based Score
 */
function calculateContentScore(product, userProfile) {
  if (!userProfile) return 0.5;

  const ratingScore = (product.averageRating || 4.0) / 5;
  const freshnessScore = calculateFreshness(product.createdAt);
  
  let quizMatch = 0.5;
  if (userProfile.designProfile?.roomType) {
    if (product.roomType && product.roomType.toLowerCase() === userProfile.designProfile.roomType.toLowerCase()) {
      quizMatch = 1.0;
    }
  }

  let wishlistBoost = 0;
  if (userProfile.behaviorData?.wishlistProductIds?.some(id => String(id) === String(product._id))) {
    wishlistBoost = 0.2;
  }

  return (0.4 * quizMatch) + (0.3 * ratingScore) + (0.2 * freshnessScore) + (0.1 * wishlistBoost);
}

/**
 * Hybrid Final Score = 0.5 * Collaborative + 0.5 * Content
 */
function calculateProductScore(product, userProfile) {
  const collab = calculateCollaborativeScore(product, userProfile);
  const content = calculateContentScore(product, userProfile);
  const hybridScore = (0.5 * collab) + (0.5 * content);
  return round(Math.min(0.99, Math.max(0.1, hybridScore)));
}

/**
 * Get Personalized Recommendations for User
 */
async function getPersonalizedForUser(userId, limit = 10, type = 'all') {
  let profile = null;
  if (userId) {
    profile = await UserProfile.findOne({ userId }).lean();
    if (!profile) {
      const quizRes = await UserQuizResult.findOne({ userId }).sort({ createdAt: -1 }).lean();
      if (quizRes?.designProfile) {
        profile = {
          stylePreferences: [quizRes.designProfile.primaryStyle],
          colorPreferences: quizRes.designProfile.colors || [],
          materialPreferences: quizRes.designProfile.materials || [],
          budgetRange: quizRes.designProfile.budget || { min: 0, max: 200000 },
          designProfile: quizRes.designProfile,
          behaviorData: { browsedCategories: [], wishlistProductIds: [] }
        };
      }
    }
  }

  const products = await Product.find(baseVisibilityFilter())
    .select(CARD_FIELDS)
    .populate('category', 'name')
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(50)
    .lean();

  const scored = products.map(p => {
    const score = profile ? calculateProductScore(p, profile) : (p.averageRating / 5);
    let reason = 'Popular top-rated item';
    if (profile?.stylePreferences?.length) {
      reason = `Matches your ${profile.stylePreferences[0]} style preference`;
    } else if (p.style) {
      reason = `Trending in ${p.style} design`;
    }
    return formatRecommendation(p, reason, score, type === 'all' ? 'personalized' : type);
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Get Trending Products
 */
async function getTrendingProducts(limit = 10, style = null, priceRange = null) {
  const query = { ...baseVisibilityFilter() };
  if (style) {
    query.style = new RegExp(escapeRegex(style), 'i');
  }
  if (priceRange === 'budget') {
    query.price = { $lte: 50000 };
  } else if (priceRange === 'mid') {
    query.price = { $gte: 50000, $lte: 150000 };
  } else if (priceRange === 'premium') {
    query.price = { $gte: 150000 };
  }

  const products = await Product.find(query)
    .select(CARD_FIELDS)
    .populate('category', 'name')
    .sort({ totalReviews: -1, averageRating: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return products.map(p => formatRecommendation(p, 'Trending popular pick this week', 0.88, 'trending'));
}

/**
 * Track user behavior & update profile + product affinities in real time
 */
async function trackUserBehavior(userId, productId, action = 'view', details = {}) {
  if (!productId) return;

  // 1. Update ProductAffinity counters
  try {
    const updateInc = {};
    if (action === 'view') updateInc.viewCount = 1;
    if (action === 'wishlist') updateInc.wishlistCount = 1;
    if (action === 'purchase') updateInc.purchaseCount = 1;

    await ProductAffinity.findOneAndUpdate(
      { productId },
      { $inc: updateInc, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[AFFINITY TRACK ERROR]', err.message);
  }

  // 2. Update UserProfile behaviorData
  if (userId) {
    try {
      let userProf = await UserProfile.findOne({ userId });
      if (!userProf) {
        userProf = new UserProfile({ userId, behaviorData: { browsedProductIds: [], browsedCategories: [] } });
      }

      if (action === 'view') {
        if (!userProf.behaviorData.browsedProductIds.includes(productId)) {
          userProf.behaviorData.browsedProductIds.push(productId);
        }
      } else if (action === 'wishlist') {
        if (!userProf.behaviorData.wishlistProductIds.includes(productId)) {
          userProf.behaviorData.wishlistProductIds.push(productId);
        }
      } else if (action === 'purchase') {
        if (!userProf.behaviorData.purchaseHistory.includes(productId)) {
          userProf.behaviorData.purchaseHistory.push(productId);
        }
      } else if (action === 'search' && details.query) {
        userProf.behaviorData.searchHistory.push({
          query: details.query,
          resultCount: details.resultCount || 0,
          timestamp: new Date()
        });
      }

      userProf.lastActiveAt = new Date();
      await userProf.save();
    } catch (err) {
      console.error('[USER PROFILE TRACK ERROR]', err.message);
    }
  }
}

async function getSimilarProducts(product, limit = 6) {
  const filter = {
    _id: { $ne: product._id },
    category: product.category?._id || product.category,
    price: { $gte: product.price * 0.5, $lte: product.price * 1.5 },
    ...baseVisibilityFilter()
  };

  let candidates = [];
  if (product.subcategory) {
    candidates = await Product.find({ ...filter, subcategory: product.subcategory })
      .select(CARD_FIELDS)
      .populate('category', 'name')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit)
      .lean();
  }

  if (candidates.length < limit) {
    const excludeIds = candidates.map((c) => c._id);
    const more = await Product.find({ ...filter, _id: { $ne: product._id, $nin: excludeIds } })
      .select(CARD_FIELDS)
      .populate('category', 'name')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit - candidates.length)
      .lean();
    candidates = candidates.concat(more);
  }

  return candidates.map((c) => {
    const subMatch = product.subcategory && c.subcategory && String(c.subcategory) === String(product.subcategory);
    return formatRecommendation(c, subMatch ? 'Similar item, same subcategory' : `More in ${c.category?.name || 'this category'}`, 0.85, 'similar');
  });
}

async function getCrossSellProducts(product, limit = 4) {
  const categoryName = (product.category?.name || '').toLowerCase();
  const productText = `${categoryName} ${(product.tags || []).join(' ')}`.toLowerCase();

  const group = COMPLEMENT_GROUPS.find((g) => g.match.some((kw) => productText.includes(kw)));
  if (!group) return [];

  const regex = new RegExp(group.complements.map(escapeRegex).join('|'), 'i');
  const matchingCategories = await Category.find({ name: regex }).select('_id name').lean();
  const categoryIds = matchingCategories.map((c) => c._id).filter((id) => String(id) !== String(product.category?._id || product.category));

  if (categoryIds.length === 0) return [];

  const candidates = await Product.find({
    category: { $in: categoryIds },
    ...baseVisibilityFilter()
  })
    .select(CARD_FIELDS)
    .populate('category', 'name')
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit)
    .lean();

  return candidates.map((c) => formatRecommendation(c, 'Pairs well with your selection', 0.82, 'cross-sell'));
}

async function getUpsellProducts(product, limit = 3) {
  const candidates = await Product.find({
    _id: { $ne: product._id },
    category: product.category?._id || product.category,
    price: { $gt: product.price, $lte: product.price * 1.6 },
    ...baseVisibilityFilter()
  })
    .select(CARD_FIELDS)
    .populate('category', 'name')
    .sort({ price: 1 })
    .limit(limit)
    .lean();

  return candidates.map((c) => {
    const gapRatio = (c.price - product.price) / product.price;
    const score = 0.9 - Math.min(0.5, gapRatio);
    return formatRecommendation(c, 'Premium option in the same category', score, 'upsell');
  });
}

async function getBlendedProducts(product, limit = 6) {
  const similarCount = Math.ceil(limit * 0.6);
  const crossSellCount = limit - similarCount;

  const [similar, crossSell] = await Promise.all([
    getSimilarProducts(product, similarCount),
    getCrossSellProducts(product, crossSellCount)
  ]);

  const seen = new Set();
  const blended = [];
  for (const item of [...similar, ...crossSell]) {
    const key = String(item.id);
    if (seen.has(key)) continue;
    seen.add(key);
    blended.push(item);
    if (blended.length >= limit) break;
  }
  return blended;
}

module.exports = {
  calculateProductScore,
  calculateCollaborativeScore,
  calculateContentScore,
  getPersonalizedForUser,
  getTrendingProducts,
  trackUserBehavior,
  getSimilarProducts,
  getCrossSellProducts,
  getUpsellProducts,
  getBlendedProducts,
  baseVisibilityFilter,
  CARD_FIELDS
};
