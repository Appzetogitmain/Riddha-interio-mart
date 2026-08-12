import React from 'react';
import { FiEdit2, FiClock, FiDollarSign, FiCheckSquare } from 'react-icons/fi';

export const TimelineSection = ({ timelineData = {}, onEdit, isApproved }) => {
  const phases = timelineData.phases || [];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
            <FiClock size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">5. Project Timeline & Milestones</h3>
            <p className="text-xs font-bold text-gray-400">Total Duration: {timelineData.totalDuration || 'N/A'}</p>
          </div>
        </div>
        {!isApproved && onEdit && (
          <button
            onClick={() => onEdit('timeline', timelineData)}
            className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {phases.map((ph, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#189D91]">
                Phase {idx + 1} ({ph.duration})
              </span>
              <h4 className="font-extrabold text-base text-slate-900">{ph.phaseName}</h4>
              {Array.isArray(ph.deliverables) && (
                <p className="text-xs text-gray-500 font-medium">
                  Deliverables: {ph.deliverables.join(', ')}
                </p>
              )}
            </div>
            {ph.milestone && (
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-extrabold text-slate-700 shrink-0 shadow-sm">
                <FiCheckSquare className="text-[#189D91]" size={14} />
                <span>{ph.milestone}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const BudgetBreakdownSection = ({ budgetData = {}, onEdit, isApproved }) => {
  const categories = budgetData.categories || [];
  const total = budgetData.totalBudget || 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
            <FiDollarSign size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">6. Budget Allocation Breakdown</h3>
            <p className="text-xs font-bold text-gray-400">Total Investment Cap: ₹{Number(total).toLocaleString('en-IN')}</p>
          </div>
        </div>
        {!isApproved && onEdit && (
          <button
            onClick={() => onEdit('budgetBreakdown', budgetData)}
            className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-sm text-slate-900">{cat.name}</h4>
              <span className="text-xs font-black text-[#189D91]">
                {cat.percentage}% — ₹{Number(cat.amount).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Progress bar track */}
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-[#189D91] h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
            </div>

            <p className="text-xs text-gray-500 font-medium pt-1">Included: {cat.included}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
