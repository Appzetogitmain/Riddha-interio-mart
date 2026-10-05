const SearchQuery = require('../models/SearchQuery');
const Product = require('../models/Product');
const Brand = require('../models/Brand');

class SearchService {
  constructor() {
    // Search caches are now integrated centrally via CacheService
  }

  /**
   * Helper to calculate Levenshtein distance between two strings (for typo tolerance ranking)
   */
  getLevenshteinDistance(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][j - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return track[s2.length][s1.length];
  }

  /**
   * Logs a user's search phrase to compute trending and recent searches
   */
  async logSearch(userId, searchPhrase) {
    const normalized = searchPhrase.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return;

    try {
      await SearchQuery.findOneAndUpdate(
        { query: normalized, user: userId || null },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Ignore unique index collision or casting errors silently
    }
  }

  /**
   * Returns autocomplete recommendations, trending phrases, and recent searches
   */
  async getSuggestions(userId, partialQuery) {
    const suggestions = new Set();
    const q = partialQuery ? partialQuery.trim().toLowerCase() : '';

    if (q.length > 0) {
      // 1. Find matching Products (up to 5 suggestions)
      const products = await Product.find({
        name: { $regex: q, $options: 'i' },
        isApproved: true,
        approvalStatus: { $in: ['approved', 'Approved'] },
        isActive: true
      })
        .limit(5)
        .select('name');
      products.forEach(p => suggestions.add(p.name));

      // 2. Find matching Categories
      const categories = await Product.distinct('category', {
        category: { $regex: q, $options: 'i' },
        isApproved: true,
        approvalStatus: { $in: ['approved', 'Approved'] },
        isActive: true
      });
      categories.slice(0, 3).forEach(c => suggestions.add(c));

      // 3. Find matching Brands
      const brands = await Brand.find({
        name: { $regex: q, $options: 'i' }
      })
        .limit(3)
        .select('name');
      brands.forEach(b => suggestions.add(b.name));
    }

    // 4. Retrieve Top 5 Trending searches
    const trendingDocs = await SearchQuery.aggregate([
      { $group: { _id: '$query', totalCount: { $sum: '$count' } } },
      { $sort: { totalCount: -1 } },
      { $limit: 5 }
    ]);
    const trending = trendingDocs.map(d => d._id);

    // 5. Retrieve Top 5 Recent searches for the current user
    let recent = [];
    if (userId) {
      const recentDocs = await SearchQuery.find({ user: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('query');
      recent = recentDocs.map(d => d.query);
    }

    return {
      suggestions: Array.from(suggestions).slice(0, 10),
      trending,
      recent
    };
  }

  /**
   * Generates a typo-tolerant Mongoose query fallback
   */
  getFuzzyRegex(searchString) {
    const tokens = searchString.trim().split(/\s+/);
    return tokens.map(t => {
      if (t.length <= 3) return new RegExp(t, 'i');
      // Use the first 3 letters as a prefix constraint to gather candidates (handles transposition typos like paitn -> paint)
      const prefix = t.slice(0, 3);
      return new RegExp(prefix, 'i');
    });
  }

  /**
   * Invalidate search caches when new products are created or stocks modified
   */
  clearCache() {
    const cacheService = require('./cacheService');
    cacheService.delPattern('search:*');
  }

  /**
   * Retrieves results from the local search cache
   */
  getCachedResult(key) {
    const cacheService = require('./cacheService');
    return cacheService.get(`search:${key}`);
  }

  /**
   * Saves results inside the cache
   */
  setCacheResult(key, data) {
    const cacheService = require('./cacheService');
    cacheService.set(`search:${key}`, data, 300); // 5 minutes = 300 seconds
  }
}

module.exports = new SearchService();
