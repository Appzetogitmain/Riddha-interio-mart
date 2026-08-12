import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';

const STAGES = [
  'Analyzing spatial requirements & budget limits...',
  'Crafting Executive Summary & Project Overview...',
  'Defining Tiered Design Scope Options...',
  'Categorizing Aesthetic & Technical Requirements...',
  'Building Project Phases & Milestones Timeline...',
  'Calculating INR Budget Allocations by Category...',
  'Analyzing Constraints & Engineering Workarounds...',
  'Finalizing Client Deliverables & Project Specs...'
];

const BriefLoading = () => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage(prev => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.round(((activeStage + 1) / STAGES.length) * 100);

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 sm:p-10 text-center shadow-2xl space-y-6">
      {/* Animated AI Brain Icon */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-[#189D91]/10 rounded-3xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="w-16 h-16 bg-[#189D91] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#189D91]/30 z-10">
          <LuSparkles size={30} className="animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Riddha Design AI</h3>
        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Synthesizing Project Brief</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <motion.div
          className="bg-[#189D91] h-full"
          initial={{ width: '5%' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stage Items List */}
      <div className="space-y-2 text-left pt-2">
        {STAGES.map((stg, i) => {
          const isDone = i < activeStage;
          const isCurrent = i === activeStage;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all ${
                isDone
                  ? 'bg-[#189D91]/5 border-[#189D91]/10 text-[#189D91]'
                  : isCurrent
                  ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'
              }`}
            >
              {isDone ? (
                <FiCheckCircle className="text-[#189D91] shrink-0" size={16} />
              ) : isCurrent ? (
                <span className="w-2.5 h-2.5 bg-[#189D91] rounded-full animate-ping shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0" />
              )}
              <span className="line-clamp-1">{stg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BriefLoading;
