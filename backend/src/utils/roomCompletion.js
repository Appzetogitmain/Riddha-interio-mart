const Product = require('../models/Product');
const Category = require('../models/Category');
const { CARD_FIELDS, baseVisibilityFilter } = require('./recommendationEngine');

// Static room -> category-group keyword map, built from the categories that actually
// exist in this catalog (marble/tiles/granite, furniture, fixtures, lighting, decor).
// There's no admin-curated "room template" collection yet, so this doubles as the
// default and is what getRoomTemplate() falls back to for any roomType.
const ROOM_TEMPLATES = {
  living: [
    { name: 'Flooring', priority: 1, keywords: ['marble', 'tile', 'granite', 'flooring', 'stone', 'vitrified', 'slate', 'terracotta'] },
    { name: 'Furniture', priority: 2, keywords: ['sofa', 'table', 'chair', 'desk', 'furniture'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light', 'lamp', 'lighting', 'panel'] },
    { name: 'Decor', priority: 4, keywords: ['rug', 'carpet', 'mosaic', 'decor', 'wall panel'] }
  ],
  bedroom: [
    { name: 'Flooring', priority: 1, keywords: ['marble', 'tile', 'wood plank', 'vitrified', 'flooring'] },
    { name: 'Furniture', priority: 2, keywords: ['bed', 'wardrobe', 'mattress', 'furniture'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light', 'lamp'] },
    { name: 'Decor', priority: 4, keywords: ['rug', 'carpet', 'curtain', 'decor'] }
  ],
  bathroom: [
    { name: 'Tiles & Flooring', priority: 1, keywords: ['tile', 'marble', 'granite', 'flooring', 'mosaic'] },
    { name: 'Fixtures & Fittings', priority: 2, keywords: ['faucet', 'tap', 'sanitary', 'basin', 'shower'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light'] }
  ],
  kitchen: [
    { name: 'Countertops & Flooring', priority: 1, keywords: ['granite', 'marble', 'tile', 'vitrified', 'countertop'] },
    { name: 'Fixtures & Fittings', priority: 2, keywords: ['faucet', 'tap', 'sanitary'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light', 'panel'] }
  ],
  office: [
    { name: 'Furniture', priority: 1, keywords: ['desk', 'chair', 'office', 'table'] },
    { name: 'Flooring', priority: 2, keywords: ['tile', 'vitrified', 'granite'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'panel', 'light'] }
  ],
  dining: [
    { name: 'Flooring', priority: 1, keywords: ['marble', 'tile', 'granite', 'flooring'] },
    { name: 'Furniture', priority: 2, keywords: ['table', 'chair', 'furniture'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light', 'lamp'] }
  ],
  outdoor: [
    { name: 'Flooring', priority: 1, keywords: ['tile', 'stone', 'slate', 'granite'] },
    { name: 'Furniture', priority: 2, keywords: ['chair', 'table', 'furniture'] },
    { name: 'Lighting', priority: 3, keywords: ['led', 'light', 'lamp'] }
  ]
};

const ROOM_TYPES = Object.keys(ROOM_TEMPLATES);
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function inferRoomType(product) {
  if (product.roomType && ROOM_TEMPLATES[product.roomType]) return product.roomType;

  const text = `${product.category?.name || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
  for (const roomType of ROOM_TYPES) {
    const keywords = ROOM_TEMPLATES[roomType].flatMap((g) => g.keywords);
    if (keywords.some((kw) => text.includes(kw))) return roomType;
  }
  return 'living';
}

async function getRoomCompletion(product, { roomType, itemsPerCategory = 3 } = {}) {
  const resolvedRoomType = (roomType && ROOM_TEMPLATES[roomType]) ? roomType : inferRoomType(product);
  const template = ROOM_TEMPLATES[resolvedRoomType];

  const categories = await Promise.all(template.map(async (group) => {
    const regex = new RegExp(group.keywords.map(escapeRegex).join('|'), 'i');
    const matchingCategories = await Category.find({ name: regex }).select('_id').lean();
    const categoryIds = matchingCategories.map((c) => c._id);

    if (categoryIds.length === 0) {
      return { name: group.name, priority: group.priority, items: [], totalPrice: 0 };
    }

    const items = await Product.find({
      category: { $in: categoryIds },
      _id: { $ne: product._id },
      ...baseVisibilityFilter()
    })
      .select(CARD_FIELDS)
      .populate('category', 'name')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(itemsPerCategory)
      .lean();

    const formatted = items.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.images?.[0] || null,
      category: item.category?.name || item.category,
      reason: `Essential for completing your ${resolvedRoomType}`
    }));

    return {
      name: group.name,
      priority: group.priority,
      items: formatted,
      totalPrice: formatted.reduce((sum, i) => sum + i.price, 0)
    };
  }));

  const nonEmpty = categories.filter((c) => c.items.length > 0);
  const estimateLow = nonEmpty.reduce((sum, c) => sum + Math.min(...c.items.map((i) => i.price)), 0);
  const estimateHigh = nonEmpty.reduce((sum, c) => sum + Math.max(...c.items.map((i) => i.price)), 0);

  return {
    roomType: resolvedRoomType,
    categories: categories.sort((a, b) => a.priority - b.priority),
    estimateLow,
    estimateHigh
  };
}

module.exports = { getRoomCompletion, ROOM_TEMPLATES, inferRoomType };
