const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const { RFQ_UNITS } = require('../models/RFQ');

/**
 * Requirement A — AI for the RFQ workflow.
 *
 * Three prompts:
 *   1. parseRFQInput          free text / extracted file text -> structured lines
 *   2. draftQuoteCoverNote    seller-facing quotation cover note
 *   3. generateClarifications questions that resolve parsing ambiguities
 *
 * Plus suggestShadeAlternates, used by the post-sample follow-up.
 *
 * Every method degrades to a deterministic fallback so the RFQ flow keeps
 * working when the AI provider is unreachable or unconfigured. Nothing here
 * ever invents a quantity: the fallback parser only reports numbers it read.
 */

const UNIT_ALIASES = {
  'sq.ft': ['sq.ft', 'sqft', 'sq ft', 'sq. ft', 'square feet', 'square foot', 'sft'],
  'sq.m': ['sq.m', 'sqm', 'sq m', 'sq. m', 'square metre', 'square meter', 'square metres', 'square meters'],
  'pcs': ['pcs', 'pc', 'piece', 'pieces'],
  'nos': ['nos', 'no.', 'number', 'numbers', 'unit', 'units'],
  'kg': ['kg', 'kgs', 'kilogram', 'kilograms', 'kilo'],
  'box': ['box', 'boxes', 'ctn', 'carton', 'cartons'],
  'rft': ['rft', 'r.ft', 'running ft', 'running feet', 'running foot', 'rmt', 'running metre', 'running meter'],
  'set': ['set', 'sets']
};

/** Longest alias first so "sq ft" is not shadowed by a shorter alias. */
const UNIT_LOOKUP = Object.entries(UNIT_ALIASES)
  .flatMap(([canonical, aliases]) => aliases.map((alias) => ({ canonical, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

const normalizeUnit = (raw) => {
  if (!raw) return null;
  const needle = String(raw).toLowerCase().trim().replace(/\s+/g, ' ');
  if (!needle) return null;
  const exact = UNIT_LOOKUP.find((u) => u.alias === needle);
  if (exact) return exact.canonical;
  const contained = UNIT_LOOKUP.find((u) => needle.includes(u.alias));
  return contained ? contained.canonical : null;
};

const CONFIDENCE = ['high', 'medium', 'low'];
const normalizeConfidence = (raw) => (CONFIDENCE.includes(String(raw).toLowerCase()) ? String(raw).toLowerCase() : 'low');

const stripCodeFences = (text) => String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[, ]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

class RFQAiService {
  // ---------------------------------------------------------------------------
  // Prompt 1 — parse free text / uploaded RFQ into structured line items
  // ---------------------------------------------------------------------------
  async parseRFQInput({ rawInput = '', fileSummary = '' } = {}, userId = null) {
    const prompt = `Extract structured product line items from this customer request.

Raw input: ${rawInput || '(none)'}
Attached file summary: ${fileSummary || '(none)'}

For each line item extract:
- productDescription (as written by customer)
- quantity (number)
- unit (${RFQ_UNITS.join('|')})
- size/dimensions (if mentioned, e.g., "600x600")
- finish/grade (if mentioned)
- brandPreference (if mentioned)
- application (e.g., "office washroom", "reception")
- confidence (high|medium|low)

Return strict JSON:
{ "lineItems": [{ "productDescription": "", "quantity": 0, "unit": "", "size": "", "finish": "", "brandPreference": "", "application": "", "confidence": "" }],
  "deliveryLocation": "", "requiredDate": "",
  "specialRequirements": "", "ambiguities": ["what needs clarification"] }

Never invent quantities. If a quantity is unclear mark confidence low and list it under ambiguities.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'reasoning',
        expectJson: true,
        temperature: 0.2,
        maxTokens: 2000
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens
        },
        'rfqParse',
        userId,
        '/api/rfq/parse',
        response.model
      );

      const parsed = JSON.parse(stripCodeFences(response.text));
      return this.sanitizeParsedRFQ(parsed, { rawInput, aiUsed: true });
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'RFQAiService',
        method: 'parseRFQInput'
      });
      console.error('[RFQ PARSE ERROR]', errorInfo.message);
      return this.fallbackParse({ rawInput, fileSummary });
    }
  }

  /**
   * Coerce a model response into the RFQ line-item shape. Anything the model
   * got wrong (bad unit, missing/zero quantity) is downgraded to low confidence
   * and surfaced as an ambiguity rather than silently corrected.
   */
  sanitizeParsedRFQ(parsed, { rawInput = '', aiUsed = false } = {}) {
    const ambiguities = Array.isArray(parsed && parsed.ambiguities)
      ? parsed.ambiguities.filter((a) => typeof a === 'string' && a.trim()).map((a) => a.trim())
      : [];

    const rawLines = Array.isArray(parsed && parsed.lineItems) ? parsed.lineItems : [];
    const lineItems = rawLines.slice(0, 50).map((line, index) => {
      const description = String((line && line.productDescription) || '').trim() || `Line item ${index + 1}`;
      const quantity = toNumber(line && line.quantity);
      const unit = normalizeUnit(line && line.unit);
      let confidence = normalizeConfidence(line && line.confidence);

      if (quantity === null) {
        confidence = 'low';
        ambiguities.push(`No usable quantity found for "${description}" - please confirm the quantity.`);
      }
      if (!unit) {
        confidence = confidence === 'high' ? 'medium' : confidence;
        ambiguities.push(`Unit of measure unclear for "${description}" - please confirm (${RFQ_UNITS.join(', ')}).`);
      }

      return {
        productDescription: description,
        // Left null when unreadable - the customer must fill it in. Never guessed.
        quantity,
        unit: unit || null,
        size: String((line && (line.size || line.dimensions)) || '').trim(),
        finish: String((line && (line.finish || line.grade)) || '').trim(),
        brandPreference: String((line && line.brandPreference) || '').trim(),
        application: String((line && line.application) || '').trim(),
        matchConfidence: confidence
      };
    });

    return {
      lineItems,
      deliveryLocation: String((parsed && parsed.deliveryLocation) || '').trim(),
      requiredDate: String((parsed && parsed.requiredDate) || '').trim(),
      specialRequirements: String((parsed && parsed.specialRequirements) || '').trim(),
      ambiguities: [...new Set(ambiguities)],
      aiUsed,
      rawInput
    };
  }

  /**
   * Deterministic line parser used when the AI provider is unavailable.
   * Reads one line item per input line, e.g.
   *   "2000 sq.ft Kajaria vitrified tile 600x600 matt finish - office washroom"
   * Only quantities actually present in the text are reported.
   */
  fallbackParse({ rawInput = '', fileSummary = '' } = {}) {
    const source = [rawInput, fileSummary].filter(Boolean).join('\n');
    const lines = source
      .split(/\r?\n|;\s*/)
      .map((l) => l.replace(/^[\s*\-•]+/, '').trim())
      .filter((l) => l.length > 2)
      .slice(0, 50);

    const ambiguities = [];
    const lineItems = lines.map((line, index) => {
      // Matches a leading or embedded "<number> <unit>" pair, e.g. "2000 sq.ft".
      const qtyMatch = line.match(/(\d+(?:[.,]\d+)?)\s*([A-Za-z.]+(?:\s+(?:ft|feet|foot|m|metre|meter|metres|meters))?)/);
      const quantity = qtyMatch ? toNumber(qtyMatch[1]) : null;
      const unit = qtyMatch ? normalizeUnit(qtyMatch[2]) : null;

      const sizeMatch = line.match(/\b(\d{2,4}\s*[xX]\s*\d{2,4}(?:\s*[xX]\s*\d{1,4})?)\b/);
      const finishMatch = line.match(/\b(matt|matte|glossy|gloss|satin|polished|honed|leathered|textured|rustic|anti[- ]skid)\b/i);

      const description = (unit ? line.replace(qtyMatch[0], ' ') : line)
        .replace(/^[\s\-:,.]+|[\s\-:,.]+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim() || `Line item ${index + 1}`;

      if (quantity === null) {
        ambiguities.push(`No usable quantity found for "${description}" - please confirm the quantity.`);
      }
      if (!unit) {
        ambiguities.push(`Unit of measure unclear for "${description}" - please confirm (${RFQ_UNITS.join(', ')}).`);
      }

      return {
        productDescription: description,
        quantity,
        unit,
        size: sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '',
        finish: finishMatch ? finishMatch[1] : '',
        brandPreference: '',
        application: '',
        // Never "high": this parser has no semantic understanding of the text.
        matchConfidence: quantity !== null && unit ? 'medium' : 'low'
      };
    });

    return {
      lineItems,
      deliveryLocation: '',
      requiredDate: '',
      specialRequirements: '',
      ambiguities: [
        ...new Set([
          'AI parsing was unavailable - these lines were read with a basic text parser. Please review every line before submitting.',
          ...ambiguities
        ])
      ],
      aiUsed: false,
      rawInput
    };
  }

  // ---------------------------------------------------------------------------
  // Prompt 2 — draft the quote reply for the seller
  // ---------------------------------------------------------------------------
  async draftQuoteCoverNote(data = {}, userId = null) {
    const {
      customerName = 'Customer',
      companyName = '',
      projectName = '',
      lineItems = [],
      deliveryLocation = '',
      requiredDate = '',
      quotedTotal = 0,
      leadTimeDays = 14
    } = data;

    const itemLines = lineItems
      .map((i) => `- ${i.productDescription}: ${i.quantity === null || i.quantity === undefined ? '?' : i.quantity} ${i.unit || ''}`.trim())
      .join('\n');

    const prompt = `Draft a professional quotation cover note for this RFQ.

Customer: ${customerName}, Company: ${companyName || 'N/A'}, Project: ${projectName || 'N/A'}
Line items:
${itemLines || '- (not specified)'}
Delivery: ${deliveryLocation || 'N/A'}, Required by: ${requiredDate || 'N/A'}
Quoted total: Rs. ${quotedTotal}
Lead time: ${leadTimeDays} days

Write 3-4 sentences that:
1. Acknowledge the specific project and quantity
2. Confirm availability and lead time
3. Note any substitutions or alternatives offered
4. Give a clear next step

Professional B2B tone. No fluff. No emojis. Return plain text only.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.6,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens
        },
        'rfqQuoteCoverNote',
        userId,
        '/api/rfq/:rfqId/quote',
        response.model
      );

      const text = String(response.text || '').trim();
      if (text) return text;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'RFQAiService',
        method: 'draftQuoteCoverNote'
      });
      console.error('[RFQ QUOTE NOTE ERROR]', errorInfo.message);
    }

    const totalQty = lineItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const scope = lineItems.length === 1
      ? `${lineItems[0].quantity || ''} ${lineItems[0].unit || ''} of ${lineItems[0].productDescription}`.trim()
      : `${lineItems.length} line items totalling ${totalQty} units`;

    return `Thank you for your enquiry${projectName ? ` for ${projectName}` : ''}. We have reviewed your requirement for ${scope} and can confirm availability against a lead time of ${leadTimeDays} days from order confirmation${deliveryLocation ? ` to ${deliveryLocation}` : ''}. Our quoted value is Rs. ${quotedTotal} against the specifications listed; where an exact match was unavailable we have proposed the closest equivalent grade on that line. Please review the attached quotation and confirm acceptance${requiredDate ? `, so we can align dispatch with your ${requiredDate} site requirement` : ''}.`;
  }

  // ---------------------------------------------------------------------------
  // Prompt 3 — clarification questions
  // ---------------------------------------------------------------------------
  async generateClarifications({ ambiguities = [], providedFields = {} } = {}, userId = null) {
    const list = ambiguities.filter(Boolean);
    if (list.length === 0) return [];

    const prompt = `This RFQ has ambiguities: ${JSON.stringify(list)}
Information already provided by the customer: ${JSON.stringify(providedFields)}

Generate up to 4 short, specific clarification questions to send the customer.
Each question must be answerable in one line. Do not ask for information already provided.

Return strict JSON: { "questions": ["...", "..."] }`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.4,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens
        },
        'rfqClarifications',
        userId,
        '/api/rfq/parse',
        response.model
      );

      const parsed = JSON.parse(stripCodeFences(response.text));
      const questions = Array.isArray(parsed && parsed.questions) ? parsed.questions : [];
      const cleaned = questions
        .filter((q) => typeof q === 'string' && q.trim())
        .map((q) => q.trim())
        .slice(0, 4);
      if (cleaned.length) return cleaned;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'RFQAiService',
        method: 'generateClarifications'
      });
      console.error('[RFQ CLARIFICATION ERROR]', errorInfo.message);
    }

    // Fallback: each ambiguity is already phrased as a request to confirm.
    return list.slice(0, 4).map((a) => (a.endsWith('?') ? a : `${a.replace(/\.$/, '')}?`));
  }

  // ---------------------------------------------------------------------------
  // Post-sample follow-up — closest shade alternates
  // ---------------------------------------------------------------------------
  async suggestShadeAlternates({ product = {}, candidates = [] } = {}, userId = null) {
    if (candidates.length === 0) return [];

    const prompt = `A customer received a material sample and asked for a different shade.

Sampled product: ${product.name || 'N/A'} (colour: ${product.color || 'N/A'}, material: ${product.material || 'N/A'})

Catalogue candidates:
${candidates.map((c) => `- id=${c._id} | ${c.name} | colour: ${c.color || 'N/A'} | material: ${c.material || 'N/A'}`).join('\n')}

Pick the 3 closest alternates in shade and material. Only use ids from the list above.
Return strict JSON: { "alternates": [{ "id": "", "reason": "one short sentence" }] }`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.4,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens
        },
        'sampleShadeAlternates',
        userId,
        '/api/samples/:id/feedback',
        response.model
      );

      const parsed = JSON.parse(stripCodeFences(response.text));
      const byId = new Map(candidates.map((c) => [String(c._id), c]));
      const alternates = (Array.isArray(parsed && parsed.alternates) ? parsed.alternates : [])
        .filter((a) => a && byId.has(String(a.id)))
        .slice(0, 3)
        .map((a) => {
          const match = byId.get(String(a.id));
          return { productId: match._id, name: match.name, reason: String(a.reason || '').trim() };
        });
      if (alternates.length) return alternates;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'RFQAiService',
        method: 'suggestShadeAlternates'
      });
      console.error('[SAMPLE ALTERNATE ERROR]', errorInfo.message);
    }

    return candidates.slice(0, 3).map((c) => ({
      productId: c._id,
      name: c.name,
      reason: `Same ${c.material || 'material'} range as the sample you received.`
    }));
  }
}

const service = new RFQAiService();
service.normalizeUnit = normalizeUnit;

module.exports = service;
