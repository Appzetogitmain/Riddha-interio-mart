import React from 'react';
import { FiEdit2, FiFileText } from 'react-icons/fi';

export const ExecutiveSummarySection = ({ content, onEdit, isApproved }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
          <FiFileText size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 leading-tight">1. Executive Summary</h3>
          <p className="text-xs font-bold text-gray-400">High-level project introduction & vision</p>
        </div>
      </div>
      {!isApproved && onEdit && (
        <button
          onClick={() => onEdit('executiveSummary', content)}
          className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
        >
          <FiEdit2 size={14} />
        </button>
      )}
    </div>
    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
      {content || 'No executive summary generated.'}
    </p>
  </div>
);

export const ProjectOverviewSection = ({ content, onEdit, isApproved }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#189D91]/10 rounded-2xl flex items-center justify-center text-[#189D91]">
          <FiFileText size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 leading-tight">2. Project Overview</h3>
          <p className="text-xs font-bold text-gray-400">Detailed space & scope objectives</p>
        </div>
      </div>
      {!isApproved && onEdit && (
        <button
          onClick={() => onEdit('projectOverview', content)}
          className="p-2.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-600 hover:text-[#189D91] rounded-xl text-xs font-bold transition-all"
        >
          <FiEdit2 size={14} />
        </button>
      )}
    </div>
    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
      {content || 'No project overview generated.'}
    </p>
  </div>
);
