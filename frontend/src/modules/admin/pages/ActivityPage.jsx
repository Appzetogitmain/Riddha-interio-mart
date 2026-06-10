import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import {
  FiClock,
  FiUser,
  FiPackage,
  FiSettings,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiRefreshCw,
  FiFilter,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiWifi,
  FiWifiOff,
  FiHash
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icon resolver based on action text ---
const getIcon = (action = '') => {
  if (action.toLowerCase().includes('approved') || action.toLowerCase().includes('confirmed')) return <FiCheckCircle className="text-emerald-500" size={20} />;
  if (action.toLowerCase().includes('added') || action.toLowerCase().includes('created') || action.toLowerCase().includes('registered')) return <FiPackage className="text-blue-500" size={20} />;
  if (action.toLowerCase().includes('updated') || action.toLowerCase().includes('adjusted') || action.toLowerCase().includes('changed')) return <FiSettings className="text-amber-500" size={20} />;
  if (action.toLowerCase().includes('deleted') || action.toLowerCase().includes('rejected') || action.toLowerCase().includes('suspended') || action.toLowerCase().includes('blocked')) return <FiAlertCircle className="text-rose-500" size={20} />;
  if (action.toLowerCase().includes('security') || action.toLowerCase().includes('unauthorized') || action.toLowerCase().includes('backup')) return <FiShield className="text-violet-500" size={20} />;
  return <FiActivity className="text-[#189D91]" size={20} />;
};

// --- Color resolver based on role ---
const getRoleBadgeStyle = (role = '') => {
  if (role === 'Super Admin') return 'bg-[#189D91]/10 text-[#189D91] border-[#189D91]/20';
  if (role === 'Manager') return 'bg-blue-50 text-blue-600 border-blue-100';
  if (role === 'System') return 'bg-slate-100 text-slate-500 border-slate-200';
  if (role === 'Seller') return 'bg-purple-50 text-purple-600 border-purple-100';
  return 'bg-amber-50 text-amber-600 border-amber-100';
};

// --- Action color resolver ---
const getActionBadgeStyle = (action = '') => {
  if (action.toLowerCase().includes('approved') || action.toLowerCase().includes('confirmed')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (action.toLowerCase().includes('deleted') || action.toLowerCase().includes('rejected') || action.toLowerCase().includes('suspended') || action.toLowerCase().includes('blocked')) return 'bg-rose-50 text-rose-700 border-rose-100';
  if (action.toLowerCase().includes('added') || action.toLowerCase().includes('created')) return 'bg-blue-50 text-blue-700 border-blue-100';
  if (action.toLowerCase().includes('updated') || action.toLowerCase().includes('adjusted')) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

// --- Relative time formatter ---
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LIMIT = 20;

const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');    // 'all' | 'admin' | 'system'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async (currentPage = 1, currentFilter = 'all', isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: currentPage, limit: LIMIT, _ts: Date.now().toString() });
      if (currentFilter !== 'all') params.append('type', currentFilter);

      const { data } = await api.get(`/auth/admin/activity-logs?${params.toString()}`);
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination || { total: data.data.length, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setError('Could not load activity logs. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount and whenever filter/page changes
  useEffect(() => {
    fetchLogs(page, filter);
  }, [page, filter, fetchLogs]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchLogs(page, filter, true);
  };

  // ---- Skeleton Loader ----
  const SkeletonRow = () => (
    <div className="p-6 border-b border-slate-100 animate-pulse">
      <div className="flex gap-5 items-start">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-2/5" />
            <div className="h-4 bg-slate-100 rounded w-20" />
          </div>
          <div className="h-3 bg-slate-50 rounded w-4/5" />
          <div className="h-3 bg-slate-50 rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-7 bg-[#189D91] rounded-full" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                System Activity Logs
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium pl-3.5">
              Real-time historical record of all system-wide updates and administrative actions.
            </p>
          </div>

          {/* Refresh & Live Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live Stream
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#189D91] hover:border-[#189D91]/30 hover:bg-teal-50/30 transition-all shadow-sm"
            >
              <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Filter Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <FiFilter size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter</span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: 'All Activity', value: 'all' },
                { label: 'Admin Actions', value: 'admin' },
                { label: 'System Only', value: 'system' }
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange(value)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    filter === value
                      ? 'bg-[#189D91] text-white border-[#189D91] shadow-sm shadow-teal-500/10'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Total Count */}
            {!loading && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {pagination.total} Records
              </span>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
              <FiWifiOff size={32} className="text-rose-300" />
              <p className="text-sm font-semibold text-slate-500">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#189D91] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Logs List */}
          {!error && (
            <div className="divide-y divide-slate-100">
              {loading ? (
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              ) : logs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <FiActivity size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">No Activity Found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      No operational actions have been logged yet for this filter.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${filter}-${page}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {logs.map((log, idx) => (
                      <motion.div
                        key={log._id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="p-5 md:p-6 hover:bg-slate-50/70 transition-colors group"
                      >
                        <div className="flex gap-4 items-start">
                          {/* Icon */}
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                            {getIcon(log.action)}
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Top row: Action + Time */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getActionBadgeStyle(log.action)}`}>
                                  {log.action}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(log.role)}`}>
                                  {log.role || 'System'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                                <FiClock size={11} />
                                {formatRelativeTime(log.createdAt)}
                              </div>
                            </div>

                            {/* Target */}
                            <h4 className="font-bold text-slate-800 text-sm leading-snug truncate">
                              {log.target}
                            </h4>

                            {/* Meta row: Performed By + IP */}
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              <div className="flex items-center gap-1.5">
                                <FiUser size={12} className="text-slate-300" />
                                <span>By: <span className="text-slate-600 font-bold">{log.user || 'System'}</span></span>
                              </div>
                              {log.ipAddress && log.ipAddress !== '127.0.0.1' && (
                                <div className="flex items-center gap-1.5">
                                  <FiWifi size={12} className="text-slate-300" />
                                  <span>IP: <span className="font-mono text-slate-500">{log.ipAddress}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 ml-auto">
                                <FiHash size={11} className="text-slate-300" />
                                <span className="font-mono text-slate-300">LOG-{log._id?.toString().slice(-8).toUpperCase() || '--------'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && !error && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Page {page} of {pagination.pages} &bull; {pagination.total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#189D91] hover:border-[#189D91]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft size={16} />
                </button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                  if (pageNum > pagination.pages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                        pageNum === page
                          ? 'bg-[#189D91] text-white border-[#189D91] shadow-sm shadow-teal-500/10'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#189D91]/30 hover:text-[#189D91]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#189D91] hover:border-[#189D91]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Empty footer - Load more link when no pagination needed */}
          {!loading && !error && logs.length > 0 && pagination.pages <= 1 && (
            <div className="p-5 text-center border-t border-slate-100 bg-slate-50/30">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                End of Log History
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ActivityPage;
