import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, Lightbulb } from 'lucide-react';
import { useNextSuggestion } from '../data/useJourney';
import { trackGuidanceResponse } from '../../../shared/utils/journey';

const URGENCY_STYLES = {
  low: 'from-[#189D91]/8 to-transparent border-[#189D91]/20',
  medium: 'from-amber-50 to-transparent border-amber-200',
  high: 'from-rose-50 to-transparent border-rose-200'
};

/**
 * Gemini-guided "what should I do next" nudge (Requirement #17).
 *
 * Renders nothing until guidance arrives, and never blocks the page: the API
 * returns a deterministic suggestion immediately and upgrades to AI-written
 * guidance on subsequent views.
 */
const SmartGuide = ({ currentPage, includeUpsell = false, className = '' }) => {
  const navigate = useNavigate();
  const { suggestion, loading } = useNextSuggestion(currentPage, { includeUpsell });
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !suggestion?.nextStep) return null;

  const { nextStep, feature, cta, helpMessage, urgency, upsell } = suggestion;
  const tone = URGENCY_STYLES[urgency] || URGENCY_STYLES.low;

  const handleAccept = () => {
    trackGuidanceResponse(true, currentPage);
    if (feature?.route) navigate(feature.route);
  };

  const handleDismiss = () => {
    trackGuidanceResponse(false, currentPage);
    setDismissed(true);
  };

  return (
    <section className={`bg-gradient-to-br ${tone} border rounded-2xl p-4 md:p-5 relative ${className}`}>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss suggestion"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-white/60 transition-colors"
      >
        <X size={15} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#189D91] shrink-0">
          <Sparkles size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
            Suggested next step
          </p>
          <p className="text-[13px] font-bold text-gray-900 leading-snug">{nextStep}</p>
          {helpMessage && (
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{helpMessage}</p>
          )}

          {feature && (
            <button
              onClick={handleAccept}
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 bg-[#189D91] hover:bg-[#14847a] text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors"
            >
              {cta || `Open ${feature.label}`} <ArrowRight size={13} />
            </button>
          )}

          {upsell?.shouldSuggest && upsell.suggestion && (
            <div className="mt-4 pt-3 border-t border-gray-200/70 flex items-start gap-2">
              <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-800">{upsell.suggestion}</p>
                {upsell.reasoning && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{upsell.reasoning}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SmartGuide;
