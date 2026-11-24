import api from './api';

// Mirrors backend/src/services/displayService.js resolveDisplay(): products carry their REAL rating /
// review count, the config carries admin overrides + the bestseller list, and this merges them.
export const DEFAULT_DISPLAY_CONFIG = {
  ratingsEnabled: true,
  autoRatingEnabled: true,
  badge: { text: 'BESTSELLER', bgColor: '#E11D48', textColor: '#FFFFFF', position: 'bottom-left' },
  bestsellerIds: [],
  overrides: {},
};

export const resolveProductDisplay = (product, config = DEFAULT_DISPLAY_CONFIG) => {
  const id = String(product?._id || product?.id || '');
  const o = config.overrides?.[id] || {};
  const realRating = Number(product?.averageRating) || 0;
  const realCount = Number(product?.totalReviews) || 0;

  const rating = o.rating != null ? o.rating : (config.autoRatingEnabled ? realRating : 0);
  const reviewCount = o.reviewCount != null ? o.reviewCount : (config.autoRatingEnabled ? realCount : 0);
  const showRating = !!config.ratingsEnabled && !o.hideRating && rating > 0;

  const isBestseller = (config.bestsellerIds || []).includes(id);
  const badge = isBestseller && o.badgeEnabled !== false ? { ...config.badge, ...(o.badge || {}) } : null;
  return { rating: showRating ? rating : 0, reviewCount: showRating ? reviewCount : 0, showRating, isBestseller, badge };
};

let cached = null;
let cachedAt = 0;
let inflight = null;
const TTL = 5 * 60 * 1000;

export const loadDisplayConfig = () => {
  if (cached && Date.now() - cachedAt < TTL) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api.get('/display/config')
      .then(r => { cached = { ...DEFAULT_DISPLAY_CONFIG, ...(r.data?.data || {}) }; cachedAt = Date.now(); return cached; })
      .catch(() => cached || DEFAULT_DISPLAY_CONFIG)
      .finally(() => { inflight = null; });
  }
  return inflight;
};

export const clearDisplayConfigCache = () => { cached = null; cachedAt = 0; };
