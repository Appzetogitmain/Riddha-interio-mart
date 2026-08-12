import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle, FiEdit2, FiShare2, FiDownload, FiLock,
  FiFileText, FiCalendar, FiUser, FiZap, FiRefreshCw
} from 'react-icons/fi';
import { ExecutiveSummarySection, ProjectOverviewSection } from './BriefSections/OverviewSections';
import { DesignScopeSection, RequirementsSection } from './BriefSections/ScopeSections';
import { TimelineSection, BudgetBreakdownSection } from './BriefSections/PlanningSections';
import { ConstraintsSection, DeliverablesSection } from './BriefSections/FinalSections';
import { BriefEditor, BriefExport, BriefShare, BriefApprove } from './BriefModals';

const BriefDisplay = ({ brief, onBriefUpdated, onReGenerate }) => {
  const [activeEditSection, setActiveEditSection] = useState(null);
  const [editSectionContent, setEditSectionContent] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!brief) return null;

  const content = brief.briefContent || {};
  const isApproved = brief.status === 'approved';

  const handleOpenEdit = (sectionKey, currentVal) => {
    if (isApproved) return;
    setActiveEditSection(sectionKey);
    setEditSectionContent(currentVal);
  };

  const handleSaveSection = (sectionKey, updatedVal) => {
    if (onBriefUpdated) {
      onBriefUpdated(sectionKey, updatedVal);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#189D91]/20 text-[#189D91] border border-[#189D91]/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {brief.status || 'Draft'}
              </span>
              <span className="text-xs text-gray-400">
                Created: {new Date(brief.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight">
              {brief.projectName || 'Interior Design Project Brief'}
            </h1>
          </div>

          {/* Header Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {!isApproved && onReGenerate && (
              <button
                onClick={onReGenerate}
                className="px-4 py-2.5 bg-[#189D91]/20 hover:bg-[#189D91]/30 text-[#189D91] border border-[#189D91]/40 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all"
              >
                <FiRefreshCw size={14} /> Intake Form
              </button>
            )}

            <BriefExport briefId={brief._id} projectName={brief.projectName} />

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700"
            >
              <FiShare2 size={15} /> Share Brief
            </button>

            <BriefApprove
              briefId={brief._id}
              status={brief.status}
              onApproveSuccess={(updated) => onBriefUpdated && onBriefUpdated(null, null, updated)}
            />
          </div>
        </div>

        {/* Form Specs Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Project Scope</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block line-clamp-1">
              {brief.formAnswers?.find(a => a.questionId === 1)?.answer || 'Interior Renovation'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Target Space</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block line-clamp-1">
              {brief.formAnswers?.find(a => a.questionId === 2)?.answer || 'Living Space'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Total Investment</span>
            <span className="font-extrabold text-[#189D91] text-sm mt-0.5 block">
              ₹{Number(brief.formAnswers?.find(a => a.questionId === 5)?.answer || 300000).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Design Style</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block line-clamp-1">
              {brief.formAnswers?.find(a => a.questionId === 7)?.answer || 'Modern Minimalist'}
            </span>
          </div>
        </div>
      </div>

      {/* 8 Formatted Brief Sections */}
      <div className="space-y-6">
        <ExecutiveSummarySection
          content={content.executiveSummary}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <ProjectOverviewSection
          content={content.projectOverview}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <DesignScopeSection
          scopeData={content.designScope}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <RequirementsSection
          reqData={content.requirements}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <TimelineSection
          timelineData={content.timeline}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <BudgetBreakdownSection
          budgetData={content.budgetBreakdown}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <ConstraintsSection
          constraintsData={content.constraints}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />

        <DeliverablesSection
          deliverablesData={content.deliverables}
          onEdit={handleOpenEdit}
          isApproved={isApproved}
        />
      </div>

      {/* Section Editor Modal */}
      <BriefEditor
        isOpen={!!activeEditSection}
        onClose={() => setActiveEditSection(null)}
        section={activeEditSection}
        content={editSectionContent}
        onSave={handleSaveSection}
      />

      {/* Share Modal */}
      <BriefShare
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        briefId={brief._id}
      />
    </div>
  );
};

export default BriefDisplay;
