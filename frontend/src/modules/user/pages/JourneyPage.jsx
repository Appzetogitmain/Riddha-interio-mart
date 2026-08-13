import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, ShoppingBag, Package, FolderKanban, HelpCircle } from 'lucide-react';
import { useJourneyStatus } from '../data/useJourney';
import { fetchRecommendedPath, fetchContextHelp } from '../../../shared/utils/journey';
import ProgressTracker from '../components/ProgressTracker';
import SmartGuide from '../components/SmartGuide';
import FeatureRecommendation from '../components/FeatureRecommendation';
import JourneyCheckpoint from '../components/JourneyCheckpoint';

const SIGNAL_TILES = [
  { key: 'cartCount', label: 'In Cart', icon: ShoppingBag, to: '/cart' },
  { key: 'orderCount', label: 'Orders', icon: Package, to: '/orders' },
  { key: 'projectCount', label: 'Projects', icon: FolderKanban, to: '/projects' },
  { key: 'quotationCount', label: 'Quotations', icon: Compass, to: '/quotation-generator' }
];

/**
 * "Your Journey" dashboard (Requirement #17) — one place showing where the user
 * is across every feature, what they've completed, and what to do next.
 */
const JourneyPage = () => {
  const { status, loading } = useJourneyStatus();
  const [path, setPath] = useState(null);
  const [help, setHelp] = useState(null);
  const [helpLoading, setHelpLoading] = useState(false);

  useEffect(() => {
    if (!status?.persona) return;
    fetchRecommendedPath(status.persona).then(setPath).catch(() => setPath(null));
  }, [status?.persona]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const loadHelp = async () => {
    setHelpLoading(true);
    try {
      setHelp(await fetchContextHelp('/journey', 'What should I do on this page?'));
    } catch {
      setHelp(null);
    } finally {
      setHelpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading your journey…</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 text-sm">We couldn't load your journey right now.</p>
        <Link to="/products" className="text-[#189D91] text-sm font-bold hover:underline mt-2 inline-block">
          Browse products instead →
        </Link>
      </div>
    );
  }

  // Steps the user hasn't done yet become the "try this" suggestions.
  const untried = (path?.path || [])
    .filter((p) => !status.steps.find((s) => s.featureId === p.featureId && s.completed))
    .map((p) => ({ id: p.featureId, label: p.label, blurb: p.blurb, route: p.route, icon: 'sparkles' }));

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16 pt-4">
      <JourneyCheckpoint status={status} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#189D91]/10 text-[#189D91] flex items-center justify-center">
          <Compass size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Journey</h1>
          <p className="text-[12px] text-gray-400 font-medium capitalize">
            {status.persona} &bull; {status.stage} stage
          </p>
        </div>
      </div>

      <SmartGuide currentPage="/journey" includeUpsell className="mb-6" />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ProgressTracker status={status} />

          {untried.length > 0 && (
            <FeatureRecommendation features={untried} title="Haven't tried these yet" />
          )}
        </div>

        <aside className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">At a glance</h3>
            <div className="grid grid-cols-2 gap-2">
              {SIGNAL_TILES.map((tile) => {
                const value = status.signals?.[tile.key] ?? 0;
                const Icon = tile.icon;
                return (
                  <Link
                    key={tile.key}
                    to={tile.to}
                    className="bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-colors"
                  >
                    <Icon size={15} className="text-[#189D91] mb-1.5" />
                    <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{tile.label}</p>
                  </Link>
                );
              })}
            </div>

            {status.signals?.hasQuiz && (
              <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#189D91] bg-[#189D91]/5 rounded-lg px-3 py-2">
                <Sparkles size={12} /> Design profile complete
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={15} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Need a hand?</h3>
            </div>

            {help ? (
              <div>
                <p className="text-[12px] text-gray-600 leading-relaxed">{help.help}</p>
                {help.steps?.length > 0 && (
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    {help.steps.map((s, i) => (
                      <li key={i} className="text-[11px] text-gray-500">{s}</li>
                    ))}
                  </ol>
                )}
                {help.suggestedFeature && (
                  <Link
                    to={help.suggestedFeature.route}
                    className="mt-3 inline-block text-[11px] font-bold text-[#189D91] hover:underline"
                  >
                    Open {help.suggestedFeature.label} →
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={loadHelp}
                disabled={helpLoading}
                className="w-full h-9 border border-gray-200 hover:border-[#189D91] hover:text-[#189D91] disabled:opacity-60 text-gray-600 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors"
              >
                {helpLoading ? 'Thinking…' : 'Get guidance'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JourneyPage;
