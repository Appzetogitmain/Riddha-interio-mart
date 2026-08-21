import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiCheckCircle, FiClock, FiAlertTriangle, FiDollarSign,
  FiCalendar, FiDownload, FiMail, FiPlus, FiUser, FiFileText,
  FiTrendingUp, FiCheckSquare, FiAlertCircle, FiPaperclip, FiZap
} from 'react-icons/fi';
import { LuSparkles, LuBrain } from 'react-icons/lu';
import { projectService } from '../services/projectService';
// Requirement A — raise a quotation request against this project
import RequestQuoteButton from '../components/RFQ/RequestQuoteButton';
import toast from 'react-hot-toast';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview'|'timeline'|'budget'|'deliverables'|'insights'|'team'|'reports'

  // Modal / Form States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ categoryName: 'Furniture', itemName: '', cost: '' });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('status');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchProjectDetails();
    fetchAlerts();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjectById(projectId);
      if (res.success) {
        setProject(res.data);
      }
    } catch (e) {
      toast.error('Failed to load project details.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await projectService.getProjectAlerts(projectId);
      if (res.success) {
        setAlerts(res.data.alerts || []);
      }
    } catch (e) {
      console.warn('Failed to load alerts');
    }
  };

  const handlePhaseToggle = async (phase) => {
    const nextStatus = phase.status === 'completed' ? 'in-progress' : 'completed';
    try {
      const res = await projectService.updatePhaseStatus(projectId, phase._id, { status: nextStatus });
      if (res.success) {
        toast.success(`Phase status updated to ${nextStatus}`);
        fetchProjectDetails();
      }
    } catch (e) {
      toast.error('Failed to update phase status.');
    }
  };

  const handleDeliverableToggle = async (deliv) => {
    const nextStatus = deliv.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await projectService.updateDeliverable(projectId, deliv._id, { status: nextStatus });
      if (res.success) {
        toast.success(`Deliverable updated`);
        fetchProjectDetails();
      }
    } catch (e) {
      toast.error('Failed to update deliverable.');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseData.cost || Number(expenseData.cost) <= 0) {
      toast.error('Please enter a valid expense cost.');
      return;
    }
    try {
      const res = await projectService.addBudgetItem(projectId, {
        categoryName: expenseData.categoryName,
        itemName: expenseData.itemName || 'Expense Item',
        cost: Number(expenseData.cost)
      });
      if (res.success) {
        toast.success('Budget expense logged successfully!');
        setShowExpenseModal(false);
        setExpenseData({ categoryName: 'Furniture', itemName: '', cost: '' });
        fetchProjectDetails();
        fetchAlerts();
      }
    } catch (e) {
      toast.error('Failed to log expense.');
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast.loading('Gemini AI generating report...', { id: 'report-toast' });
      const res = await projectService.generateReport(projectId, reportType);
      if (res.success) {
        toast.success('Report generated successfully!', { id: 'report-toast' });
        setGeneratedReport(res.data);
      }
    } catch (e) {
      toast.error('Report generation failed.', { id: 'report-toast' });
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const emails = emailInput ? emailInput.split(',').map(e => e.trim()) : [];
      const res = await projectService.emailReport(projectId, emails, generatedReport?.reportId);
      if (res.success) {
        toast.success('Project report update emailed to client!');
        setEmailInput('');
      }
    } catch (e) {
      toast.error('Failed to send email update.');
    } finally {
      setSendingEmail(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDirectDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      toast.loading('Preparing PDF report download...', { id: 'pdf-download-toast' });
      await projectService.downloadReportPDF(projectId, project?.projectName || 'Project');
      toast.success('PDF report downloaded successfully!', { id: 'pdf-download-toast' });
    } catch (e) {
      toast.error('Failed to download PDF report.', { id: 'pdf-download-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleTopPdfButtonClick = () => {
    setActiveTab('reports');
    handleGenerateReport();
    setTimeout(() => {
      const el = document.getElementById('project-tab-content');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleMarkAlertRead = async (alertId) => {
    try {
      await projectService.markAlertRead(projectId, alertId);
      fetchAlerts();
    } catch (e) {}
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm">Loading interior project workspace...</p>
        </div>
      </div>
    );
  }

  const totalBudget = project.budget?.total || 100000;
  const spent = project.budget?.categories?.reduce((acc, c) => acc + (c.spent || 0), 0) || 0;
  const budgetPercent = Math.min(100, Math.round((spent / totalBudget) * 100));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDirectDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all"
            >
              <FiDownload />
              <span>{downloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handleTopPdfButtonClick}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all"
            >
              <FiFileText />
              <span>Generate AI Report</span>
            </button>
            {/* ── B2B: quote for this project (Requirement A) ── */}
            <RequestQuoteButton
              projectId={projectId}
              projectName={project.projectName}
              source="project"
              size="sm"
              label="Request a Quote"
            />
          </div>
        </div>

        {/* 2.1 Project Overview Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">{project.roomType}</span>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">{project.designStyle}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${project.overallStatus === 'at-risk' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {project.overallStatus.replace('-', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{project.projectName}</h1>
              <p className="text-sm text-slate-500">Client: <span className="font-medium text-slate-700">{project.clientName}</span> | Target Handover: <span className="font-medium text-slate-700">{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'}</span></p>
            </div>

            {/* AI Health Score Badge */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 p-4 rounded-2xl flex items-center space-x-4 min-w-[200px]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {project.aiInsights?.healthScore || 90}
              </div>
              <div>
                <div className="flex items-center space-x-1 text-xs font-bold text-amber-900 uppercase">
                  <LuSparkles /> <span>AI Health Score</span>
                </div>
                <p className="text-xs text-amber-700 mt-0.5">Calculated by Gemini</p>
              </div>
            </div>
          </div>

          {/* Progress Overview Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Overall Progress</span>
                <span className="text-amber-600 font-bold">{project.completionPercentage}% Complete</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-warm-terracotta rounded-full transition-all duration-500"
                  style={{ width: `${project.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Budget Spent (₹{spent.toLocaleString()} / ₹{totalBudget.toLocaleString()})</span>
                <span className={budgetPercent > 90 ? 'text-rose-600 font-bold' : 'text-slate-700'}>{budgetPercent}% Spent</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${budgetPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div id="project-tab-content" className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 scroll-mt-20">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline & Phases' },
            { id: 'budget', label: 'Budget Tracking' },
            { id: 'deliverables', label: 'Deliverables & Tasks' },
            { id: 'insights', label: 'AI Insights & Alerts' },
            { id: 'team', label: 'Team & Activity' },
            { id: 'reports', label: 'Reports & PDF' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-white border border-b-0 border-slate-200 text-deep-espresso shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display">Project Description & Scope</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {project.description || 'Comprehensive interior design execution including space planning, luxury furniture procurement, custom lighting layout, and on-site contractor installation management.'}
              </p>

              {/* Gemini Narrative Card */}
              {project.aiInsights?.healthNarrative && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                    <LuSparkles className="text-amber-600" />
                    <span>GEMINI AI PROJECT NARRATIVE</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">{project.aiInsights.healthNarrative}</p>
                </div>
              )}
            </div>

            {/* Quick Summary Sidebar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display">Quick Specs</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Owner/Designer</span>
                  <span className="font-semibold text-slate-900">{project.userId?.name || 'Designer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Start Date</span>
                  <span className="font-semibold text-slate-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Target Handover</span>
                  <span className="font-semibold text-slate-900">{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Active Alerts</span>
                  <span className="font-semibold text-amber-600">{alerts.filter(a => !a.isRead).length} Unread</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE & PHASES */}
        {activeTab === 'timeline' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Project Timeline & Phases</h3>
                <p className="text-xs text-slate-500">Click checkboxes to mark phase milestones as complete.</p>
              </div>
            </div>

            <div className="space-y-4">
              {project.phases?.map((phase, idx) => (
                <div
                  key={phase._id || idx}
                  className={`p-5 rounded-2xl border transition-all ${phase.status === 'completed'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : phase.status === 'in-progress'
                      ? 'bg-white border-amber-300 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handlePhaseToggle(phase)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-xs text-white font-bold transition-all ${phase.status === 'completed' ? 'bg-emerald-600' : 'border border-slate-300 hover:border-slate-500 bg-white'
                          }`}
                      >
                        {phase.status === 'completed' && '✓'}
                      </button>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{phase.phaseName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target End: {phase.targetEndDate ? new Date(phase.targetEndDate).toLocaleDateString() : 'TBD'}
                        </p>
                        {phase.deliverables && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {phase.deliverables.map((d, dIdx) => (
                              <span key={dIdx} className="bg-white/80 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                                • {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${phase.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : phase.status === 'in-progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                      {phase.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BUDGET TRACKING */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Itemized Budget Breakdown</h3>
                  <p className="text-xs text-slate-500">Track planned vs spent allocations per category.</p>
                </div>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-4 py-2 bg-deep-espresso hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
                >
                  <FiPlus /> Record Expense
                </button>
              </div>

              {/* Stacked Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.budget?.categories?.map((cat, idx) => {
                  const catSpent = cat.spent || 0;
                  const catPlanned = cat.planned || 1;
                  const catPercent = Math.round((catSpent / catPlanned) * 100);

                  return (
                    <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span>{cat.name}</span>
                        <span className={catPercent > 90 ? 'text-rose-600' : 'text-slate-600'}>{catPercent}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Spent: ₹{catSpent.toLocaleString()}</span>
                        <span>Planned: ₹{catPlanned.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${catPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, catPercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERABLES */}
        {activeTab === 'deliverables' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-display">Tasks & Deliverables Checklist</h3>
            <div className="space-y-3">
              {project.deliverables?.map((deliv, idx) => (
                <div
                  key={deliv._id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDeliverableToggle(deliv)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs text-white font-bold transition-all ${deliv.status === 'completed' ? 'bg-emerald-600' : 'border border-slate-300 bg-white'
                        }`}
                    >
                      {deliv.status === 'completed' && '✓'}
                    </button>
                    <div>
                      <h4 className={`text-sm font-semibold ${deliv.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {deliv.name}
                      </h4>
                      <p className="text-xs text-slate-500">{deliv.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">Due: {deliv.dueDate ? new Date(deliv.dueDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AI INSIGHTS & ALERTS */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Risk Assessment Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-base font-display">
                <LuBrain className="text-xl text-amber-600" />
                <span>Gemini AI Risk Assessment & Next Steps</span>
              </div>
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 text-xs text-amber-900 whitespace-pre-line leading-relaxed font-sans">
                {project.aiInsights?.riskAssessment || 'Evaluating project risk factor metrics...'}
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Recommended Next Actions</h4>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {project.aiInsights?.nextSteps || '1. Finalize current procurement phase.\n2. Review budget variance.'}
                </div>
              </div>
            </div>

            {/* Active Alerts List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display">Project Alerts & Notifications</h3>
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400">No active alerts recorded for this project.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert._id} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-amber-900">
                        <span className="uppercase">{alert.alertType}</span>
                        {!alert.isRead && (
                          <button onClick={() => handleMarkAlertRead(alert._id)} className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-full text-amber-900 hover:bg-amber-300">
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-amber-900">{alert.message}</p>
                      {alert.aiRecommendation && <p className="text-amber-800 italic">Rec: {alert.aiRecommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: TEAM & ACTIVITY */}
        {activeTab === 'team' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-display">Project Activity Log</h3>
            <div className="space-y-3 border-l-2 border-slate-200 pl-4">
              {project.activityLog?.slice().reverse().map((act, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                    <span>{act.action}</span>
                    <span className="text-slate-400 font-normal">• {new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">{act.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: REPORTS & PDF */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Generate Project Report (PDF / Email)</h3>
                <p className="text-xs text-slate-500">Create Gemini AI status summaries for client handover or progress updates.</p>
              </div>
              <button
                onClick={handleGenerateReport}
                className="px-5 py-2.5 bg-deep-espresso hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center gap-2"
              >
                <LuSparkles className="text-amber-300" /> Generate AI Report
              </button>
            </div>

            {generatedReport && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Report Summary Preview</h4>
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {generatedReport.content}
                </div>

                {/* Email Direct Input & Download Actions */}
                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="email"
                    placeholder="Enter client email (e.g. client@example.com)"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full sm:flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-semibold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <FiMail /> {sendingEmail ? 'Sending...' : 'Email Report'}
                    </button>
                    <button
                      onClick={handleDirectDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <FiDownload /> {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Record Budget Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={expenseData.categoryName}
                    onChange={(e) => setExpenseData({ ...expenseData, categoryName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  >
                    {project.budget?.categories?.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Item Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Italian Leather Sofa"
                    value={expenseData.itemName}
                    onChange={(e) => setExpenseData({ ...expenseData, itemName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35000"
                    value={expenseData.cost}
                    onChange={(e) => setExpenseData({ ...expenseData, cost: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="px-3 py-2 text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-deep-espresso text-white font-semibold rounded-xl">Save Expense</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetailPage;
