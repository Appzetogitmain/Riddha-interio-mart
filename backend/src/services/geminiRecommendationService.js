const geminiService = require('./geminiService');
const { calculateProductScore } = require('../utils/recommendationEngine');

class GeminiRecommendationService {
  /**
   * 1. Personalized Product Ranking (GEMINI Prompt 1)
   */
  async rankProductsForUser(candidateProducts, userProfile, userId = null) {
    if (!candidateProducts || !candidateProducts.length) return [];

    const productsFormatted = candidateProducts.map(p => ({
      productId: p._id || p.id,
      name: p.name,
      style: p.style || 'Modern',
      price: p.price,
      colors: p.color ? [p.color] : [],
      materials: p.material ? [p.material] : [],
      rating: p.averageRating || 4.5
    }));

    const prompt = `
    Rank these products for the user based on their profile:

    User Profile:
    - Style Preferences: ${(userProfile?.stylePreferences || []).join(', ') || 'Modern'}
    - Color Preferences: ${(userProfile?.colorPreferences || []).join(', ') || 'Neutral'}
    - Budget Range: ₹${userProfile?.budgetRange?.min || 0} - ₹${userProfile?.budgetRange?.max || 200000}
    - Materials Preferred: ${(userProfile?.materialPreferences || []).join(', ') || 'Wood'}
    - Design Profile: ${userProfile?.designProfile?.personality || 'Minimalist'}

    Products to Rank:
    ${JSON.stringify(productsFormatted.slice(0, 15), null, 2)}

    Rank criteria: style match, budget alignment, aesthetic fit, value for money.
    Respond ONLY with a JSON object in this format:
    {
      "rankedProducts": [
        {
          "productId": "...",
          "rank": 1,
          "score": 95,
          "reasoning": "Why this is perfect for them",
          "keyPoints": ["point1", "point2"]
        }
      ],
      "overallInsight": "This user loves..."
    }
    `;

    try {
      const result = await geminiService.generate(
        prompt,
        'recommendationRanking',
        userId,
        '/api/recommendations/for-user',
        true
      );
      return result;
    } catch (err) {
      console.error('[GEMINI RANKING ERROR]', err.message);
      return {
        rankedProducts: candidateProducts.slice(0, 10).map((p, index) => ({
          productId: p._id || p.id,
          rank: index + 1,
          score: Math.max(70, 95 - index * 3),
          reasoning: `Matches your style preference in ${p.style || 'interior design'}.`,
          keyPoints: ['High quality design', 'Fits preferred aesthetic', 'Great value']
        })),
        overallInsight: 'Curated products aligned with your design profile.'
      };
    }
  }

  /**
   * 2. Personalized Recommendation Explanation (GEMINI Prompt 2)
   */
  async generateRecommendationReason(product, userProfile, userId = null) {
    const prompt = `
    Generate a personalized 1-2 sentence recommendation explanation for a customer on an interior design store.

    User Profile:
    - Primary Style: ${(userProfile?.stylePreferences || ['Modern'])[0]}
    - Color Preferences: ${(userProfile?.colorPreferences || ['Neutral']).join(', ')}
    - Preferred Materials: ${(userProfile?.materialPreferences || ['Wood']).join(', ')}

    Product:
    - Name: ${product.name}
    - Style: ${product.style || 'Modern'}
    - Price: ₹${product.price}
    - Material: ${product.material || 'Premium'}

    Create a warm, designer-style 1-2 sentence explanation starting with "You'll love this because..." or "Given your love for...".
    Return ONLY the plain text string.
    `;

    try {
      const explanation = await geminiService.generate(
        prompt,
        'recommendationReason',
        userId,
        '/api/recommendations/explanation',
        false
      );
      return typeof explanation === 'string' ? explanation.trim() : `You'll love this ${product.name} because it perfectly matches your ${product.style || 'interior'} aesthetic.`;
    } catch (err) {
      return `You'll love this ${product.name} because it perfectly matches your ${product.style || 'interior'} aesthetic.`;
    }
  }

  /**
   * 3. Smart Cross-Sell Suggestions (GEMINI Prompt 3)
   */
  async suggestCrossSell(product, userProfile, userId = null) {
    const prompt = `
    Identify complementary cross-sell products for this furniture/interior item:

    Product: ${product.name} (${product.category?.name || product.category || 'Furniture'}, Style: ${product.style || 'Modern'}, Price: ₹${product.price})
    User Style: ${(userProfile?.stylePreferences || ['Modern'])[0]}

    Generate a JSON response:
    {
      "crossSellSuggestions": [
        {
          "productType": "Complementary item category",
          "reason": "Why it complements the main product",
          "description": "How to pair together",
          "priceRange": "₹5,000 - ₹15,000",
          "styleMatch": "Perfect match for their style"
        }
      ],
      "bundleSuggestion": "Combining these creates a complete room look."
    }
    `;

    try {
      return await geminiService.generate(prompt, 'crossSell', userId, '/api/recommendations/cross-sell', true);
    } catch (err) {
      return {
        crossSellSuggestions: [
          {
            productType: "Complementary Lighting & Rugs",
            reason: `Enhances the ambience around your ${product.name}`,
            description: "Pair with warm ambient lighting and a textured rug",
            priceRange: "₹3,000 - ₹12,000",
            styleMatch: "High match"
          }
        ],
        bundleSuggestion: "Complete the look with matching decor pieces."
      };
    }
  }

  /**
   * 4. Smart Upsell Opportunities (GEMINI Prompt 4)
   */
  async suggestUpsell(product, userProfile, userId = null) {
    const prompt = `
    Identify premium upgrade options (upsell) for this item:

    Product: ${product.name} (Price: ₹${product.price}, Category: ${product.category?.name || 'Interior'})
    User Budget Range: ₹${userProfile?.budgetRange?.min || 0} - ₹${userProfile?.budgetRange?.max || 200000}

    Generate a JSON response:
    {
      "upsellOptions": [
        {
          "product": "Premium upgrade title",
          "upgrade": "Enhanced feature or luxury material",
          "priceDifference": "₹10,000",
          "valueAdd": "Why it's worth upgrading",
          "recommendation": "yes"
        }
      ]
    }
    `;

    try {
      return await geminiService.generate(prompt, 'upsell', userId, '/api/recommendations/upsell', true);
    } catch (err) {
      return {
        upsellOptions: [
          {
            product: `Luxury Edition ${product.name}`,
            upgrade: "Handcrafted teak finish & high-grade upholstery",
            priceDifference: `₹${Math.round(product.price * 0.25)}`,
            valueAdd: "Superior durability and 5-year extended warranty",
            recommendation: "yes"
          }
        ]
      };
    }
  }

  /**
   * 5. Bundle & Set Recommendations (GEMINI Prompt 5)
   */
  async createRoomBundles(userProfile, roomType = 'Living Room', userId = null) {
    const prompt = `
    Create 3 curated room set bundles for room type: ${roomType}
    User Style: ${(userProfile?.stylePreferences || ['Modern'])[0]}
    Budget Range: ₹${userProfile?.budgetRange?.min || 50000} - ₹${userProfile?.budgetRange?.max || 300000}

    Create JSON with 3 sets:
    {
      "bundles": [
        {
          "name": "Budget-Friendly Set",
          "itemCount": 5,
          "totalCost": 45000,
          "savings": "₹5,000 off bundle price",
          "description": "Essential core furniture and accents",
          "items": ["Sofa", "Coffee Table", "Rug", "Floor Lamp", "Cushion Set"],
          "stylingTip": "Keep colors warm and neutral"
        },
        {
          "name": "Balanced Complete Set",
          "itemCount": 8,
          "totalCost": 120000,
          "savings": "₹15,000 off bundle price",
          "description": "Full room styling with premium finishes",
          "items": ["3-Seater Sofa", "Accent Chairs", "Center Table", "Area Rug", "Standing Lamp", "Wall Art", "Side Tables", "Curtains"],
          "stylingTip": "Layer textures for a rich designer feel"
        },
        {
          "name": "Luxury Designer Suite",
          "itemCount": 10,
          "totalCost": 250000,
          "savings": "₹35,000 off bundle price",
          "description": "Italian leather and custom brass accents",
          "items": ["Leather Sectional", "Marble Coffee Table", "Custom Chandelier", "Silk Rug", "Designer Loungers", "Smart Ambient Lighting"],
          "stylingTip": "Focus on high contrast statement pieces"
        }
      ]
    }
    `;

    try {
      return await geminiService.generate(prompt, 'roomBundles', userId, '/api/recommendations/bundles', true);
    } catch (err) {
      return {
        bundles: [
          {
            name: `${roomType} Essential Set`,
            itemCount: 5,
            totalCost: 65000,
            savings: "₹8,000 off",
            description: "Cohesive aesthetic with top-rated pieces",
            items: ["Main Furniture", "Accent Table", "Floor Lamp", "Area Rug", "Wall Decor"],
            stylingTip: "Balance lighting and natural textures."
          }
        ]
      };
    }
  }

  /**
   * Backwards compatible enhanceRecommendations
   */
  async enhanceRecommendations(products, designProfile, userId = null) {
    try {
      const scoredProducts = products.map(product => {
        const score = calculateProductScore(product, { designProfile });
        return {
          product,
          matchScore: score,
          matchPercentage: Math.round(score * 100),
          recommendationStrength: score >= 0.85 ? "Perfect Match" : "Strong Match"
        };
      });

      scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
      const topProducts = scoredProducts.slice(0, 10);

      let explanationCount = 0;
      const enhanced = await Promise.all(
        topProducts.map(async (item) => {
          if (item.matchScore > 0.70 && explanationCount < 3) {
            explanationCount++;
            const explanation = await this.generateRecommendationReason(item.product, { stylePreferences: [designProfile.primaryStyle] }, userId);
            return { ...item, aiExplanation: explanation };
          }
          return item;
        })
      );
      return enhanced;
    } catch (error) {
      return products.slice(0, 10).map(p => ({
        product: p,
        matchScore: 0.75,
        matchPercentage: 75,
        recommendationStrength: 'Good Match'
      }));
    }
  }
}

module.exports = new GeminiRecommendationService();
