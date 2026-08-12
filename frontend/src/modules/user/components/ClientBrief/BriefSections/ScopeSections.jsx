import React from 'react';
import { FiEdit2, FiLayers, FiCheckCircle, FiList } from 'react-icons/fi';

export const DesignScopeSection = ({ scopeData = {}, onEdit, isApproved }) => {
  const tiers = ['basic', 'standard', 'premium'];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
            <FiLayers size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">3. Design Scope Options</h3>
            <p className="text-xs font-bold text-gray-400">Tiered packages for client selection</p>
          </div>
        </div>
        {!isApproved && onEdit && (
          <button
            onClick={() => onEdit('designScope', scopeData)}
            className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tKey) => {
          const tier = scopeData[tKey] || {};
          const isStandard = tKey === 'standard';

          return (
            <div
              key={tKey}
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                isStandard
                  ? 'bg-slate-900 border-slate-800 text-white shadow-lg relative'
                  : 'bg-gray-50 border-gray-100 text-slate-800'
              }`}
            >
              {isStandard && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-[#189D91] text-white font-extrabold text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                  Recommended
                </span>
              )}

              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isStandard ? 'text-[#189D91]' : 'text-gray-400'}`}>
                  {tKey} Tier
                </span>
                <h4 className="font-extrabold text-base mt-1">{tier.title || `${tKey.toUpperCase()} Scope`}</h4>
                <p className={`text-xs mt-2 leading-relaxed ${isStandard ? 'text-gray-300' : 'text-gray-500'}`}>
                  {tier.description || 'N/A'}
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100/10 space-y-2">
                  <p className={`text-[11px] font-bold ${isStandard ? 'text-gray-300' : 'text-slate-700'}`}>
                    Effort: <span className="font-extrabold">{tier.estimatedEffort || 'N/A'}</span>
                  </p>

                  <div className="space-y-1.5 pt-2">
                    {Array.isArray(tier.includedItems) && tier.includedItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <FiCheckCircle className={`shrink-0 mt-0.5 ${isStandard ? 'text-[#189D91]' : 'text-[#189D91]'}`} size={14} />
                        <span className={isStandard ? 'text-gray-200' : 'text-slate-600'}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RequirementsSection = ({ reqData = {}, onEdit, isApproved }) => {
  const categories = [
    { key: 'aesthetic', label: 'Aesthetic Requirements', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { key: 'functional', label: 'Functional Requirements', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { key: 'technical', label: 'Technical Requirements', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    { key: 'budget', label: 'Budget Requirements', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { key: 'timeline', label: 'Timeline Requirements', color: 'bg-amber-50 text-amber-700 border-amber-100' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
            <FiList size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">4. Categorized Requirements</h3>
            <p className="text-xs font-bold text-gray-400">Structured design & technical criteria</p>
          </div>
        </div>
        {!isApproved && onEdit && (
          <button
            onClick={() => onEdit('requirements', reqData)}
            className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => {
          const list = reqData[c.key] || [];

          return (
            <div key={c.key} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold border ${c.color}`}>
                {c.label}
              </span>
              <ul className="space-y-2 pt-1">
                {Array.isArray(list) && list.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <span className="w-1.5 h-1.5 bg-[#189D91] rounded-full mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
