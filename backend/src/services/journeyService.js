const Order = require('../models/Order');
const Cart = require('../models/Cart');
const UserProfile = require('../models/UserProfile');
const UserQuizResult = require('../models/UserQuizResult');
const Project = require('../models/Project');
const Quotation = require('../models/Quotation');
const UserJourney = require('../models/UserJourney');
const {
  STAGES,
  SEQUENCES,
  FEATURES,
  getFeature,
  getFeaturesForPersona
} = require('../utils/journeyRegistry');

/**
 * Journey orchestration core (Requirement #17).
 *
 * Stage is *derived from real data* the other requirements already write
 * (orders, carts, quiz results, projects, quotations) rather than being a
 * separate counter that can drift out of sync.
 */

const personaFor = (user) => {
  if (!user) return 'customer';
  if (user.role === 'admin') return 'admin';
  if (user.role === 'seller') return 'seller';
  if (user.userType === 'enterpriser') return 'enterpriser';
  return 'customer';
};

/**
 * Gathers the cross-feature signals used for both stage inference and AI guidance.
 * All lookups are guarded so a missing/empty collection never breaks the journey.
 */
async function collectSignals(userId) {
  if (!userId) {
    return { hasQuiz: false, cartCount: 0, cartValue: 0, orderCount: 0, activeOrderCount: 0, deliveredOrderCount: 0, projectCount: 0, quotationCount: 0, cartItems: [] };
  }

  const safe = (p, fallback) => p.catch(() => fallback);

  const [quiz, cart, orders, projectCount, quotationCount] = await Promise.all([
    safe(UserQuizResult.findOne({ userId }).sort({ createdAt: -1 }).lean(), null),
    safe(Cart.findOne({ user: userId }).populate('items.product', 'name price').lean(), null),
    safe(Order.find({ user: userId }).select('status isDelivered totalPrice createdAt').lean(), []),
    safe(Project.countDocuments({ userId }), 0),
    safe(Quotation.countDocuments({ userId }), 0)
  ]);

  const cartLines = (cart?.items || []).filter((i) => i.product);
  const cartValue = cartLines.reduce((sum, i) => sum + ((i.product?.price || 0) * (i.quantity || 1)), 0);

  const deliveredOrderCount = orders.filter((o) => o.isDelivered || o.status === 'Delivered').length;
  const activeOrderCount = orders.filter(
    (o) => !o.isDelivered && !['Delivered', 'Cancelled'].includes(o.status)
  ).length;

  return {
    hasQuiz: Boolean(quiz),
    quizProfile: quiz?.designProfile || null,
    cartCount: cartLines.length,
    cartValue,
    cartItems: cartLines.map((i) => i.product?.name).filter(Boolean),
    orderCount: orders.length,
    activeOrderCount,
    deliveredOrderCount,
    projectCount,
    quotationCount
  };
}

/**
 * Derives the user's current journey stage from what they've actually done.
 * Ordered most-advanced-first so the furthest signal wins.
 */
function inferStage(signals, persona) {
  if (persona === 'seller' || persona === 'enterpriser') {
    if (signals.activeOrderCount > 0) return 'fulfillment';
    if (signals.quotationCount > 0) return 'decision';
    if (signals.projectCount > 0) return 'inspiration';
    return 'discovery';
  }

  if (signals.deliveredOrderCount > 0 && signals.activeOrderCount === 0) return 'post-purchase';
  if (signals.activeOrderCount > 0) return 'fulfillment';
  if (signals.cartCount > 0) return 'decision';
  if (signals.hasQuiz) return 'inspiration';
  return 'discovery';
}

/**
 * Which registry features has this user demonstrably engaged with?
 * Combines hard evidence (quiz taken, order placed) with recorded journey steps.
 */
function completedFeatureIds(signals, journey) {
  const done = new Set();
  if (signals.hasQuiz) done.add('req-4');
  if (signals.cartCount > 0) done.add('req-1');
  if (signals.orderCount > 0) done.add('req-13');
  if (signals.projectCount > 0) { done.add('req-8'); done.add('req-9'); }
  if (signals.quotationCount > 0) done.add('req-12');

  for (const step of journey?.stepsCompleted || []) {
    if (step.feature) done.add(step.feature);
  }
  return done;
}

/**
 * Deterministic "what next" from the persona's reference sequence — the floor
 * beneath the AI guidance layer, and what we serve when Gemini is unavailable.
 */
function nextFeatureFor(persona, done) {
  const sequence = SEQUENCES[persona] || SEQUENCES.customer;
  const nextId = sequence.find((id) => !done.has(id));
  return nextId ? getFeature(nextId) : null;
}

function computeProgress(persona, done) {
  const sequence = SEQUENCES[persona] || SEQUENCES.customer;
  if (!sequence.length) return 100;
  const hit = sequence.filter((id) => done.has(id)).length;
  return Math.round((hit / sequence.length) * 100);
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0 mins';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}${rem ? ` ${rem} mins` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Finds the user's live journey, or opens one. Anonymous users are keyed by
 * sessionId; on login the session's journey is claimed by the user id so
 * pre-auth activity isn't lost.
 */
async function getOrCreateJourney({ userId, sessionId, persona, device, referrer }) {
  if (!sessionId && !userId) return null;

  let journey = null;

  if (userId) {
    journey = await UserJourney.findOne({ user: userId, status: 'in-progress' }).sort({ createdAt: -1 });
  }
  if (!journey && sessionId) {
    journey = await UserJourney.findOne({ sessionId, status: 'in-progress' }).sort({ createdAt: -1 });
    // Claim an anonymous journey once the visitor logs in.
    if (journey && userId && !journey.user) {
      journey.user = userId;
    }
  }

  if (!journey) {
    journey = new UserJourney({
      user: userId || null,
      sessionId: sessionId || `user-${userId}`,
      persona: persona || 'customer',
      device: device || 'desktop',
      referrer: referrer || ''
    });
  }

  if (persona) journey.persona = persona;
  return journey;
}

/**
 * Full journey status for a user — the payload behind /api/journey/user-status.
 */
async function buildStatus({ user, sessionId, device, referrer }) {
  const userId = user?._id || null;
  const persona = personaFor(user);

  const [signals, profile] = await Promise.all([
    collectSignals(userId),
    userId ? UserProfile.findOne({ userId }).lean().catch(() => null) : null
  ]);

  const journey = await getOrCreateJourney({ userId, sessionId, persona, device, referrer });
  const stage = inferStage(signals, persona);

  if (journey) {
    journey.currentStage = stage;
    journey.lastActiveAt = new Date();
    await journey.save().catch(() => {});
  }

  const done = completedFeatureIds(signals, journey);
  const sequence = SEQUENCES[persona] || SEQUENCES.customer;

  const steps = sequence.map((id) => {
    const feature = getFeature(id);
    return {
      featureId: id,
      label: feature?.label || id,
      route: feature?.route || '/',
      stage: feature?.stage,
      completed: done.has(id)
    };
  });

  const nextFeature = nextFeatureFor(persona, done);
  const startedAt = journey?.startedAt || new Date();

  return {
    journeyId: journey?._id || null,
    persona,
    stage,
    stages: STAGES,
    progress: computeProgress(persona, done),
    steps,
    completedSteps: steps.filter((s) => s.completed),
    nextStep: nextFeature
      ? { featureId: nextFeature.id, label: nextFeature.label, route: nextFeature.route, blurb: nextFeature.blurb }
      : null,
    timeInJourney: formatDuration(Date.now() - new Date(startedAt).getTime()),
    signals: {
      hasQuiz: signals.hasQuiz,
      cartCount: signals.cartCount,
      cartValue: signals.cartValue,
      orderCount: signals.orderCount,
      activeOrderCount: signals.activeOrderCount,
      projectCount: signals.projectCount,
      quotationCount: signals.quotationCount
    },
    profile: profile
      ? { stylePreferences: profile.stylePreferences || [], budgetRange: profile.budgetRange || {} }
      : { stylePreferences: [], budgetRange: {} }
  };
}

/**
 * Features worth surfacing to this persona right now — the ones they haven't
 * used yet, nearest to their current stage first.
 */
function recommendFeatures(persona, done, stage, limit = 3) {
  const stageOrder = STAGES.indexOf(stage);
  return getFeaturesForPersona(persona)
    .filter((f) => !done.has(f.id))
    .map((f) => ({ ...f, distance: Math.abs(STAGES.indexOf(f.stage) - stageOrder) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ distance, ...f }) => f);
}

module.exports = {
  personaFor,
  collectSignals,
  inferStage,
  completedFeatureIds,
  nextFeatureFor,
  computeProgress,
  formatDuration,
  getOrCreateJourney,
  buildStatus,
  recommendFeatures,
  FEATURES
};
