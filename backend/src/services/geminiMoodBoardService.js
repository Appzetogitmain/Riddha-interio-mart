const geminiService = require('./geminiService');
const GEMINI_PROMPTS = require('../utils/geminiPrompts');

class MoodBoardService {
  /**
   * Generates a descriptive narrative and inspiration details for the mood board.
   * @param {Object} designProfile - Calculated profile metadata.
   * @param {Array<string>} themes - Main design elements/themes.
   * @param {string} [userId]
   */
  async generateMoodBoardContent(designProfile, themes = ['Natural textures', 'Harmonious lighting'], userId = null) {
    try {
      const narrativePrompt = GEMINI_PROMPTS.moodBoardNarrative(designProfile, themes);
      const narrative = await geminiService.generate(narrativePrompt, 'moodBoardNarrative', userId);

      const inspirationPrompt = GEMINI_PROMPTS.inspirationPoints(designProfile);
      const inspiration = await geminiService.generate(inspirationPrompt, 'inspirationPoints', userId, '/api/quiz/complete', true);

      return {
        narrative: narrative ? narrative.trim() : '',
        themes,
        inspiration: Array.isArray(inspiration) ? inspiration : []
      };
    } catch (error) {
      console.error('[GEMINI MOODBOARD SERVICE ERROR] Moodboard generation failed:', error.message);
      const { FALLBACKS } = require('../utils/geminiErrorHandler');
      return {
        narrative: FALLBACKS.moodBoardNarrative,
        themes,
        inspiration: FALLBACKS.inspirationPoints
      };
    }
  }
}

module.exports = new MoodBoardService();
