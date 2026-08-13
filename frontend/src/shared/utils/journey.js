import api from './api';

const SESSION_KEY = 'riddha_journey_session';

/**
 * Stable per-browser session id so an anonymous visitor's journey stays
 * coherent before they log in (the backend claims it on login).
 */
export const getJourneySession = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const withSession = (config = {}) => ({
  ...config,
  headers: { ...(config.headers || {}), 'x-journey-session': getJourneySession() }
});

export const fetchJourneyStatus = () =>
  api.get('/journey/user-status', withSession()).then((r) => r.data?.data);

export const fetchNextSuggestion = (currentPage, { includeUpsell = false } = {}) =>
  api.post('/journey/next-suggestion', { currentPage, includeUpsell }, withSession()).then((r) => r.data?.data);

export const fetchContextHelp = (page, issue = '') =>
  api.post('/journey/context-help', { page, issue }, withSession()).then((r) => r.data?.data);

export const fetchRecommendedPath = (segment) =>
  api.get(`/journey/recommended-path/${segment}`, withSession()).then((r) => r.data?.data);

export const personalizeFlow = (goals = []) =>
  api.post('/journey/personalize-flow', { goals }, withSession()).then((r) => r.data?.data);

/**
 * Records a journey step. Fire-and-forget by design — journey analytics must
 * never break or slow down the page the user is actually using.
 */
export const trackJourneyStep = (payload = {}) =>
  api.post('/journey/track-step', payload, withSession()).catch(() => null);

export const trackConversion = (type, value = 0, route = window.location.pathname) =>
  trackJourneyStep({ step: `Conversion: ${type}`, route, conversion: { type, value } });

export const trackGuidanceResponse = (accepted, route = window.location.pathname) =>
  trackJourneyStep({
    step: accepted ? 'Accepted guidance' : 'Dismissed guidance',
    route,
    guidanceAccepted: accepted
  });

// Admin analytics
export const fetchJourneyFunnel = () => api.get('/journey/funnel').then((r) => r.data?.data);
export const fetchFeatureImpact = () => api.get('/journey/feature-impact').then((r) => r.data?.data);
export const fetchJourneyDashboard = (params = {}) =>
  api.get('/journey/analytics/dashboard', { params }).then((r) => r.data?.data);
