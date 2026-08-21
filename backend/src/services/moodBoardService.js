const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const AI_PROMPTS = require('../utils/aiPrompts');

class MoodBoardService {
  /**
   * Generates a descriptive narrative and inspiration details for the mood board.
   * @param {Object} designProfile - Calculated profile metadata.
   * @param {Array<string>} themes - Main design elements/themes.
   * @param {string} [userId]
   */
  async generateMoodBoardContent(designProfile, themes = ['Natural textures', 'Harmonious lighting'], userId = null) {
    try {
      const narrativePrompt = AI_PROMPTS.moodBoardNarrative(designProfile, themes);
      const narrative = await this.generateNarrative(narrativePrompt, userId);

      const inspirationPrompt = AI_PROMPTS.inspirationPoints(designProfile);
      const inspiration = await this.generateInspiration(inspirationPrompt, userId);

      return {
        narrative: narrative ? narrative.trim() : '',
        themes,
        inspiration: Array.isArray(inspiration) ? inspiration : []
      };
    } catch (error) {
      const errorInfo = OpenAIErrorHandler.handleError(error, {
        service: 'MoodBoardService',
        method: 'generateMoodBoardContent'
      });
      console.error('[MOODBOARD SERVICE ERROR] Moodboard generation failed:', errorInfo.message);

      return {
        narrative: `Create a harmonious ${designProfile.primaryStyle} space that reflects your personal aesthetic with carefully curated elements including ${themes.join(', ')}.`,
        themes,
        inspiration: [
          "Explore color palettes that evoke your preferred mood",
          "Collect texture samples that resonate with your style",
          "Identify furniture shapes and proportions that appeal to you",
          "Create a visual library of lighting approaches"
        ]
      };
    }
  }

  async generateNarrative(prompt, userId) {
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'moodBoardNarrative',
        userId,
        '/api/quiz/complete',
        response.model
      );

      return response.text;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'MoodBoardService',
        method: 'generateNarrative'
      });
      console.error('[MOODBOARD NARRATIVE ERROR]', errorInfo.message);
      return null;
    }
  }

  async generateInspiration(prompt, userId) {
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'inspirationPoints',
        userId,
        '/api/quiz/complete',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'MoodBoardService',
        method: 'generateInspiration'
      });
      console.error('[MOODBOARD INSPIRATION ERROR]', errorInfo.message);
      return [];
    }
  }
}

module.exports = new MoodBoardService();
