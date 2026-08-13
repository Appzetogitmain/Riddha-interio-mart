import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, ArrowRight } from 'lucide-react';

/**
 * Visual timeline of the user's design journey (Requirement #17).
 * Steps come from the backend's persona sequence, marked complete from real
 * cross-feature evidence (quiz taken, order placed, project created...).
 */
const ProgressTracker = ({ status, compact = false }) => {
  if (!status?.steps?.length) return null;

  const { steps, progress, stage, timeInJourney } = status;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Your Design Journey</h3>
          <p className="text-[11px] text-gray-400 font-medium capitalize">
            Stage: {stage} &bull; {timeInJourney} in
          </p>
        </div>
        <span className="text-lg font-black text-[#189D91]">{progress}%</span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-[#189D91] rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className={compact ? 'flex gap-2 overflow-x-auto no-scrollbar' : 'space-y-2'}>
        {steps.map((step) => (
          <li key={step.featureId} className={compact ? 'shrink-0' : ''}>
            <Link
              to={step.route}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                step.completed
                  ? 'bg-[#189D91]/5 border-[#189D91]/20'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  step.completed ? 'bg-[#189D91] text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.completed ? <Check size={13} /> : <Circle size={11} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[12px] truncate ${step.completed ? 'font-bold text-gray-800' : 'font-semibold text-gray-600'}`}>
                  {step.label}
                </span>
                <span className="block text-[10px] text-gray-400 capitalize">{step.stage}</span>
              </span>
              {!step.completed && <ArrowRight size={13} className="text-gray-300 shrink-0" />}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ProgressTracker;
