const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const AI_PROMPTS = require('../utils/aiPrompts');

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
      const errorInfo = OpenAIErrorHandler.handleError(error, {
        service: 'DesignSuggestionEngine',
        method: 'generateSuggestions'
      });
      console.error('[DESIGN SERVICE ERROR] Suggestions generation failed:', errorInfo.message);

      // Fallback templates
      const fallbackSuggestion3 = designProfile.boldness >= 6 ? {
        title: "Bold & Expressive Design",
        description: "Embrace your daring side with statement pieces and unexpected color combinations that reflect your unique personality.",
        daringSuggestions: ["Feature wall in accent color", "Mix patterns confidently", "Invest in statement furniture"]
      } : {
        title: "Timeless & Elegant Design",
        description: "Create a sophisticated space with classic elements that stand the test of time while maintaining comfort and functionality.",
        classicElements: ["Quality foundational pieces", "Neutral color palette", "Timeless material choices"]
      };

      return [
        {
          title: "Style-Focused Design",
          description: `Curate your space around your ${designProfile.primaryStyle} aesthetic with carefully selected pieces that showcase your design taste.`,
          keyElements: ["Statement focal point", "Color coordination", "Material harmony"]
        },
        {
          title: "Smart Investment Approach",
          description: `Strategically allocate your ₹${designProfile.budget.max} budget to maximize impact while maintaining quality and longevity.`,
          budgetAllocation: {
            invest: ["High-impact focal pieces"],
            moderate: ["Mid-range supporting furniture"],
            budget: ["Affordable accessories"]
          }
        },
        fallbackSuggestion3
      ];
    }
  }

  async generateStyleSuggestion(profile, userId) {
    const prompt = AI_PROMPTS.styleSuggestion(profile);
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
        'styleSuggestion',
        userId,
        '/api/quiz/complete',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'DesignSuggestionEngine',
        method: 'generateStyleSuggestion'
      });
      console.error('[STYLE SUGGESTION ERROR]', errorInfo.message);
      return null;
    }
  }

  async generateBudgetSuggestion(profile, userId) {
    const prompt = AI_PROMPTS.budgetSuggestion(profile);
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'budgetSuggestion',
        userId,
        '/api/quiz/complete',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'DesignSuggestionEngine',
        method: 'generateBudgetSuggestion'
      });
      console.error('[BUDGET SUGGESTION ERROR]', errorInfo.message);
      return null;
    }
  }

  async generateBoldSuggestion(profile, userId) {
    const prompt = AI_PROMPTS.boldSuggestion(profile);
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'boldSuggestion',
        userId,
        '/api/quiz/complete',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'DesignSuggestionEngine',
        method: 'generateBoldSuggestion'
      });
      console.error('[BOLD SUGGESTION ERROR]', errorInfo.message);
      return null;
    }
  }

  async generateClassicSuggestion(profile, userId) {
    const prompt = AI_PROMPTS.classicSuggestion(profile);
    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'classicSuggestion',
        userId,
        '/api/quiz/complete',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'DesignSuggestionEngine',
        method: 'generateClassicSuggestion'
      });
      console.error('[CLASSIC SUGGESTION ERROR]', errorInfo.message);
      return null;
    }
  }
}

module.exports = new DesignSuggestionEngine();
