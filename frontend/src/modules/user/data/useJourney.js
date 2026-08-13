import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchJourneyStatus,
  fetchNextSuggestion,
  trackJourneyStep
} from '../../../shared/utils/journey';

/**
 * Journey status for the current user (Requirement #17).
 * Safe to mount anywhere — every call fails soft so journey tracking can never
 * take down the page it's observing.
 */
export const useJourneyStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchJourneyStatus();
      setStatus(data || null);
      setError(null);
    } catch (err) {
      setError(err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { status, loading, error, refresh: load };
};

/**
 * Gemini-guided next step for the page the user is on.
 */
export const useNextSuggestion = (currentPage, { includeUpsell = false, enabled = true } = {}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) { setLoading(false); return undefined; }
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchNextSuggestion(currentPage, { includeUpsell });
        if (!cancelled) setSuggestion(data || null);
      } catch {
        if (!cancelled) setSuggestion(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentPage, includeUpsell, enabled]);

  return { suggestion, loading };
};

/**
 * Records a journey step on every route change, so the funnel reflects real
 * navigation without each page having to opt in.
 */
export const useJourneyPageTracking = () => {
  const location = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastPath.current === path) return;
    lastPath.current = path;

    trackJourneyStep({ step: `Visited ${path}`, route: path, outcome: 'viewed' });
  }, [location.pathname]);
};
