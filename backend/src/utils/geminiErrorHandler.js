/**
 * Error handling and fallback templates for Gemini API calls.
 */

const FALLBACKS = {
  profileNarrative: "You appreciate a thoughtful blend of styles and colors that bring harmony to your space. By balancing functionality with your aesthetic choices, you create a room that is both welcoming and uniquely yours.",
  
  designerPersonality: "Inspired Visionary",
  
  styleSuggestion: {
    title: "Cohesive Styling Concept",
    description: "Create a unified feel by layering textures and maintaining a consistent color scheme throughout the room. Focus on comfort and flow.",
    keyElements: ["Layered textiles", "Balanced lighting layout", "Functional statement piece"]
  },
  
  budgetSuggestion: {
    title: "Smart Investment Approach",
    description: "Allocate your budget strategically by focusing on high-quality central furniture pieces, while keeping accents and decorative elements budget-friendly.",
    budgetAllocation: {
      "invest": ["Central furniture piece (e.g. Sofa or Bed)"],
      "moderate": ["Secondary seating, rugs, or lighting"],
      "budget": ["Cushions, side tables, wall decor"]
    }
  },
  
  boldSuggestion: {
    title: "Expressive Design Accents",
    description: "Inject energy into the space by selecting one high-impact wall or structural piece to showcase a vibrant pattern or color.",
    daringSuggestions: ["High-contrast accent wall", "Eclectic sculptural lighting", "Unexpected color mixing in textile accents"]
  },
  
  classicSuggestion: {
    title: "Timeless Elegance & Comfort",
    description: "Focus on neutral tones and symmetrical furniture layouts that promote ease of movement and a calm, classic aesthetic.",
    principles: ["Symmetrical furniture arrangement", "High-quality natural materials", "Soft, diffused lighting layers"]
  },
  
  productExplanation: "This premium item perfectly complements your preferred design aesthetic, color scheme, and budget guidelines.",
  
  moodBoardNarrative: "This mood board captures a peaceful yet sophisticated atmosphere. Through selected textures, warm tones, and functional layout concepts, it outlines a blueprint to build your dream sanctuary.",
  
  inspirationPoints: [
    "Browse design galleries focusing on your primary style for layout ideas.",
    "Collect swatches of your preferred materials to see how they coordinate under natural light.",
    "Prioritize lighting fixtures that offer adjustable brightness to match different moods."
  ]
};

/**
 * Executes a Gemini API call with retries and handles fallbacks.
 * @param {Function} apiCall - The function that performs the API call.
 * @param {string} fallbackKey - The key corresponding to the fallback content.
 * @param {number} maxRetries - Maximum number of retries (default 3).
 * @returns {Promise<any>}
 */
async function callWithFallback(apiCall, fallbackKey, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();
      if (!response) {
        throw new Error("Empty response received from Gemini API");
      }
      return response;
    } catch (error) {
      console.warn(`[GEMINI ERROR] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${fallbackKey}: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error(`[GEMINI CRITICAL] All retries failed for ${fallbackKey}. Using fallback content.`);
        
        // Handle JSON vs text parse fallback
        const fallback = FALLBACKS[fallbackKey];
        if (typeof fallback === 'object') {
          return fallback;
        }
        return fallback;
      }
    }
  }
}

module.exports = {
  callWithFallback,
  FALLBACKS
};
