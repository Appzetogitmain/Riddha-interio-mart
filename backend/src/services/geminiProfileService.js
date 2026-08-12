const geminiService = require('./geminiService');
const GEMINI_PROMPTS = require('../utils/geminiPrompts');

class ProfileNarrativeService {
  /**
   * Generates a written personal description (2-3 sentences) for the style profile.
   * @param {Object} designProfile
   * @param {string} [userId]
   */
  async generateProfileNarrative(designProfile, userId = null) {
    const prompt = GEMINI_PROMPTS.profileNarrative(designProfile);
    const narrative = await geminiService.generate(prompt, 'profileNarrative', userId);
    return narrative ? narrative.trim() : '';
  }

  /**
   * Generates a short 2-3 word design personality label (e.g. "Sophisticated Minimalist").
   * @param {Object} designProfile
   * @param {string} [userId]
   */
  async generateDesignerPersonality(designProfile, userId = null) {
    const prompt = GEMINI_PROMPTS.designerPersonality(designProfile);
    const personality = await geminiService.generate(prompt, 'designerPersonality', userId);
    return personality ? personality.trim() : 'Cohesive Stylist';
  }
}

module.exports = new ProfileNarrativeService();
