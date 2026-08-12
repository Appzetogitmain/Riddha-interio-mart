import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFolder, FiPlus, FiSearch, FiFilter, FiTrendingUp, FiAlertTriangle,
  FiCheckCircle, FiClock, FiDollarSign, FiCalendar, FiChevronRight,
  FiMoreVertical, FiArchive, FiEye, FiZap
} from 'react-icons/fi';
import { LuSparkles, LuLayoutDashboard } from 'react-icons/lu';
import { projectService } from '../services/projectService';
import { useUser } from '../data/UserContext';
import toast from 'react-hot-toast';

const ProjectsDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [metricsSummary, setMetricsSummary] = useState({
    totalActiveProjects: 0,
    projectsOnTrackPercent: 100,
    projectsAtRiskCount: 0,
    avgCompletionPercentage: 0,
    totalBudgetAllocated: 0,
    totalBudgetSpent: 0
  });

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    projectName: '',
    clientName: '',
    roomType: 'Living Room',
    designStyle: 'Modern Minimalist',
    totalBudget: 100000
  });

  useEffect(() => {
    fetchProjectsData();
  }, [statusFilter, dateRangeFilter, sortBy]);

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjects({
        status: statusFilter,
        dateRange: dateRangeFilter,
        sortBy,
        search: searchQuery
      });
      if (res.success) {
        setProjects(res.data.projects || []);
        if (res.data.metricsSummary) {
          setMetricsSummary(res.data.metricsSummary);
        }
      }
    } catch (e) {
      toast.error('Failed to load project dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjectsData();
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.projectName.trim()) {
      toast.error('Please enter a project name.');
      return;
    }
    try {
      const res = await projectService.createProject({
        projectName: newProjectData.projectName,
        clientName: newProjectData.clientName || 'Valued Client',
        roomType: newProjectData.roomType,
        designStyle: newProjectData.designStyle,
        budget: {
          total: Number(newProjectData.totalBudget) || 100000,
          categories: [
            { name: 'Furniture', planned: Math.round(newProjectData.totalBudget * 0.4), spent: 0, items: [] },
            { name: 'Flooring', planned: Math.round(newProjectData.totalBudget * 0.2), spent: 0, items: [] },
            { name: 'Lighting', planned: Math.round(newProjectData.totalBudget * 0.15), spent: 0, items: [] },
            { name: 'Decor', planned: Math.round(newProjectData.totalBudget * 0.15), spent: 0, items: [] },
            { name: 'Labor', planned: Math.round(newProjectData.totalBudget * 0.1), spent: 0, items: [] }
          ]
        }
      });

      if (res.success) {
        toast.success('Project created successfully!');
        setShowCreateModal(false);
        setNewProjectData({ projectName: '', clientName: '', roomType: 'Living Room', designStyle: 'Modern Minimalist', totalBudget: 100000 });
        fetchProjectsData();
        navigate(`/projects/${res.data._id}`);
      }
    } catch (err) {
      toast.error('Failed to create project.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on-track':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><FiCheckCircle className="mr-1" /> On Track</span>;
      case 'at-risk':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><FiAlertTriangle className="mr-1" /> At Risk</span>;
      case 'on-hold':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><FiClock className="mr-1" /> On Hold</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><FiCheckCircle className="mr-1" /> Completed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">On Track</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Project Management Studio</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">Interior Project Dashboard</h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Track project milestones, monitor itemized budgets, manage deliverables, and get real-time Gemini AI risk recommendations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              to="/client-brief"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 text-center shadow-sm"
            >
              + Create from Brief
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <FiPlus className="text-lg" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* 1.2 Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Active Projects</span>
              <FiFolder className="text-amber-600 text-lg" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{metricsSummary.totalActiveProjects}</div>
            <p className="text-[11px] text-slate-400">Total in execution</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>On Track</span>
              <FiCheckCircle className="text-emerald-500 text-lg" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{metricsSummary.projectsOnTrackPercent}%</div>
            <p className="text-[11px] text-slate-400">Meeting targets</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>At Risk</span>
              <FiAlertTriangle className="text-amber-500 text-lg" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{metricsSummary.projectsAtRiskCount}</div>
            <p className="text-[11px] text-slate-400">Need attention</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Avg Completion</span>
              <FiTrendingUp className="text-blue-500 text-lg" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{metricsSummary.avgCompletionPercentage}%</div>
            <p className="text-[11px] text-slate-400">Across active projects</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Budget</span>
              <FiDollarSign className="text-indigo-500 text-lg" />
            </div>
            <div className="text-xl font-bold text-slate-900">₹{(metricsSummary.totalBudgetAllocated / 1000).toFixed(0)}k</div>
            <p className="text-[11px] text-slate-400">Allocated budget</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Spent</span>
              <FiZap className="text-purple-500 text-lg" />
            </div>
            <div className="text-xl font-bold text-purple-600">₹{(metricsSummary.totalBudgetSpent / 1000).toFixed(0)}k</div>
            <p className="text-[11px] text-slate-400">Actual expenses</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search project or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </form>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <FiFilter />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="on-track">On Track</option>
                <option value="at-risk">At Risk</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Range:</span>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-30-days">Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="createdAt">Date Created</option>
                <option value="due-date">Due Date</option>
                <option value="budget">Budget Size</option>
                <option value="name">Project Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* 1.1 Project Cards Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-slate-500 text-sm">Loading project dashboard...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-dashed border-slate-300">
            <FiFolder className="mx-auto text-4xl text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-800">No Projects Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Get started by creating your first interior design project or convert a saved Client Brief.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-deep-espresso text-white font-medium text-sm hover:bg-slate-800 transition-all inline-flex items-center gap-2"
            >
              <FiPlus /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const totalBudget = project.budget?.total || 100000;
              const spent = project.budget?.categories?.reduce((acc, c) => acc + (c.spent || 0), 0) || 0;
              const budgetPercent = Math.min(100, Math.round((spent / totalBudget) * 100));

              return (
                <motion.div
                  key={project._id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    {/* Top Row: Title & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">{project.projectName}</h3>
                        <p className="text-xs text-slate-500">Client: <span className="font-medium text-slate-700">{project.clientName}</span></p>
                      </div>
                      <div>{getStatusBadge(project.overallStatus)}</div>
                    </div>

                    {/* Meta Tags */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">{project.roomType}</span>
                      <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md font-medium">{project.designStyle}</span>
                    </div>

                    {/* Timeline Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>Timeline Progress</span>
                        <span className="text-amber-700 font-bold">{project.completionPercentage || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-warm-terracotta rounded-full transition-all duration-500"
                          style={{ width: `${project.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Budget Usage Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>Budget (₹{spent.toLocaleString()} / ₹{totalBudget.toLocaleString()})</span>
                        <span className={budgetPercent > 90 ? 'text-rose-600 font-bold' : 'text-slate-600'}>{budgetPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${budgetPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Insights Narrative Snippet */}
                    {project.aiInsights?.healthNarrative && (
                      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                        <LuSparkles className="text-amber-600 text-sm mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2 leading-relaxed">{project.aiInsights.healthNarrative}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiCalendar /> Target: {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'}
                    </span>
                    <button
                      onClick={() => navigate(`/projects/${project._id}`)}
                      className="font-semibold text-deep-espresso hover:text-amber-700 flex items-center gap-1 transition-colors"
                    >
                      View Details <FiChevronRight />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: Create New Project */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 font-display">Create Interior Project</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Villa Living Room"
                    value={newProjectData.projectName}
                    onChange={(e) => setNewProjectData({ ...newProjectData, projectName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priyesh Patel"
                    value={newProjectData.clientName}
                    onChange={(e) => setNewProjectData({ ...newProjectData, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                    <select
                      value={newProjectData.roomType}
                      onChange={(e) => setNewProjectData({ ...newProjectData, roomType: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="Living Room">Living Room</option>
                      <option value="Master Bedroom">Master Bedroom</option>
                      <option value="Modular Kitchen">Modular Kitchen</option>
                      <option value="Dining Room">Dining Room</option>
                      <option value="Home Office">Home Office</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Design Style</label>
                    <select
                      value={newProjectData.designStyle}
                      onChange={(e) => setNewProjectData({ ...newProjectData, designStyle: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="Modern Minimalist">Modern Minimalist</option>
                      <option value="Scandinavian">Scandinavian</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Contemporary Luxury">Contemporary Luxury</option>
                      <option value="Bohemian">Bohemian</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    value={newProjectData.totalBudget}
                    onChange={(e) => setNewProjectData({ ...newProjectData, totalBudget: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-deep-espresso text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-md"
                  >
                    Save & Open Dashboard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsDashboardPage;
