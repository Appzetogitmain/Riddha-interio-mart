const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class EstimatorService {
  /**
   * 1. Cost Breakdown Analysis
   */
  async analyzeCostBreakdown(estimateData, userId = null) {
    const { roomType, area, materialTier, costBreakdown } = estimateData;
    const { grandTotal, furniture, flooring, lighting, decor, paint, labor, contingency } = costBreakdown || {};

    const prompt = `Analyze this interior design cost breakdown:

Total Estimate: ₹${grandTotal?.toLocaleString() || 0}
Room Type: ${roomType} (${area} sq ft)
Quality Tier: ${materialTier}

Breakdown:
- Furniture: ₹${furniture?.toLocaleString() || 0}
- Flooring: ₹${flooring?.toLocaleString() || 0}
- Lighting: ₹${lighting?.toLocaleString() || 0}
- Decor: ₹${decor?.toLocaleString() || 0}
- Paint/Walls: ₹${paint?.toLocaleString() || 0}
- Labor & Installation: ₹${labor?.toLocaleString() || 0}
- Contingency: ₹${contingency?.toLocaleString() || 0}

Generate an insightful 2-paragraph analysis:
1. Assessment of budget allocation balance across categories.
2. Value-for-money assessment and strategic investment recommendation.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'estimatorCostBreakdown',
        userId,
        '/api/estimates',
        response.model
      );

      return response.text || `Cost Breakdown Analysis:\nThe budget allocation for this ${area} sq ft ${roomType} is well-balanced across primary categories. Investment is prioritized toward core furniture and specialized installation, ensuring durable structural quality.\n\nThe ${materialTier} material tier offers an optimal balance between quality and cost efficiency, providing high aesthetic value while keeping labor and contingency reserves within safe limits.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'EstimatorService',
        method: 'analyzeCostBreakdown'
      });
      console.error('[ESTIMATOR COST BREAKDOWN ERROR]', errorInfo.message);
      return `Cost Breakdown Analysis:\nThe budget allocation for this ${area} sq ft ${roomType} is well-balanced across primary categories. Investment is prioritized toward core furniture and specialized installation, ensuring durable structural quality.\n\nThe ${materialTier} material tier offers an optimal balance between quality and cost efficiency, providing high aesthetic value while keeping labor and contingency reserves within safe limits.`;
    }
  }

  /**
   * 2. Budget Optimization Suggestions (JSON array)
   */
  async suggestOptimizations(estimateData, userId = null) {
    const { roomType, area, materialTier, costBreakdown } = estimateData;
    const { grandTotal, furniture, flooring, lighting, labor } = costBreakdown || {};

    const prompt = `Suggest cost optimizations for this interior design estimate:

Room: ${roomType} (${area} sq ft, ${materialTier} tier)
Total Estimate: ₹${grandTotal}
Furniture: ₹${furniture}, Flooring: ₹${flooring}, Lighting: ₹${lighting}, Labor: ₹${labor}

Return a valid JSON array of 3-4 specific optimization objects:
[
  { "suggestion": "Clear actionable advice", "savings": 15000, "impact": "low|medium|high" }
]`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'estimatorOptimizations',
        userId,
        '/api/estimates',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      if (Array.isArray(result) && result.length > 0) return result;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'EstimatorService',
        method: 'suggestOptimizations'
      });
      console.error('[ESTIMATOR OPTIMIZATIONS ERROR]', errorInfo.message);
    }

    return [
      { suggestion: 'Source modular lighting fixtures in standard bundles rather than custom imports', savings: Math.round((lighting || 10000) * 0.2), impact: 'low' },
      { suggestion: 'Optimize flooring selection to high-grade ceramic tiles over imported marble', savings: Math.round((flooring || 15000) * 0.3), impact: 'medium' },
      { suggestion: 'Consolidate site visits and installation schedules to reduce labor overhead', savings: Math.round((labor || 20000) * 0.15), impact: 'low' }
    ];
  }

  /**
   * 3. Tier Comparison Analysis
   */
  async compareTiers(economyData, standardData, premiumData, roomType, area, userId = null) {
    const prompt = `Compare interior design cost tiers for a ${area} sq ft ${roomType}:

Economy Tier Total: ₹${economyData.grandTotal.toLocaleString()} (₹${economyData.costPerSqFt}/sq ft)
Standard Tier Total: ₹${standardData.grandTotal.toLocaleString()} (₹${standardData.costPerSqFt}/sq ft)
Premium Tier Total: ₹${premiumData.grandTotal.toLocaleString()} (₹${premiumData.costPerSqFt}/sq ft)

Write a concise comparison narrative highlighting key material differences, value gains between tiers, and a recommendation based on space utilization.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'estimatorTierComparison',
        userId,
        '/api/estimates/comparison',
        response.model
      );

      return response.text || `Tier Comparison Insights:\n- Economy (₹${economyData.grandTotal.toLocaleString()}): Ideal for rental properties or temporary setups using durable standard laminates.\n- Standard (₹${standardData.grandTotal.toLocaleString()}): Recommended baseline offering premium hardware, long-lasting finishes, and balanced aesthetic appeal.\n- Premium (₹${premiumData.grandTotal.toLocaleString()}): Luxury grade featuring custom architectural joinery, imported lighting, and bespoke stone finishes.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'EstimatorService',
        method: 'compareTiers'
      });
      console.error('[ESTIMATOR TIER COMPARISON ERROR]', errorInfo.message);
      return `Tier Comparison Insights:\n- Economy (₹${economyData.grandTotal.toLocaleString()}): Ideal for rental properties or temporary setups using durable standard laminates.\n- Standard (₹${standardData.grandTotal.toLocaleString()}): Recommended baseline offering premium hardware, long-lasting finishes, and balanced aesthetic appeal.\n- Premium (₹${premiumData.grandTotal.toLocaleString()}): Luxury grade featuring custom architectural joinery, imported lighting, and bespoke stone finishes.`;
    }
  }

  /**
   * 4. Timeline vs Cost Impact Analysis
   */
  async analyzeTimelineImpact(timeline, timelineAdjustment, grandTotal, userId = null) {
    const prompt = `Analyze timeline impact on this interior project cost:

Selected Timeline: ${timeline}
Timeline Adjustment: ₹${timelineAdjustment.toLocaleString()}
Total Estimate: ₹${grandTotal.toLocaleString()}

Write a 2-sentence trade-off analysis explaining how the project timeline affects vendor lead times, labor costs, and overall savings.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'estimatorTimelineImpact',
        userId,
        '/api/estimates',
        response.model
      );

      return response.text || `Selecting a ${timeline} timeline applies a cost adjustment of ₹${timelineAdjustment.toLocaleString()}. Planning ahead allows vendors to source materials at standard rates without incurring expedited shipping or overtime labor charges.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'EstimatorService',
        method: 'analyzeTimelineImpact'
      });
      console.error('[ESTIMATOR TIMELINE IMPACT ERROR]', errorInfo.message);
      return `Selecting a ${timeline} timeline applies a cost adjustment of ₹${timelineAdjustment.toLocaleString()}. Planning ahead allows vendors to source materials at standard rates without incurring expedited shipping or overtime labor charges.`;
    }
  }

  /**
   * 5. Risk & Contingency Assessment
   */
  async assessRisksAndContingency(estimateData, userId = null) {
    const { roomType, scope, costBreakdown } = estimateData;
    const contingency = costBreakdown?.contingency || 0;

    const prompt = `Assess contingency and project risk for an interior project:

Room Type: ${roomType}
Scope: ${JSON.stringify(scope)}
Allocated Contingency: ₹${contingency.toLocaleString()} (10%)

Provide 3 bulleted risk factors (unforeseen structural repairs, material lead time fluctuation, custom fabrication variations) and how to manage the contingency buffer.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'estimatorRiskAssessment',
        userId,
        '/api/estimates',
        response.model
      );

      return response.text || `Risk Assessment & Contingency Reserve (₹${contingency.toLocaleString()}):\n- Hidden On-site Variations: Wall leveling or electrical rewiring required prior to installation.\n- Material Price Fluctuations: Minor lead-time changes for imported decor or specialized tiles.\n- Site Logistics: Contingency buffer ensures zero project halts if custom adjustments are needed on site.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'EstimatorService',
        method: 'assessRisksAndContingency'
      });
      console.error('[ESTIMATOR RISK ASSESSMENT ERROR]', errorInfo.message);
      return `Risk Assessment & Contingency Reserve (₹${contingency.toLocaleString()}):\n- Hidden On-site Variations: Wall leveling or electrical rewiring required prior to installation.\n- Material Price Fluctuations: Minor lead-time changes for imported decor or specialized tiles.\n- Site Logistics: Contingency buffer ensures zero project halts if custom adjustments are needed on site.`;
    }
  }
}

module.exports = new EstimatorService();
