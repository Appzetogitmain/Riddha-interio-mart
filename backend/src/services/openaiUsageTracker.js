const AIUsageLog = require('../models/AIUsageLog');
const logger = require('../utils/logger');

/**
 * Track OpenAI API usage and token consumption
 */
class OpenAIUsageTracker {
  /**
   * Log API usage to database
   * @param {Object} usage - Token usage from OpenAI response
   * @param {string} requirement - Feature tag (e.g., 'recommendation', 'content-generation')
   * @param {string} userId - User ID
   * @param {string} endpoint - API endpoint
   * @param {string} model - Model used
   */
  static async trackUsage(usage, requirement, userId = null, endpoint = null, model = 'gpt-4o-mini') {
    try {
      const logEntry = new AIUsageLog({
        provider: 'openai',
        model,
        requirement,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0,
        userId,
        endpoint,
        timestamp: new Date(),
      });

      await logEntry.save();
      logger.info(`Usage tracked - ${requirement}: ${usage.totalTokens} tokens`, {
        userId,
        model,
      });

      return logEntry;
    } catch (err) {
      logger.error('Failed to log usage:', err);
      // Don't throw - usage tracking shouldn't break the API
      return null;
    }
  }

  /**
   * Get usage statistics for a user
   */
  static async getUserUsageStats(userId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const stats = await AIUsageLog.aggregate([
        {
          $match: {
            userId,
            timestamp: { $gte: startDate },
            provider: 'openai',
          },
        },
        {
          $group: {
            _id: '$requirement',
            totalTokens: { $sum: '$totalTokens' },
            inputTokens: { $sum: '$inputTokens' },
            outputTokens: { $sum: '$outputTokens' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { totalTokens: -1 },
        },
      ]);

      return stats;
    } catch (err) {
      logger.error('Failed to get usage stats:', err);
      return [];
    }
  }

  /**
   * Get usage by requirement (feature)
   */
  static async getUsageByRequirement(requirement, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const stats = await AIUsageLog.aggregate([
        {
          $match: {
            requirement,
            timestamp: { $gte: startDate },
            provider: 'openai',
          },
        },
        {
          $group: {
            _id: '$model',
            totalTokens: { $sum: '$totalTokens' },
            inputTokens: { $sum: '$inputTokens' },
            outputTokens: { $sum: '$outputTokens' },
            count: { $sum: 1 },
            totalCost: {
              $sum: {
                $add: [
                  { $multiply: ['$inputTokens', 0.000003] }, // $3/1M input tokens (gpt-4o-mini)
                  { $multiply: ['$outputTokens', 0.000006] }, // $6/1M output tokens (gpt-4o-mini)
                ],
              },
            },
          },
        },
      ]);

      return stats;
    } catch (err) {
      logger.error('Failed to get requirement stats:', err);
      return [];
    }
  }

  /**
   * Get total API usage across all users
   */
  static async getTotalUsageStats(daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const stats = await AIUsageLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            provider: 'openai',
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$totalTokens' },
            inputTokens: { $sum: '$inputTokens' },
            outputTokens: { $sum: '$outputTokens' },
            requests: { $sum: 1 },
          },
        },
      ]);

      return stats[0] || { totalTokens: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
    } catch (err) {
      logger.error('Failed to get total stats:', err);
      return { totalTokens: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
    }
  }

  /**
   * Calculate cost for tokens used
   * @param {number} inputTokens - Input token count
   * @param {number} outputTokens - Output token count
   * @param {string} model - Model used (for pricing lookup)
   */
  static calculateCost(inputTokens, outputTokens, model = 'gpt-4o-mini') {
    // Pricing as of Aug 2024 (per 1M tokens)
    const pricing = {
      'gpt-4o-mini': {
        input: 0.003,
        output: 0.006,
      },
      'gpt-4o': {
        input: 0.03,
        output: 0.06,
      },
    };

    const rates = pricing[model] || pricing['gpt-4o-mini'];

    return (inputTokens * rates.input + outputTokens * rates.output) / 1000000;
  }

  /**
   * Clean up old usage logs (older than 90 days)
   */
  static async cleanupOldLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await AIUsageLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info(`Cleaned up ${result.deletedCount} old usage logs`);
      return result.deletedCount;
    } catch (err) {
      logger.error('Failed to cleanup logs:', err);
      return 0;
    }
  }
}

module.exports = OpenAIUsageTracker;
