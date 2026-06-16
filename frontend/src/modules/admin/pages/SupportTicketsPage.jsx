import React, { useState, useEffect, useRef, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import {
  LuSearch,
  LuClock,
  LuRefreshCw,
  LuChevronDown,
  LuX,
  LuBuilding2,
  LuInbox,
  LuSend,
  LuPaperclip,
  LuFileText
} from 'react-icons/lu';
import { FiDownload, FiCheckCircle, FiXCircle, FiHelpCircle } from 'react-icons/fi';

const STATUS_TABS = ['all', 'Open', 'In Progress', 'Resolved', 'Closed'];

const statusConfig = {
  'Open': { label: 'Open', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  'In Progress': { label: 'In Progress', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Resolved': { label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'Closed': { label: 'Closed', color: 'text-slate-500 bg-slate-50 border-slate-200', dot: 'bg-slate-400' }
};

const priorityConfig = {
  'Low': { color: 'bg-slate-100 text-slate-600' },
  'Medium': { color: 'bg-blue-50 text-blue-600' },
  'High': { color: 'bg-orange-50 text-orange-600 font-bold' },
  'Urgent': { color: 'bg-red-50 text-red-600 font-extrabold animate-pulse' }
};

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Detail drawer states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTickets = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (activeTab !== 'all') params.append('status', activeTab);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const { data } = await api.get(`/support/admin/tickets?${params.toString()}`);
      if (data.success) {
        setTickets(data.data);
        
        // Re-compute quick stats dynamically based on all tickets
        const allRes = await api.get('/support/admin/tickets?limit=500');
        if (allRes.data.success) {
          const allTickets = allRes.data.data;
          setStats({
            total: allTickets.length,
            active: allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
            resolved: allTickets.filter(t => t.status === 'Resolved').length,
            closed: allTickets.filter(t => t.status === 'Closed').length
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
      toast.error('Failed to load support inquiries.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle selected ticket refresh for conversation update
  const refreshSelectedTicket = async (ticketId) => {
    try {
      const { data } = await api.get(`/support/tickets/${ticketId}`);
      if (data.success) {
        setSelectedTicket(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh ticket detail:', err);
    }
  };

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket, selectedTicket?.replies]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const { data } = await api.post(`/support/tickets/${selectedTicket._id}/replies`, {
        text: replyText.trim()
      });
      if (data.success) {
        setSelectedTicket(data.data);
        setReplyText('');
        toast.success('Response sent successfully.');
        fetchTickets(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      const { data } = await api.patch(`/support/admin/tickets/${selectedTicket._id}/status`, {
        status: newStatus
      });
      if (data.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        refreshSelectedTicket(selectedTicket._id);
        fetchTickets(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error('No tickets data to export.');
      return;
    }
    const headers = ['Ticket ID', 'Seller Name', 'Shop Name', 'Subject', 'Category', 'Priority', 'Status', 'Last Activity'];
    const rows = tickets.map(t => [
      t.ticketId,
      t.seller?.fullName || '-',
      t.seller?.businessName || '-',
      t.subject,
      t.category,
      t.priority,
      t.status,
      new Date(t.updatedAt).toLocaleDateString('en-IN')
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `support_tickets_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tickets log exported successfully.');
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
              Support Inquiries
            </h1>
            <p className="text-warm-sand text-sm">
              Resolve technical, logistical, and wallet concerns raised by platform merchants.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTickets(true)}
              className="p-3 border border-soft-oatmeal rounded-xl text-warm-sand hover:bg-soft-oatmeal/20 transition-all bg-white"
              title="Refresh Inquiries"
            >
              <LuRefreshCw size={18} />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-red-800 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95"
            >
              <FiDownload size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Inquiries', count: stats.total, icon: LuInbox, color: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Active Support', count: stats.active, icon: LuClock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Resolved Tickets', count: stats.resolved, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Closed Cases', count: stats.closed, icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-50' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{s.label}</p>
                <h4 className="text-2xl font-black text-deep-espresso leading-none mt-1">{s.count}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Table & Filtering */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-soft-oatmeal overflow-x-auto scrollbar-hide bg-slate-50/20">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'border-red-800 text-red-800 bg-red-50/30'
                    : 'border-transparent text-warm-sand hover:text-deep-espresso hover:bg-soft-oatmeal/10'
                }`}
              >
                {tab === 'all' ? 'All Inquiries' : tab}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-soft-oatmeal bg-white">
            <div className="relative max-w-md">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
              <input
                type="text"
                placeholder="Search ticket ID, subject or seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/10 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Ticket ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Merchant</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/40">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="h-16 bg-gray-50/40 px-6" />
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-14 text-center">
                      <FiHelpCircle size={36} className="mx-auto text-soft-oatmeal mb-3" />
                      <p className="text-sm font-bold text-warm-sand">No support inquiries found.</p>
                    </td>
                  </tr>
                ) : tickets.map(t => {
                  const statusCfg = statusConfig[t.status] || statusConfig.Open;
                  const priorityCfg = priorityConfig[t.priority] || priorityConfig.Low;
                  return (
                    <tr 
                      key={t._id} 
                      onClick={() => refreshSelectedTicket(t._id)}
                      className="hover:bg-soft-oatmeal/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                        {t.ticketId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-red-800/10 flex items-center justify-center text-red-800 shrink-0">
                            <LuBuilding2 size={15} />
                          </div>
                          <div>
                            <p className="font-bold text-deep-espresso text-xs leading-tight">{t.seller?.businessName || 'N/A'}</p>
                            <p className="text-[10px] text-warm-sand font-semibold">{t.seller?.ownerName || t.seller?.fullName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-deep-espresso text-xs line-clamp-1 max-w-xs">{t.subject}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-deep-espresso/60">
                        {t.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${priorityCfg.color}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); refreshSelectedTicket(t._id); }}
                          className="px-4 py-2 border border-soft-oatmeal text-deep-espresso hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Open Thread
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Support Chat / Ticket Details Drawer */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-deep-espresso/40 backdrop-blur-sm transition-opacity"
            />

            {/* Drawer */}
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-soft-oatmeal z-10 animate-slide-in">
              
              {/* Header */}
              <div className="p-6 border-b border-soft-oatmeal bg-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-400">{selectedTicket.ticketId}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${priorityConfig[selectedTicket.priority]?.color}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-deep-espresso line-clamp-1">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-soft-oatmeal flex items-center justify-center text-warm-sand hover:text-deep-espresso transition-all flex-shrink-0"
                >
                  <LuX size={16} />
                </button>
              </div>

              {/* Status Action Bar */}
              <div className="px-6 py-3 border-b border-soft-oatmeal bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-warm-sand">Manage Case Status:</span>
                <div className="flex gap-1">
                  {['Open', 'In Progress', 'Resolved', 'Closed'].map(st => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        selectedTicket.status === st
                          ? 'bg-deep-espresso text-white shadow-sm'
                          : 'bg-white border border-soft-oatmeal text-warm-sand hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Thread Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
                {/* Description Box */}
                <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-warm-sand">
                    <span>Original Store Inquiry</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono lowercase tracking-normal">
                      Category: {selectedTicket.category}
                    </span>
                  </div>
                  <p className="text-xs text-deep-espresso/80 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                  
                  {/* Attachments */}
                  {selectedTicket.attachments?.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[9px] font-bold text-warm-sand uppercase tracking-wider mb-2">Attached Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.attachments.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="h-14 w-24 rounded-xl border border-soft-oatmeal relative group overflow-hidden bg-slate-100 block cursor-pointer"
                          >
                            {url.toLowerCase().endsWith('.pdf') ? (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[9px] font-bold text-slate-400 gap-1">
                                <LuFileText size={16} className="text-red-700" />
                                <span>PDF Doc</span>
                              </div>
                            ) : (
                              <img src={url} alt="Inquiry Attachment" className="w-full h-full object-cover" />
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline Divider */}
                <div className="text-center relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-soft-oatmeal"></div></div>
                  <span className="relative z-10 px-3 bg-slate-50 text-[9px] font-bold text-warm-sand uppercase tracking-widest">Conversation Log</span>
                </div>

                {/* Messages Thread */}
                <div className="space-y-4">
                  {selectedTicket.replies?.length > 0 ? (
                    selectedTicket.replies.map((reply, i) => {
                      const isAdmin = reply.senderModel === 'Admin';
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} gap-1`}
                        >
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[9px] font-bold text-warm-sand">
                              {isAdmin ? 'You (Support)' : 'Store Owner'}
                            </span>
                            <span className="text-[8px] text-slate-300 font-semibold font-mono">
                              {new Date(reply.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isAdmin
                                ? 'bg-red-800 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 border border-soft-oatmeal rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{reply.text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-warm-sand text-[10px] font-semibold uppercase tracking-wider">
                      No communications recorded. Type a response below to initiate support.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Form */}
              <div className="p-4 border-t border-soft-oatmeal bg-white">
                {selectedTicket.status === 'Closed' ? (
                  <div className="text-center py-3 bg-slate-50 border border-soft-oatmeal rounded-xl text-[10px] font-bold text-warm-sand uppercase tracking-wider">
                    This support ticket has been closed. Reopen it by changing status above.
                  </div>
                ) : (
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type diagnostic information or follow-up details..."
                      className="flex-1 bg-slate-50 border border-soft-oatmeal focus:border-slate-200 focus:bg-white rounded-xl px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isReplying}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isReplying || !replyText.trim()}
                      className="w-10 h-10 rounded-xl bg-red-800 hover:bg-deep-espresso text-white flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 shadow-lg shadow-red-900/10"
                    >
                      {isReplying ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <LuSend size={16} />
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default SupportTicketsPage;
