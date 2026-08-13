import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, X } from 'lucide-react';

const SEEN_KEY = 'riddha_journey_milestones_seen';

const readSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Celebrates newly-completed journey milestones (Requirement #17).
 * Each milestone is shown once per browser, so returning users aren't
 * congratulated for the same step repeatedly.
 */
const JourneyCheckpoint = ({ status }) => {
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (!status?.steps?.length) return;

    const seen = readSeen();
    const freshlyDone = status.steps.find((s) => s.completed && !seen.includes(s.featureId));
    if (!freshlyDone) return;

    setMilestone(freshlyDone);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, freshlyDone.featureId]));

    const timer = setTimeout(() => setMilestone(null), 6000);
    return () => clearTimeout(timer);
  }, [status]);

  const nextUp = status?.nextStep;

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          className="fixed bottom-24 md:bottom-6 right-4 z-50 max-w-xs bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
        >
          <button
            onClick={() => setMilestone(null)}
            aria-label="Dismiss"
            className="absolute top-2.5 right-2.5 p-1 text-gray-300 hover:text-gray-500"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3 pr-5">
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <PartyPopper size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900">{milestone.label} complete!</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                You're {status.progress}% through your design journey.
                {nextUp ? ` Next up: ${nextUp.label}.` : ''}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JourneyCheckpoint;
