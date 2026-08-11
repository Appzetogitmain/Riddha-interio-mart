const geminiService = require('./geminiService');
const GEMINI_PROMPTS = require('../utils/geminiPrompts');

class PersonalizedRecommendationEngine {
  /**
   * Enhances product listings by scoring them against the user profile and adding AI explanations for top matches.
   * @param {Array} products - List of Mongoose Product documents or lean objects.
   * @param {Object} designProfile - The calculated user design profile.
   * @param {string} [userId] - Optional User ID.
   */
  async enhanceRecommendations(products, designProfile, userId = null) {
    try {
      // 1. Score all products
      const scoredProducts = products.map(product => {
        const score = this.calculateProductScore(product, designProfile);
        return {
          product,
          matchScore: score,
          matchPercentage: Math.round(score * 100),
          recommendationStrength: this.getStrength(score)
        };
      });

      // 2. Sort by score descending
      scoredProducts.sort((a, b) => b.matchScore - a.matchScore);

      // 3. Take top 10 recommended products
      const topProducts = scoredProducts.slice(0, 10);

      // 4. Generate AI explanations ONLY for top matches (limit to max 3 to optimize speed and cost)
      let explanationCount = 0;
      const enhanced = await Promise.all(
        topProducts.map(async (item) => {
          if (item.matchScore > 0.70 && explanationCount < 3) {
            explanationCount++;
            try {
              const prompt = GEMINI_PROMPTS.productExplanation(item.product, designProfile, item.matchScore);
              const explanation = await geminiService.generate(prompt, 'productExplanation', userId);
              return {
                ...item,
                aiExplanation: explanation
              };
            } catch (err) {
              console.error(`[GEMINI REC ERROR] Failed to explain product ${item.product._id}:`, err.message);
              return {
                ...item,
                aiExplanation: `This item matches your preferred ${designProfile.primaryStyle} style and color palette.`
              };
            }
          }
          return item;
        })
      );

      return enhanced;
    } catch (error) {
      console.error('[GEMINI RECOMMENDATION SERVICE ERROR] Recommendation enhancement failed:', error.message);
      return products.slice(0, 10).map(p => ({
        product: p,
        matchScore: 0.70,
        matchPercentage: 70,
        recommendationStrength: 'Good Match'
      }));
    }
  }

  /**
   * Calculates a match score (0.0 to 1.0) between a product and a design profile.
   */
  calculateProductScore(product, profile) {
    let score = 0.1; // Base starting score

    // 1. Room Type Match (Max +0.35)
    if (product.roomType && profile.roomType && product.roomType.toLowerCase() === profile.roomType.toLowerCase()) {
      score += 0.35;
    } else {
      // Fallback matching in name/description
      const searchTerms = [profile.roomType];
      if (profile.roomType === 'living') searchTerms.push('sofa', 'couch', 'lounge', 'living room');
      if (profile.roomType === 'bedroom') searchTerms.push('bed', 'mattress', 'nightstand', 'bedroom');
      if (profile.roomType === 'kitchen') searchTerms.push('cabinet', 'kitchen', 'countertop', 'faucet');
      if (profile.roomType === 'dining') searchTerms.push('dining', 'table', 'chair');

      const matchesTerm = searchTerms.some(term => {
        const regex = new RegExp(term, 'i');
        return regex.test(product.name) || regex.test(product.description || '');
      });

      if (matchesTerm) {
        score += 0.25;
      }
    }

    // 2. Style Match (Max +0.25)
    const styleRegex = new RegExp(profile.primaryStyle, 'i');
    if (product.style && styleRegex.test(product.style)) {
      score += 0.25;
    } else if (styleRegex.test(product.name) || styleRegex.test(product.description || '')) {
      score += 0.20;
    }

    // 3. Color Match (Max +0.20)
    if (profile.colors && profile.colors.length > 0) {
      const colorMatches = profile.colors.some(color => {
        const regex = new RegExp(color, 'i');
        return (product.color && regex.test(product.color)) || 
               regex.test(product.name) || 
               regex.test(product.description || '');
      });
      if (colorMatches) {
        score += 0.20;
      }
    }

    // 4. Material Match (Max +0.15)
    if (profile.materials && profile.materials.length > 0) {
      const materialMatches = profile.materials.some(mat => {
        const regex = new RegExp(mat, 'i');
        return (product.material && regex.test(product.material)) || 
               regex.test(product.name) || 
               regex.test(product.description || '');
      });
      if (materialMatches) {
        score += 0.15;
      }
    }

    // 5. Price Check (Max +0.05)
    if (profile.budget && profile.budget.max) {
      if (product.price <= profile.budget.max) {
        score += 0.05;
      }
    }

    // Cap score at 0.99
    return Math.min(Math.max(score, 0.1), 0.99);
  }

  getStrength(score) {
    if (score >= 0.85) return "Perfect Match";
    if (score >= 0.75) return "Excellent Match";
    if (score >= 0.60) return "Strong Match";
    return "Good Match";
  }
}

module.exports = new PersonalizedRecommendationEngine();
