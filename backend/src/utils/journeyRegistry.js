/**
 * Canonical registry of every user-facing feature built across Requirements #1-#16.
 *
 * This is the single source of truth the journey orchestrator uses to decide
 * "where is the user, and what should they do next". Keeping it declarative here
 * (rather than hardcoding feature names across controllers/components) means adding
 * a future requirement is a one-entry change.
 */

// Journey stages, in the order a customer normally moves through them.
const STAGES = ['discovery', 'inspiration', 'decision', 'purchase', 'fulfillment', 'post-purchase'];

// Personas that see different journeys.
const PERSONAS = ['customer', 'enterpriser', 'seller', 'admin'];

const FEATURES = {
  'req-1': {
    id: 'req-1',
    label: 'Smart Bundles',
    blurb: 'Curated product sets at a bundled discount.',
    route: '/bundles',
    stage: 'decision',
    personas: ['customer', 'enterpriser'],
    icon: 'zap'
  },
  'req-2': {
    id: 'req-2',
    label: 'Visual Search',
    blurb: 'Upload a photo to find matching products.',
    route: '/search',
    stage: 'discovery',
    personas: ['customer', 'enterpriser'],
    icon: 'camera'
  },
  'req-3': {
    id: 'req-3',
    label: 'AI Room Visualizer',
    blurb: 'See how pieces look in your actual room.',
    route: '/ai-room-visualizer',
    stage: 'inspiration',
    personas: ['customer', 'enterpriser'],
    icon: 'image'
  },
  'req-4': {
    id: 'req-4',
    label: 'Designer Quiz',
    blurb: 'Find your design style in 10 questions.',
    route: '/designer-quiz',
    stage: 'discovery',
    personas: ['customer', 'enterpriser'],
    icon: 'compass'
  },
  'req-5': {
    id: 'req-5',
    label: 'Mood Board Generator',
    blurb: 'Build a mood board for your space.',
    route: '/ai-mood-board',
    stage: 'inspiration',
    personas: ['customer', 'enterpriser'],
    icon: 'layout'
  },
  'req-6': {
    id: 'req-6',
    label: 'AI Design Studio',
    blurb: 'Visualise and iterate on full room designs.',
    route: '/ai-room-visualizer',
    stage: 'inspiration',
    personas: ['customer', 'enterpriser'],
    icon: 'pen-tool'
  },
  'req-7': {
    id: 'req-7',
    label: 'AI Design Assistant',
    blurb: 'Chat with an AI designer for help.',
    route: '/recommendations',
    stage: 'inspiration',
    personas: ['customer', 'enterpriser', 'seller'],
    icon: 'message-square'
  },
  'req-8': {
    id: 'req-8',
    label: 'Client Brief',
    blurb: 'Capture a client brief and turn it into a project.',
    route: '/client-brief',
    stage: 'inspiration',
    personas: ['enterpriser', 'seller'],
    icon: 'clipboard'
  },
  'req-9': {
    id: 'req-9',
    label: 'Projects',
    blurb: 'Track project timeline, budget and deliverables.',
    route: '/projects',
    stage: 'inspiration',
    personas: ['enterpriser', 'seller'],
    icon: 'folder'
  },
  'req-10': {
    id: 'req-10',
    label: 'Cost Estimator',
    blurb: 'Generate a costed estimate for a project.',
    route: '/cost-estimator',
    stage: 'decision',
    personas: ['enterpriser', 'seller'],
    icon: 'calculator'
  },
  'req-11': {
    id: 'req-11',
    label: 'BOQ Generator',
    blurb: 'Produce a bill of quantities from your estimate.',
    route: '/boq-generator',
    stage: 'decision',
    personas: ['enterpriser', 'seller'],
    icon: 'list'
  },
  'req-12': {
    id: 'req-12',
    label: 'Quotation Generator',
    blurb: 'Turn a BOQ into a client-ready quotation.',
    route: '/quotation-generator',
    stage: 'decision',
    personas: ['enterpriser', 'seller'],
    icon: 'file-text'
  },
  'req-13': {
    id: 'req-13',
    label: 'Order Tracking',
    blurb: 'Follow your order in real time.',
    route: '/orders',
    stage: 'fulfillment',
    personas: ['customer', 'enterpriser'],
    icon: 'truck'
  },
  'req-14': {
    id: 'req-14',
    label: 'Notification Center',
    blurb: 'Manage updates and alerts.',
    route: '/notifications/preferences',
    stage: 'fulfillment',
    personas: ['customer', 'enterpriser', 'seller'],
    icon: 'bell'
  },
  'req-15': {
    id: 'req-15',
    label: 'AI Content Generator',
    blurb: 'Auto-write product titles and descriptions.',
    route: '/seller/content-generator',
    stage: 'discovery',
    personas: ['seller'],
    icon: 'edit'
  },
  'req-16': {
    id: 'req-16',
    label: 'For You',
    blurb: 'Recommendations personalised to your taste.',
    route: '/recommendations',
    stage: 'discovery',
    personas: ['customer', 'enterpriser'],
    icon: 'sparkles'
  }
};

// Ordered reference paths per persona. Used to compute progress and to pick the
// next sensible feature when the AI guidance layer is unavailable.
const SEQUENCES = {
  customer: ['req-4', 'req-16', 'req-3', 'req-5', 'req-1', 'req-13'],
  enterpriser: ['req-8', 'req-9', 'req-10', 'req-11', 'req-12', 'req-13'],
  seller: ['req-15', 'req-9', 'req-12', 'req-14'],
  admin: []
};

const getFeature = (id) => FEATURES[id] || null;

const getFeaturesForPersona = (persona) =>
  Object.values(FEATURES).filter((f) => f.personas.includes(persona));

const getFeaturesForStage = (stage, persona) =>
  Object.values(FEATURES).filter(
    (f) => f.stage === stage && (!persona || f.personas.includes(persona))
  );

/**
 * Resolves an app route back to the feature it belongs to, so we can record
 * "which feature was the user using" without the client having to say.
 */
const resolveFeatureFromRoute = (route) => {
  if (!route) return null;
  const path = String(route).split('?')[0].replace(/\/+$/, '') || '/';

  let best = null;
  for (const feature of Object.values(FEATURES)) {
    if (path === feature.route || path.startsWith(`${feature.route}/`)) {
      // Prefer the most specific (longest) route match.
      if (!best || feature.route.length > best.route.length) best = feature;
    }
  }
  return best;
};

const nextStage = (stage) => {
  const idx = STAGES.indexOf(stage);
  if (idx === -1 || idx === STAGES.length - 1) return null;
  return STAGES[idx + 1];
};

module.exports = {
  STAGES,
  PERSONAS,
  FEATURES,
  SEQUENCES,
  getFeature,
  getFeaturesForPersona,
  getFeaturesForStage,
  resolveFeatureFromRoute,
  nextStage
};
