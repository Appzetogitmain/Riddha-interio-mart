const crypto = require('crypto');
const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const cacheService = require('./cacheService');
const { FALLBACKS } = require('../utils/fallbacks');
const { FEATURES, SEQUENCES, getFeature, getFeaturesForPersona } = require('../utils/journeyRegistry');

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
  /**
   * Plain (non-AI) journey bookkeeping — persona detection, session lookup/creation,
   * signal collection, and deterministic next-step recommendation. These carry the
   * journey feature whether or not OpenAI is configured; the three AI-backed methods
   * below only ever enrich what these compute.
   */

  /** Maps an authenticated req.user (User/Seller/Admin doc) onto a journey persona. */
  personaFor(user) {
    if (!user) return 'customer';
    if (user.role === 'admin') return 'admin';
    if (user.role === 'seller') return 'seller';
    if (user.userType === 'enterpriser') return 'enterpriser';
    return 'customer';
  }

  /** Gathers the lightweight behavioural signals the guidance prompts and stage inference rely on. */
  async collectSignals(userId) {
    const empty = { cartCount: 0, cartItems: [], cartValue: 0, hasQuiz: false, orderCount: 0, projectCount: 0 };
    if (!userId) return empty;

    try {
      const Cart = require('../models/Cart');
      const Order = require('../models/Order');
      const UserQuizResult = require('../models/UserQuizResult');
      const Project = require('../models/Project');

      const [cart, quizCount, orderCount, projectCount] = await Promise.all([
        Cart.findOne({ user: userId }).populate('items.product', 'name price').lean().catch(() => null),
        UserQuizResult.countDocuments({ userId }).catch(() => 0),
        Order.countDocuments({ user: userId }).catch(() => 0),
        Project.countDocuments({ userId }).catch(() => 0)
      ]);

      const items = cart?.items || [];
      return {
        cartCount: items.length,
        cartItems: items.map((i) => i.product?.name).filter(Boolean),
        cartValue: items.reduce((sum, i) => sum + (Number(i.product?.price) || 0) * (i.quantity || 0), 0),
        hasQuiz: quizCount > 0,
        orderCount,
        projectCount
      };
    } catch (err) {
      console.warn('[JOURNEY] collectSignals failed:', err.message);
      return empty;
    }
  }

  /** Feature ids the user has already completed, from journey history plus behavioural signals. */
  completedFeatureIds(signals = {}, journeyDoc = null) {
    const ids = new Set();
    (journeyDoc?.stepsCompleted || []).forEach((s) => { if (s.feature) ids.add(s.feature); });
    if (signals.hasQuiz) ids.add('req-4');
    if (signals.orderCount > 0) ids.add('req-13');
    if (signals.projectCount > 0) ids.add('req-9');
    return ids;
  }

  /** Deterministic stage guess for personas/sessions with no journey document yet. */
  inferStage(signals = {}, persona = 'customer') {
    if (signals.orderCount > 0) return 'post-purchase';
    if (signals.cartCount > 0) return 'purchase';
    if (signals.hasQuiz || signals.projectCount > 0) return 'decision';
    return persona === 'admin' ? 'discovery' : 'discovery';
  }

  /** Deterministic ordering of not-yet-completed features — the guaranteed floor AI guidance enriches. */
  recommendFeatures(persona, done, stage, limit = 5) {
    const doneSet = done instanceof Set ? done : new Set(done || []);
    const sequence = (SEQUENCES[persona] || []).map((id) => getFeature(id)).filter(Boolean).filter((f) => !doneSet.has(f.id));

    if (sequence.length >= limit) return sequence.slice(0, limit);

    const extras = getFeaturesForPersona(persona).filter((f) => !doneSet.has(f.id) && !sequence.includes(f));
    return [...sequence, ...extras].slice(0, limit);
  }

  formatDuration(ms) {
    if (!ms || ms <= 0) return '0m';
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  /** Finds the caller's in-progress journey (by user or session), creating one if none exists. */
  async getOrCreateJourney({ userId, sessionId, persona, device, referrer }) {
    const UserJourney = require('../models/UserJourney');
    const query = userId ? { user: userId, status: 'in-progress' } : { sessionId, status: 'in-progress' };

    let journey = await UserJourney.findOne(query).sort({ createdAt: -1 });

    if (!journey) {
      journey = await UserJourney.create({
        user: userId || null,
        sessionId: sessionId || `user_${userId}`,
        persona,
        device,
        referrer
      });
    } else if (userId && !journey.user) {
      // Anonymous session just logged in — attach it to the account going forward.
      journey.user = userId;
      await journey.save();
    }

    return journey;
  }

  /** Consolidated "where is this visitor, and what's next" snapshot used by status/suggestion endpoints. */
  async buildStatus({ user, sessionId, device, referrer }) {
    const UserJourney = require('../models/UserJourney');
    const UserProfile = require('../models/UserProfile');

    const userId = user?._id || null;
    const persona = this.personaFor(user);
    const signals = await this.collectSignals(userId);
    const inferredStage = this.inferStage(signals, persona);

    const query = userId ? { user: userId, status: 'in-progress' } : (sessionId ? { sessionId, status: 'in-progress' } : null);
    const journey = query ? await UserJourney.findOne(query).sort({ createdAt: -1 }).lean().catch(() => null) : null;

    const profile = userId ? await UserProfile.findOne({ userId }).lean().catch(() => null) : null;

    const completed = this.completedFeatureIds(signals, journey);
    const stage = journey?.currentStage || inferredStage;
    const [nextFeature] = this.recommendFeatures(persona, completed, stage, 1);

    return {
      journeyId: journey?._id || null,
      persona,
      stage,
      profile: profile || {},
      nextStep: nextFeature ? { featureId: nextFeature.id, label: nextFeature.label, route: nextFeature.route } : null
    };
  }

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

    const prompt = `
You are guiding a shopper on an Indian interior design & building-materials marketplace.

User context:
- Persona: ${persona}
- Detected journey stage: ${stage}
- Current page: ${currentPage}
- Device: ${device}
- Recent actions: ${recentSteps.length ? recentSteps.join(', ') : 'none yet'}
- Style preferences: ${(profile.stylePreferences || []).join(', ') || 'unknown'}
- Budget range: ₹${profile.budgetRange?.min ?? 0} - ₹${profile.budgetRange?.max ?? 'open'}
- Has completed design quiz: ${signals.hasQuiz ? 'yes' : 'no'}
- Items in cart: ${signals.cartCount ?? 0}
- Past orders: ${signals.orderCount ?? 0}
- Active projects: ${signals.projectCount ?? 0}

- Features they have ALREADY used (never suggest these again): ${completedFeatures.length ? completedFeatures.join(', ') : 'none'}

Features you may point them to (use the exact id):
${JSON.stringify(this._featureMenu(persona, completedFeatures), null, 2)}

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
`;

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

    const prompt = `
A user on an interior design marketplace needs help.

- Page they are on: ${page}
- Persona: ${persona}
- Journey stage: ${stage}
- What they said is wrong / what they're trying to do: ${issue || 'not specified'}

Available features (use the exact id if you reference one):
${JSON.stringify(this._featureMenu(persona), null, 2)}

Write concise, friendly, practical help. No marketing language.

Respond ONLY with JSON:
{
  "help": "1-2 sentence explanation",
  "steps": ["short step", "short step", "short step"],
  "suggestedFeature": "req-N or null"
}
`;

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

    const prompt = `
Decide whether to make ONE additional suggestion to a shopper. It is completely
acceptable — and often correct — to suggest nothing.

- Persona: ${persona}
- Journey stage: ${stage}
- Style preferences: ${(profile.stylePreferences || []).join(', ') || 'unknown'}
- Budget range: ₹${profile.budgetRange?.min ?? 0} - ₹${profile.budgetRange?.max ?? 'open'}
- Items currently in cart: ${cartItems.length ? cartItems.join(', ') : 'empty'}
- Cart value: ₹${signals.cartValue ?? 0}
- Past orders: ${signals.orderCount ?? 0}

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
`;

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
