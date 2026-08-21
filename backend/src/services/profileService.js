const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const AI_PROMPTS = require('../utils/aiPrompts');

class ProfileService {
  /**
   * Generates a written personal description (2-3 sentences) for the style profile.
   * @param {Object} designProfile
   * @param {string} [userId]
   */
  async generateProfileNarrative(designProfile, userId = null) {
    const prompt = AI_PROMPTS.profileNarrative(designProfile);
    
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 200
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'profileNarrative',
        userId,
        '/api/profile/narrative',
        response.model
      );

      return response.text ? response.text.trim() : '';
    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'ProfileService',
        method: 'generateProfileNarrative'
      });
      console.error('[PROFILE NARRATIVE ERROR]', errorInfo.message);
      return '';
    }
  }

  /**
   * Generates a short 2-3 word design personality label (e.g. "Sophisticated Minimalist").
   * @param {Object} designProfile
   * @param {string} [userId]
   */
  async generateDesignerPersonality(designProfile, userId = null) {
    const prompt = AI_PROMPTS.designerPersonality(designProfile);
    
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 50
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'designerPersonality',
        userId,
        '/api/profile/personality',
        response.model
      );

      return response.text ? response.text.trim() : 'Cohesive Stylist';
    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'ProfileService',
        method: 'generateDesignerPersonality'
      });
      console.error('[DESIGNER PERSONALITY ERROR]', errorInfo.message);
      return 'Cohesive Stylist';
    }
  }
}

module.exports = new ProfileService();
