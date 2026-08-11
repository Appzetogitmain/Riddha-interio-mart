const Product = require('../models/Product');
const Category = require('../models/Category');

const CARD_FIELDS = 'name price discountPrice images category subcategory brand tags roomType material averageRating totalReviews countInStock';

// Keyword groups used to find complementary categories for cross-sell, since this
// catalog (marble/tiles/furniture/fixtures/lighting) doesn't carry a manually curated
// compatibility matrix. Matching is heuristic — pairs "what a shopper searches for"
// with "what usually gets bought alongside it".
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

const formatRecommendation = (doc, reason, score) => {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    id: p._id,
    name: p.name,
    price: p.price,
    discountPrice: p.discountPrice || null,
    image: p.images?.[0] || null,
    category: p.category?.name || p.category,
    reason,
    score: round(Math.min(1, Math.max(0, score)))
  };
};

const tagOverlapScore = (a = [], b = []) => {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((t) => String(t).toLowerCase()));
  const overlap = a.filter((t) => setB.has(String(t).toLowerCase())).length;
  return overlap / Math.max(a.length, b.length);
};

const priceProximityScore = (basePrice, price) => {
  if (!basePrice) return 0;
  const diff = Math.abs(price - basePrice) / basePrice;
  return Math.max(0, 1 - diff);
};

async function getSimilarProducts(product, limit = 6) {
  const filter = {
    _id: { $ne: product._id },
    category: product.category,
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
    const score = 0.5 + (subMatch ? 0.25 : 0) + tagOverlapScore(product.tags, c.tags) * 0.15 + priceProximityScore(product.price, c.price) * 0.1;
    return formatRecommendation(c, subMatch ? 'Similar item, same style' : `More in ${c.category?.name || 'this category'}`, score);
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

  return candidates.map((c) => formatRecommendation(c, 'Pairs well with your selection', 0.82));
}

async function getUpsellProducts(product, limit = 3) {
  const candidates = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
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
    return formatRecommendation(c, 'Premium option in the same category', score);
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
  getSimilarProducts,
  getCrossSellProducts,
  getUpsellProducts,
  getBlendedProducts,
  baseVisibilityFilter,
  CARD_FIELDS
};
