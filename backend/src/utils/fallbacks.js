const FALLBACKS = {
  journeyGuidance: {
    nextRecommendedStep: 'Browse our curated collection of products tailored to your style.',
    suggestedCTA: 'Browse Now',
    helpMessage: 'We are here to help you find the perfect interior design pieces for your space.',
    urgency: 'low'
  },
  journeyContextHelp: {
    help: 'Explore our design resources and tools to get inspired.',
    steps: ['Step 1: Browse categories', 'Step 2: Save favorites', 'Step 3: Use designer tools']
  },
  journeyUpsell: {
    shouldSuggest: false,
    suggestion: '',
    reasoning: '',
    cta: 'View suggestion'
  }
};

module.exports = { FALLBACKS };
