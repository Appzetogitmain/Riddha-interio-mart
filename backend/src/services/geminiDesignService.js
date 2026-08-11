const geminiService = require('./geminiService');
const GEMINI_PROMPTS = require('../utils/geminiPrompts');

class DesignSuggestionEngine {
  /**
   * Generates a list of 3 design suggestions: style focus, budget optimization, and bold/classic approach.
   * @param {Object} designProfile
   * @param {string} [userId]
   */
  async generateSuggestions(designProfile, userId = null) {
    try {
      const promises = [
        // Suggestion 1: Primary Style Focus
        this.generateStyleSuggestion(designProfile, userId),
        
        // Suggestion 2: Budget-Optimized Strategy
        this.generateBudgetSuggestion(designProfile, userId),
        
        // Suggestion 3: Bold or Classic approach depending on boldness score
        designProfile.boldness >= 6
          ? this.generateBoldSuggestion(designProfile, userId)
          : this.generateClassicSuggestion(designProfile, userId)
      ];

      const results = await Promise.all(promises);
      return results.filter(Boolean);
    } catch (error) {
      console.error('[GEMINI DESIGN SERVICE ERROR] Suggestions generation failed:', error.message);
      // Fallback templates from error handler
      const { FALLBACKS } = require('../utils/geminiErrorHandler');
      const fallbackSuggestion3 = designProfile.boldness >= 6 ? FALLBACKS.boldSuggestion : FALLBACKS.classicSuggestion;
      return [
        FALLBACKS.styleSuggestion,
        FALLBACKS.budgetSuggestion,
        fallbackSuggestion3
      ];
    }
  }

  async generateStyleSuggestion(profile, userId) {
    const prompt = GEMINI_PROMPTS.styleSuggestion(profile);
    return await geminiService.generate(prompt, 'styleSuggestion', userId, '/api/quiz/complete', true);
  }

  async generateBudgetSuggestion(profile, userId) {
    const prompt = GEMINI_PROMPTS.budgetSuggestion(profile);
    return await geminiService.generate(prompt, 'budgetSuggestion', userId, '/api/quiz/complete', true);
  }

  async generateBoldSuggestion(profile, userId) {
    const prompt = GEMINI_PROMPTS.boldSuggestion(profile);
    return await geminiService.generate(prompt, 'boldSuggestion', userId, '/api/quiz/complete', true);
  }

  async generateClassicSuggestion(profile, userId) {
    const prompt = GEMINI_PROMPTS.classicSuggestion(profile);
    return await geminiService.generate(prompt, 'classicSuggestion', userId, '/api/quiz/complete', true);
  }
}

module.exports = new DesignSuggestionEngine();
