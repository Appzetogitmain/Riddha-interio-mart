const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class QuotationService {
  /**
   * 1. Professional Opening Introduction
   */
  async generateOpeningMessage(data = {}, userId = null) {
    const { clientName = 'Client', projectName = 'Interior Design Project', grandTotal = 0 } = data;

    const prompt = `Generate a warm, professional opening introduction for an interior design quotation:
Client Name: ${clientName}
Project Name: ${projectName}
Grand Total: Rs. ${grandTotal}

Create a warm, professional 2-3 sentence introduction that:
1. Thanks them for their inquiry and design collaboration with Riddha Interio Mart.
2. Summarizes the project scope briefly.
3. Expresses confidence in delivering exceptional craft and quality.

Return ONLY plain text text string (no quotes around output).`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 300
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'quotationOpening',
        userId,
        '/api/quotations/ai-enhance',
        response.model
      );

      if (response.text && typeof response.text === 'string') return response.text.trim();
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'QuotationService',
        method: 'generateOpeningMessage'
      });
      console.error('[QUOTATION OPENING ERROR]', errorInfo.message);
    }

    return `Dear ${clientName}, thank you for choosing Riddha Interio Mart for your ${projectName}. We are delighted to present this detailed itemized quotation tailored to your aesthetic requirements, material specifications, and timeline. Our team is committed to executing your design vision with precision craftsmanship and seamless project delivery.`;
  }

  /**
   * 2. Payment Terms Recommendation
   */
  async suggestPaymentTerms(grandTotal = 0, timeline = '30 days', userId = null) {
    const prompt = `Suggest optimal payment milestone terms for an interior project costing Rs. ${grandTotal} over ${timeline}:

Return ONLY a valid JSON object:
{
  "structure": "2-installment|3-installment|custom",
  "reasoning": "Brief explanation of why this payment schedule protects cash flow and client trust",
  "schedule": [
    { "installmentNo": 1, "percentage": 50, "description": "50% Advance Booking & Procurement" },
    { "installmentNo": 2, "percentage": 30, "description": "30% Material Dispatch & Installation Start" },
    { "installmentNo": 3, "percentage": 20, "description": "20% Handover & Quality Verification" }
  ]
}`;

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
        'quotationPaymentTerms',
        userId,
        '/api/quotations/ai-enhance',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      if (result && result.structure && Array.isArray(result.schedule)) return result;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'QuotationService',
        method: 'suggestPaymentTerms'
      });
      console.error('[QUOTATION PAYMENT TERMS ERROR]', errorInfo.message);
    }

    return {
      structure: grandTotal > 300000 ? '3-installment' : '2-installment',
      reasoning: 'Milestone-based payment protects material procurement costs while giving the client complete quality assurance at key stages.',
      schedule: grandTotal > 300000 ? [
        { installmentNo: 1, percentage: 50, description: '50% Advance Booking & Procurement' },
        { installmentNo: 2, percentage: 30, description: '30% Material Dispatch & On-Site Installation' },
        { installmentNo: 3, percentage: 20, description: '20% Final Handover & Quality Verification' }
      ] : [
        { installmentNo: 1, percentage: 50, description: '50% Advance Booking & Order Placement' },
        { installmentNo: 2, percentage: 50, description: '50% On Delivery & Final Installation Handover' }
      ]
    };
  }

  /**
   * 3. Delivery Terms Language Generator
   */
  async generateDeliveryTerms(data = {}, userId = null) {
    const { mode = 'site-delivery', itemCount = 5, timeline = '2-3 weeks' } = data;

    const prompt = `Generate professional delivery & installation terms:
Delivery Mode: ${mode}
Items Count: ${itemCount} items
Timeline: ${timeline}

Create a clear, professional 3-bullet point delivery overview explaining transit safety, on-site staging, and installation support.

Return ONLY a valid JSON array of 3 strings:
["Term 1", "Term 2", "Term 3"]`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'quotationDeliveryTerms',
        userId,
        '/api/quotations/ai-enhance',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      if (Array.isArray(result) && result.length > 0) return result;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'QuotationService',
        method: 'generateDeliveryTerms'
      });
      console.error('[QUOTATION DELIVERY TERMS ERROR]', errorInfo.message);
    }

    return [
      `Site delivery and staging will be coordinated within ${timeline} following advance payment receipt.`,
      `All fragile materials, vitrified tiles, and fixtures are insured during transit and inspected upon arrival at site.`,
      `Riddha Interio technician team will handle complete unpacking, assembly, and debris cleanup upon completion.`
    ];
  }

  /**
   * 4. Executive Quotation Summary
   */
  async summarizeQuotation(items = [], grandTotal = 0, userId = null) {
    const prompt = `Summarize this interior design quotation totaling Rs. ${grandTotal}:
Items: ${JSON.stringify(items.map(i => ({ name: i.description, cost: i.totalAmount })))}

Return ONLY a valid JSON object:
{
  "executiveSummary": "1-paragraph summary of deliverables",
  "whatsIncluded": ["Item 1", "Item 2", "Item 3"],
  "whatsExcluded": ["Civil structural changes", "External electrical meter upgrades"],
  "nextSteps": "1-sentence call to action"
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 800
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'quotationSummary',
        userId,
        '/api/quotations/ai-enhance',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      if (result && result.executiveSummary) return result;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'QuotationService',
        method: 'summarizeQuotation'
      });
      console.error('[QUOTATION SUMMARY ERROR]', errorInfo.message);
    }

    return {
      executiveSummary: `This quotation covers a complete turn-key interior package totaling Rs. ${grandTotal.toLocaleString()}, incorporating premium materials, installation labor, and full GST compliance.`,
      whatsIncluded: [
        'Complete supply and installation of all listed furniture, lighting, and finishes',
        'Standard 1-year product & installation warranty',
        'On-site supervision and final cleanup'
      ],
      whatsExcluded: [
        'Major structural building alterations or masonry wall demolitions',
        'External municipal power meter upgrades'
      ],
      nextSteps: 'Please review the payment schedule below and click Accept Quotation to confirm your booking.'
    };
  }

  /**
   * 5. Personalized Closing Statement
   */
  async generateClosingMessage(data = {}, userId = null) {
    const { clientName = 'Client', contactPerson = 'Riddha Team' } = data;

    const prompt = `Generate a warm, professional closing message for an interior quotation:
Client Name: ${clientName}
Contact Person: ${contactPerson}

Return ONLY plain text string.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 300
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'quotationClosing',
        userId,
        '/api/quotations/ai-enhance',
        response.model
      );

      if (response.text && typeof response.text === 'string') return response.text.trim();
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'QuotationService',
        method: 'generateClosingMessage'
      });
      console.error('[QUOTATION CLOSING ERROR]', errorInfo.message);
    }

    return `We look forward to bringing your interior spaces to life! If you have any questions or require custom adjustments, please contact ${contactPerson} directly. Warm regards, Riddha Interio Mart Team.`;
  }
}

module.exports = new QuotationService();
