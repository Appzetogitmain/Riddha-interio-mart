import React from 'react';
import { FiEdit2, FiAlertCircle, FiBox } from 'react-icons/fi';

export const ConstraintsSection = ({ constraintsData = [], onEdit, isApproved }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
          <FiAlertCircle size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 leading-tight">7. Constraints & Impact Analysis</h3>
          <p className="text-xs font-bold text-gray-400">Risk mitigation & engineering solutions</p>
        </div>
      </div>
      {!isApproved && onEdit && (
        <button
          onClick={() => onEdit('constraints', constraintsData)}
          className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
        >
          <FiEdit2 size={14} />
        </button>
      )}
    </div>

    <div className="space-y-4">
      {Array.isArray(constraintsData) && constraintsData.map((item, idx) => (
        <div key={idx} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              {item.constraint}
            </h4>
            <div className="flex gap-2">
              {item.costImpact && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md uppercase">
                  Cost: {item.costImpact}
                </span>
              )}
              {item.timelineImpact && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md uppercase">
                  Time: {item.timelineImpact}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium"><strong>Impact:</strong> {item.impact}</p>
          <p className="text-xs text-slate-800 font-extrabold"><strong>Design Solution:</strong> {item.solution}</p>
        </div>
      ))}
    </div>
  </div>
);

export const DeliverablesSection = ({ deliverablesData = [], onEdit, isApproved }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
          <FiBox size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 leading-tight">8. Final Client Deliverables</h3>
          <p className="text-xs font-bold text-gray-400">Tangible documentation & handover list</p>
        </div>
      </div>
      {!isApproved && onEdit && (
        <button
          onClick={() => onEdit('deliverables', deliverablesData)}
          className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
        >
          <FiEdit2 size={14} />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.isArray(deliverablesData) && deliverablesData.map((d, idx) => (
        <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h4 className="font-extrabold text-sm text-slate-900">{d.name}</h4>
              <span className="px-2 py-0.5 bg-[#189D91]/10 text-[#189D91] text-[10px] font-extrabold rounded-md">
                {d.timing}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{d.description}</p>
          </div>
          <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-slate-700">
            Format: {d.format}
          </div>
        </div>
      ))}
    </div>
  </div>
);
