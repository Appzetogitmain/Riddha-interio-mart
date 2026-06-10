import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import {
  LuSearch,
  LuBanknote,
  LuClock,
  LuRefreshCw,
  LuChevronDown,
  LuX,
  LuIndianRupee,
  LuBuilding2,
  LuShieldCheck
} from 'react-icons/lu';
import { FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const STATUS_TABS = ['all', 'requested', 'completed', 'rejected'];

const statusConfig = {
  requested: { label: 'Requested', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-400' }
};

const SellerPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({ requested: { count: 0, totalAmount: 0 }, completed: { count: 0, totalAmount: 0 }, rejected: { count: 0, totalAmount: 0 } });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 50 });
      if (activeTab !== 'all') params.append('status', activeTab);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const { data } = await api.get(`/wallets/admin/payouts?${params.toString()}`);
      if (data.success) {
        setPayouts(data.data);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch seller payouts:', err);
      toast.error('Failed to load payout requests.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const openApproveModal = (payout) => {
    setSelectedPayout(payout);
    setUtrNumber('');
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter a UTR / Transaction Reference number.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/wallets/admin/payouts/${selectedPayout._id}/approve`, {
        transactionReference: utrNumber.trim(),
        notes: adminNotes.trim()
      });
      if (data.success) {
        toast.success(`Payout of ₹${selectedPayout.amount.toLocaleString()} approved successfully!`);
        setShowApproveModal(false);
        fetchPayouts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve payout.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = (payout) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left min-w-[240px]">
        <p className="text-sm font-bold text-gray-800">
          Reject payout of ₹{payout.amount.toLocaleString()} for <span className="text-red-700">{payout.seller?.shopName || payout.seller?.fullName}</span>?
        </p>
        <p className="text-xs text-gray-500">This will refund the amount back to the seller's withdrawable balance.</p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.post(`/wallets/admin/payouts/${payout._id}/reject`, {
                  notes: 'Rejected by Admin'
                });
                if (data.success) {
                  toast.success('Payout rejected. Balance refunded to seller.');
                  fetchPayouts();
                }
              } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to reject payout.');
              }
            }}
            className="px-4 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 transition-colors"
          >
            Reject & Refund
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  const exportCSV = () => {
    if (payouts.length === 0) { toast.error('No payout data to export.'); return; }
    const headers = ['Seller Name', 'Shop Name', 'Amount (₹)', 'Bank', 'Account No.', 'IFSC', 'Status', 'Requested Date', 'UTR'];
    const rows = payouts.map(p => [
      p.seller?.fullName || '-',
      p.seller?.shopName || '-',
      p.amount,
      p.bankDetails?.bankName || '-',
      p.bankDetails?.accountNumber || '-',
      p.bankDetails?.ifscCode || '-',
      p.status,
      new Date(p.createdAt).toLocaleDateString('en-IN'),
      p.transactionReference || '-'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `seller_payouts_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Payout report exported.');
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
              Seller Payouts
            </h1>
            <p className="text-warm-sand text-sm">
              Review, approve, or reject withdrawal requests from sellers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPayouts}
              className="p-3 border border-soft-oatmeal rounded-xl text-warm-sand hover:bg-soft-oatmeal/20 transition-all"
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
            { label: 'Pending Requests', count: stats.requested?.count || 0, amount: stats.requested?.totalAmount || 0, icon: LuClock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Completed', count: stats.completed?.count || 0, amount: stats.completed?.totalAmount || 0, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', count: stats.rejected?.count || 0, amount: stats.rejected?.totalAmount || 0, icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Processing', count: stats.processing?.count || 0, amount: stats.processing?.totalAmount || 0, icon: LuBanknote, color: 'text-blue-600', bg: 'bg-blue-50' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{s.label}</p>
                <h4 className="text-lg font-black text-deep-espresso leading-none">₹{(s.amount || 0).toLocaleString()}</h4>
                <p className="text-[10px] text-warm-sand font-semibold">{s.count} request{s.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-sm overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-soft-oatmeal overflow-x-auto scrollbar-hide">
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
                {tab === 'all' ? 'All Requests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-soft-oatmeal">
            <div className="relative max-w-md">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
              <input
                type="text"
                placeholder="Search seller name or shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/10 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Seller</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Bank Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Requested</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/40">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="h-16 bg-gray-50/40 px-6" />
                    </tr>
                  ))
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center">
                      <LuBanknote size={36} className="mx-auto text-soft-oatmeal mb-3" />
                      <p className="text-sm font-bold text-warm-sand">No payout requests found.</p>
                    </td>
                  </tr>
                ) : payouts.map(p => {
                  const cfg = statusConfig[p.status] || statusConfig.requested;
                  return (
                    <tr key={p._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-800/10 flex items-center justify-center text-red-800 shrink-0">
                            <LuBuilding2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-deep-espresso text-sm">{p.seller?.shopName || 'N/A'}</p>
                            <p className="text-[10px] text-warm-sand font-semibold">{p.seller?.fullName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-black text-deep-espresso">₹{p.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {p.bankDetails?.accountNumber ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-deep-espresso">{p.bankDetails.bankName || '-'}</p>
                            <p className="text-[10px] text-warm-sand font-semibold font-mono">
                              {'X'.repeat(Math.max(0, (p.bankDetails.accountNumber.length || 4) - 4)) + p.bankDetails.accountNumber.slice(-4)}
                            </p>
                            <p className="text-[10px] text-warm-sand font-semibold">{p.bankDetails.ifscCode}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold">No bank details</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {p.transactionReference && (
                          <p className="text-[9px] text-warm-sand font-semibold mt-1">UTR: {p.transactionReference}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/60 font-semibold">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'requested' || p.status === 'processing' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openApproveModal(p)}
                              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all active:scale-95 shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p)}
                              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'completed' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {p.status === 'completed' ? '✓ Disbursed' : '✗ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowApproveModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-700 p-6 text-white relative">
              <button
                onClick={() => setShowApproveModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <LuX size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <LuShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Approve Payout</h2>
                  <p className="text-white/70 text-xs">Confirm disbursement for {selectedPayout.seller?.shopName}</p>
                </div>
              </div>
            </div>

            {/* Payout Summary */}
            <div className="px-6 pt-6">
              <div className="bg-soft-oatmeal/20 rounded-2xl p-4 border border-soft-oatmeal space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-warm-sand uppercase tracking-wider">Amount</span>
                  <span className="text-2xl font-black text-deep-espresso">₹{selectedPayout.amount.toLocaleString()}</span>
                </div>
                {selectedPayout.bankDetails?.accountNumber && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-warm-sand">Bank</span>
                      <span className="font-bold text-deep-espresso">{selectedPayout.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-warm-sand">Account</span>
                      <span className="font-bold text-deep-espresso font-mono">{'X'.repeat(Math.max(0, (selectedPayout.bankDetails.accountNumber.length || 4) - 4)) + selectedPayout.bankDetails.accountNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-warm-sand">IFSC</span>
                      <span className="font-bold text-deep-espresso">{selectedPayout.bankDetails.ifscCode}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                  UTR / Transaction Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LuIndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
                  <input
                    required
                    type="text"
                    placeholder="Enter UTR or reference number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Admin Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes for record-keeping..."
                  rows={2}
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-warm-sand bg-soft-oatmeal/20 hover:bg-soft-oatmeal/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-800/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheckCircle size={16} />}
                  {submitting ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default SellerPayoutsPage;
