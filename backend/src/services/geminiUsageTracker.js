const GeminiUsageLog = require('../models/GeminiUsageLog');

const INPUT_RATE_PER_1K = 0.000075;  // $0.075 / million tokens
const OUTPUT_RATE_PER_1K = 0.0003;   // $0.30 / million tokens
const DAILY_BUDGET_USD = parseFloat(process.env.GEMINI_DAILY_BUDGET) || 5.0;

class GeminiUsageTracker {
  /**
   * Tracks a Gemini API call by logging it to the database and calculating cost.
   * @param {Object} data
   * @param {string} data.userId
   * @param {string} data.requirement
   * @param {string} data.endpoint
   * @param {string} data.prompt
   * @param {string} data.response
   * @param {number} data.inputTokens
   * @param {number} data.outputTokens
   */
  async trackCall({ userId, requirement, endpoint, prompt, response, inputTokens = 0, outputTokens = 0 }) {
    try {
      const inputCost = (inputTokens / 1000) * INPUT_RATE_PER_1K;
      const outputCost = (outputTokens / 1000) * OUTPUT_RATE_PER_1K;
      const totalCost = inputCost + outputCost;

      const log = await GeminiUsageLog.create({
        userId: userId || null,
        requirement,
        endpoint,
        prompt: prompt ? prompt.substring(0, 1000) : '', // limit storage sizes
        response: response ? response.substring(0, 1000) : '',
        tokens: {
          input: inputTokens,
          output: outputTokens
        },
        cost: totalCost,
        timestamp: new Date()
      });

      // Check daily limit alerts
      await this.checkDailyBudgetAlert();

      return log;
    } catch (error) {
      console.error('[GEMINI TRACKER ERROR] Failed to log API usage:', error.message);
    }
  }

  /**
   * Verifies if total expenditure today exceeds configured daily threshold.
   */
  async checkDailyBudgetAlert() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayUsage = await GeminiUsageLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$cost' },
            totalTokens: { $sum: { $add: ['$tokens.input', '$tokens.output'] } }
          }
        }
      ]);

      const costToday = todayUsage[0]?.totalCost || 0;
      if (costToday > DAILY_BUDGET_USD) {
        console.warn(`[GEMINI BUDGET ALERT] Daily budget of $${DAILY_BUDGET_USD.toFixed(2)} exceeded! Current spend: $${costToday.toFixed(4)}`);
      }
    } catch (error) {
      console.error('[GEMINI TRACKER ERROR] Budget verification error:', error.message);
    }
  }

  /**
   * Generates usage report for the Admin dashboard.
   */
  async generateUsageReport(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const report = await GeminiUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$requirement',
          callCount: { $sum: 1 },
          totalInputTokens: { $sum: '$tokens.input' },
          totalOutputTokens: { $sum: '$tokens.output' },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    const overall = await GeminiUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: { $add: ['$tokens.input', '$tokens.output'] } }
        }
      }
    ]);

    return {
      success: true,
      byRequirement: report,
      overall: overall[0] || { totalCalls: 0, totalCost: 0, totalTokens: 0 }
    };
  }
}

module.exports = new GeminiUsageTracker();
