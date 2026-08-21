const crypto = require('crypto');
const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const cacheService = require('./cacheService');
const { FALLBACKS } = require('../utils/geminiErrorHandler');
const { FEATURES, getFeaturesForPersona } = require('../utils/journeyRegistry');

// Journey guidance is a UI enhancement sitting in front of a deterministic
// next-step calculation, so a slow model answer is worse than an instant
// fallback. OpenAI here typically takes 5-20s — far past the sub-2s budget the
// journey UI needs — so we use stale-while-revalidate: give the caller the
// deterministic answer immediately and let the model warm the cache for the
// next view. Callers therefore see fast responses always, and AI-quality
// guidance from the second request onward.
const GUIDANCE_WAIT_MS = Number(process.env.JOURNEY_GUIDANCE_WAIT_MS || 1200);
const GUIDANCE_TTL_SECONDS = 300;
const HELP_TTL_SECONDS = 900;

/**
 * OpenAI-backed journey guidance (Requirement #17).
 *
 * Every method degrades to a deterministic fallback so the journey UI keeps
 * working when OPENAI_API_KEY is unset, the API is slow, or it is unavailable —
 * guidance is an enhancement, never a hard dependency.
 */
class JourneyService {
  /** Compact catalogue of features the given persona is allowed to be pointed at. */
  _featureMenu(persona, exclude = []) {
    return getFeaturesForPersona(persona)
      .filter((f) => !exclude.includes(f.id))
      .map((f) => ({
        id: f.id,
        name: f.label,
        whatItDoes: f.blurb,
        stage: f.stage
      }));
  }

  _cacheKey(kind, parts) {
    const hash = crypto.createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 16);
    return `journey:${kind}:${hash}`;
  }

  /**
   * Stale-while-revalidate around an OpenAI call.
   *
   * Returns the cached value if present. Otherwise waits only a short beat for
   * the model; if it hasn't answered by then the request returns null (the
   * caller serves its deterministic fallback) while the call continues in the
   * background and populates the cache for subsequent requests.
   *
   * 	ransform shapes/validates the raw model output before it is cached.
   */
  async _cachedOrBackfill({ cacheKey, buildCall, transform, ttl, label }) {
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Collapse concurrent misses onto a single in-flight model call.
    if (!this._inflight) this._inflight = new Map();
    let call = this._inflight.get(cacheKey);

    if (!call) {
      call = buildCall()
        .then((raw) => {
          const shaped = transform(raw);
          if (shaped) cacheService.set(cacheKey, shaped, ttl);
          return shaped;
        })
        .catch((err) => {
          console.warn(`[JOURNEY] ${label} failed: ${err.message}`);
          return null;
        })
        .finally(() => this._inflight.delete(cacheKey));

      this._inflight.set(cacheKey, call);
    }

    let timer;
    const wait = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), GUIDANCE_WAIT_MS);
    });

    try {
      // Whoever finishes first wins; a late model answer still lands in the cache.
      return await Promise.race([call, wait]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * OPENAI PROMPT 1 — Next step guidance.
   * Decides where the user is and what they should do next.
   */
  async getNextStepGuidance(context = {}) {
    const {
      persona = 'customer',
      stage = 'discovery',
      currentPage = '/',
      recentSteps = [],
      profile = {},
      signals = {},
      device = 'desktop',
      completedFeatures = [],
      userId = null
    } = context;

    const cacheKey = this._cacheKey('guidance', { persona, stage, currentPage, completedFeatures, cart: signals.cartCount ?? 0 });

    const prompt = 
You are guiding a shopper on an Indian interior design & building-materials marketplace.

User context:
- Persona: 
- Detected journey stage: 
- Current page: 
- Device: 
- Recent actions: 
- Style preferences: 
- Budget range: ₹ - ₹
- Has completed design quiz: 
- Items in cart: 
- Past orders: 
- Active projects: 

- Features they have ALREADY used (never suggest these again): 

Features you may point them to (use the exact id):


Decide the single most useful next step. Prioritise the user's own goal, not our
feature list. If they are mid-purchase, do not distract them with exploration
features. Be helpful, never pushy.

Respond ONLY with JSON:
{
  "currentStage": "discovery|inspiration|decision|purchase|fulfillment|post-purchase",
  "nextRecommendedStep": "one short sentence telling them what to do",
  "suggestedFeature": "req-N or null",
  "suggestedCTA": "2-4 word button label",
  "helpMessage": "one friendly supporting sentence",
  "urgency": "low|medium|high"
}
;

    const fallback = { ...FALLBACKS.journeyGuidance, currentStage: stage, suggestedFeature: null };

    try {
      const guidance = await this._cachedOrBackfill({
        cacheKey,
        buildCall: async () => {
          const response = await openaiClient.generateText(prompt, {
            modelType: 'general',
            expectJson: true,
            temperature: 0.7,
            maxTokens: 500
          });

          await OpenAIUsageTracker.trackUsage(
            {
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              totalTokens: response.totalTokens,
            },
            'journeyGuidance',
            userId,
            '/api/journey/next-suggestion',
            response.model
          );

          return JSON.parse(response.text);
        },
        transform: (raw) => (raw ? this._sanitizeGuidance(raw, persona, stage, completedFeatures) : null),
        ttl: GUIDANCE_TTL_SECONDS,
        label: 'next-step guidance'
      });

      return guidance || fallback;
    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'JourneyService',
        method: 'getNextStepGuidance'
      });
      console.error('[JOURNEY GUIDANCE ERROR]', errorInfo.message);
      return fallback;
    }
  }

  /**
   * OPENAI PROMPT 2 — Contextual help for the page the user is on.
   */
  async getContextualHelp(context = {}) {
    const {
      page = '/',
      issue = '',
      persona = 'customer',
      stage = 'discovery',
      userId = null
    } = context;

    const cacheKey = this._cacheKey('help', { page, issue, persona, stage });

    const prompt = 
A user on an interior design marketplace needs help.

- Page they are on: 
- Persona: 
- Journey stage: 
- What they said is wrong / what they're trying to do: 

Available features (use the exact id if you reference one):


Write concise, friendly, practical help. No marketing language.

Respond ONLY with JSON:
{
  "help": "1-2 sentence explanation",
  "steps": ["short step", "short step", "short step"],
  "suggestedFeature": "req-N or null"
}
;

    try {
      const help = await this._cachedOrBackfill({
        cacheKey,
        buildCall: async () => {
          const response = await openaiClient.generateText(prompt, {
            modelType: 'general',
            expectJson: true,
            temperature: 0.7,
            maxTokens: 400
          });

          await OpenAIUsageTracker.trackUsage(
            {
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              totalTokens: response.totalTokens,
            },
            'journeyContextHelp',
            userId,
            '/api/journey/context-help',
            response.model
          );

          return JSON.parse(response.text);
        },
        transform: (raw) => {
          if (!raw) return null;
          const feature = FEATURES[raw?.suggestedFeature] || null;
          return {
            help: raw?.help || FALLBACKS.journeyContextHelp.help,
            steps: Array.isArray(raw?.steps) ? raw.steps.slice(0, 5) : FALLBACKS.journeyContextHelp.steps,
            suggestedFeature: feature ? { ...feature } : null
          };
        },
        ttl: HELP_TTL_SECONDS,
        label: 'contextual help'
      });

      return help || { ...FALLBACKS.journeyContextHelp };
    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'JourneyService',
        method: 'getContextualHelp'
      });
      console.error('[JOURNEY HELP ERROR]', errorInfo.message);
      return { ...FALLBACKS.journeyContextHelp };
    }
  }

  /**
   * OPENAI PROMPT 3 — Intelligent upsell / cross-sell, but only when it genuinely fits.
   */
  async getIntelligentSuggestion(context = {}) {
    const {
      persona = 'customer',
      stage = 'discovery',
      profile = {},
      cartItems = [],
      signals = {},
      userId = null
    } = context;

    // Nothing in the cart means nothing to complement — skip the model entirely.
    if (!cartItems.length) return { ...FALLBACKS.journeyUpsell };

    const cacheKey = this._cacheKey('upsell', { persona, stage, cartItems, cartValue: signals.cartValue ?? 0 });

    const prompt = 
Decide whether to make ONE additional suggestion to a shopper. It is completely
acceptable — and often correct — to suggest nothing.

- Persona: 
- Journey stage: 
- Style preferences: 
- Budget range: ₹ - ₹
- Items currently in cart: 
- Cart value: ₹
- Past orders: 

Only suggest if there is a genuine fit (a true complement, a worthwhile upgrade,
a bundle that saves money, or design help they'd clearly benefit from).
Do not invent products. Do not upsell someone with an empty cart.

Respond ONLY with JSON:
{
  "shouldSuggest": true or false,
  "suggestion": "what to suggest, one sentence",
  "reasoning": "why this genuinely fits them",
  "cta": "2-4 word button label"
}
;

    try {
      const suggestion = await this._cachedOrBackfill({
        cacheKey,
        buildCall: async () => {
          const response = await openaiClient.generateText(prompt, {
            modelType: 'general',
            expectJson: true,
            temperature: 0.7,
            maxTokens: 400
          });

          await OpenAIUsageTracker.trackUsage(
            {
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              totalTokens: response.totalTokens,
            },
            'journeyUpsell',
            userId,
            '/api/journey/next-suggestion',
            response.model
          );

          return JSON.parse(response.text);
        },
        transform: (raw) => (raw ? {
          shouldSuggest: Boolean(raw?.shouldSuggest),
          suggestion: raw?.suggestion || '',
          reasoning: raw?.reasoning || '',
          cta: raw?.cta || 'View suggestion'
        } : null),
        ttl: 180,
        label: 'intelligent upsell'
      });

      return suggestion || { ...FALLBACKS.journeyUpsell };
    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'JourneyService',
        method: 'getIntelligentSuggestion'
      });
      console.error('[JOURNEY UPSELL ERROR]', errorInfo.message);
      return { ...FALLBACKS.journeyUpsell };
    }
  }

  /**
   * Guards against the model inventing feature ids/stages, pointing a persona at
   * a feature they can't use, or re-suggesting something already completed.
   */
  _sanitizeGuidance(result, persona, fallbackStage, completedFeatures = []) {
    const validStages = ['discovery', 'inspiration', 'decision', 'purchase', 'fulfillment', 'post-purchase'];
    const feature = FEATURES[result?.suggestedFeature];
    const usable = feature
      && feature.personas.includes(persona)
      && !completedFeatures.includes(feature.id);

    return {
      currentStage: validStages.includes(result?.currentStage) ? result.currentStage : fallbackStage,
      nextRecommendedStep: result?.nextRecommendedStep || FALLBACKS.journeyGuidance.nextRecommendedStep,
      suggestedFeature: usable ? { ...feature } : null,
      suggestedCTA: result?.suggestedCTA || FALLBACKS.journeyGuidance.suggestedCTA,
      helpMessage: result?.helpMessage || FALLBACKS.journeyGuidance.helpMessage,
      urgency: ['low', 'medium', 'high'].includes(result?.urgency) ? result.urgency : 'low'
    };
  }
}

module.exports = new JourneyService();
