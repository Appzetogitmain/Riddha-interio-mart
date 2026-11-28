import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  LuTruck, LuUser, LuMail, LuPhone, LuCheck, LuX, LuTrash2,
  LuSearch, LuFileText, LuShieldCheck, LuBriefcase,
  LuCircleCheck, LuCircleAlert, LuImage
} from 'react-icons/lu';
import { FiMoreVertical } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import Pagination, { usePagination } from '../../../shared/components/Pagination';

// ─── Tab Configuration ────────────────────────────────────────────────────────
const TABS = [
  { id: 'All',     label: 'All Partners',          filter: null },
  { id: 'Pending', label: 'Pending Verification',  filter: 'Pending' },
  { id: 'Active',  label: 'Active Fleet',           filter: 'Approved' },
  { id: 'Suspended', label: 'Suspended',            filter: 'Suspended' },
  { id: 'Rejected', label: 'Rejected',              filter: 'Rejected' },
];

// ─── Document Label Map ───────────────────────────────────────────────────────
const DOC_LABELS = {
  rc:          'RC Book (Vehicle Registration)',
  dl:          'Driving License',
  aadhar:      'Aadhar Card',
  bankDetails: 'Bank Account Proof',
  insurance:   'Vehicle Insurance',
  pollution:   'Pollution Certificate',
};

// ─── Status Badge Component ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Approved:  'text-green-700 bg-green-50 border-green-200',
    Rejected:  'text-red-700 bg-red-50 border-red-200',
    Suspended: 'text-orange-700 bg-orange-50 border-orange-200',
    Pending:   'text-amber-700 bg-amber-50 border-amber-200',
    Available: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Busy:      'text-blue-700 bg-blue-50 border-blue-200',
    Offline:   'text-gray-600 bg-gray-50 border-gray-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${styles[status] || 'text-gray-600 bg-gray-50'}`}>
      {status}
    </span>
  );
};

// ─── Document Viewer Drawer ───────────────────────────────────────────────────
const DocumentDrawer = ({ partner, onClose }) => {
  if (!partner) return null;
  const docs = partner.documents || {};
  const hasDocs = Object.values(docs).some(v => v && v.trim());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">{partner.fullName}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                Onboarding Documents
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 transition-colors"
            >
              <LuX size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!hasDocs ? (
              <div className="text-center py-16">
                <LuFileText size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400">No documents uploaded yet</p>
                <p className="text-xs text-slate-300 mt-1">Partner hasn't submitted onboarding documents.</p>
              </div>
            ) : (
              Object.entries(DOC_LABELS).map(([key, label]) => {
                const url = docs[key];
                if (!url || !url.trim()) return null;
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.startsWith('data:image');
                return (
                  <div key={key} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
                      <LuShieldCheck size={14} className="text-[var(--color-primary)] shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </div>
                    {isImage ? (
                      <div className="p-3">
                        <img
                          src={url}
                          alt={label}
                          className="w-full rounded-lg object-contain max-h-48 bg-white border border-slate-100"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:underline"
                        >
                          Open Full Size
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center gap-3">
                        <LuImage size={20} className="text-slate-300 shrink-0" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[var(--color-primary)] hover:underline truncate"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center">
              Verify all documents before approving
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
const DeleteModal = ({ partner, onConfirm, onCancel, isDeleting }) => (
  <AnimatePresence>
    {partner && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100"
        >
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LuCircleAlert size={24} className="text-red-500" />
          </div>
          <h3 className="text-center text-base font-bold text-slate-800 mb-2">Remove Partner Permanently?</h3>
          <p className="text-center text-xs text-slate-500 mb-6">
            <strong>{partner.fullName}</strong> will be deleted from the system. Their historical order records will be preserved with anonymized references.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LuTrash2 size={14} />
              )}
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─── Main Fleet Console Component ─────────────────────────────────────────────
const FleetConsole = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [docPartner, setDocPartner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/delivery');
      if (data.success) setPartners(data.data);
    } catch (err) {
      console.error('Failed to fetch partners:', err);
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.put(`/delivery/${id}/approve`, { approvalStatus: status });
      if (data.success) {
        setPartners(prev => prev.map(p => p._id === id ? { ...p, approvalStatus: status } : p));
        toast.success(`Partner ${status.toLowerCase()} successfully`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update partner status');
    }
    setActiveMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const { data } = await api.delete(`/delivery/${deleteTarget._id}`);
      if (data.success) {
        setPartners(prev => prev.filter(p => p._id !== deleteTarget._id));
        toast.success(data.message || 'Partner removed permanently');
      }
    } catch (err) {
      console.error('Failed to delete partner:', err);
      toast.error(err.response?.data?.error || 'Failed to delete partner');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Derived lists ──────────────────────────────────────────────────────────
  const currentTab = TABS.find(t => t.id === activeTab);
  const filtered = partners
    .filter(p => !currentTab.filter || p.approvalStatus === currentTab.filter)
    .filter(p =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts = {
    All:       partners.length,
    Pending:   partners.filter(p => p.approvalStatus === 'Pending').length,
    Active:    partners.filter(p => p.approvalStatus === 'Approved').length,
    Suspended: partners.filter(p => p.approvalStatus === 'Suspended').length,
    Rejected:  partners.filter(p => p.approvalStatus === 'Rejected').length,
  };

  const { pageItems: pagedFiltered, paginationProps: pagerFiltered } = usePagination(filtered, 10);
  return (
    <PageWrapper>
      <div className="w-full space-y-6 pb-12">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LuTruck className="text-[var(--color-primary)]" size={20} />
              Fleet Operations Console
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Manage, verify and operate your entire delivery fleet from one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {partners.filter(p => p.status === 'Available').length} Online Now
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {counts[tab.id]}
                </span>
              )}
              {tab.id === 'Pending' && counts.Pending > 0 && activeTab !== 'Pending' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
              )}
            </button>
          ))}
        </div>

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3">
          <div className="relative flex-grow">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-all text-sm font-semibold text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* ── Partner Table ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading fleet data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <LuTruck size={36} className="mx-auto text-slate-200 mb-3" />
              <h3 className="text-sm font-bold text-slate-500">No partners found</h3>
              <p className="text-xs text-slate-300 mt-1">Try adjusting your search or tab filter.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Delivery Partner', 'Contact Info', 'Vehicle', 'Performance', 'Live Status', 'Approval', 'Documents', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedFiltered.map((partner) => (
                    <tr key={partner._id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                            <LuUser size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{partner.fullName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              Joined {new Date(partner.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <LuMail size={11} className="text-slate-300 shrink-0" />
                            <span className="truncate max-w-[140px]">{partner.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <LuPhone size={11} className="text-slate-300 shrink-0" />
                            {partner.phone}
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit">
                            <LuTruck size={11} />
                            {partner.vehicleType}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                            {partner.vehicleNumber || 'No Plate'}
                          </p>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-slate-700">
                            {partner.totalDeliveries ?? 0}
                            <span className="text-[9px] font-bold text-slate-400 ml-1">delivered</span>
                          </p>
                          {(partner.activeDeliveries ?? 0) > 0 && (
                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                              {partner.activeDeliveries} active now
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Live Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={partner.status} />
                      </td>

                      {/* Approval */}
                      <td className="px-5 py-4">
                        <StatusBadge status={partner.approvalStatus} />
                      </td>

                      {/* Documents Button */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setDocPartner(partner)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[var(--color-primary)] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[var(--color-primary)] transition-all"
                        >
                          <LuFileText size={13} />
                          View Papers
                        </button>
                      </td>

                      {/* Actions Menu */}
                      <td className="px-5 py-4 text-right relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === partner._id ? null : partner._id)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FiMoreVertical size={16} />
                        </button>

                        {activeMenu === partner._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-10 top-3 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 overflow-hidden">
                              {/* Approve */}
                              {partner.approvalStatus !== 'Approved' && (
                                <button
                                  onClick={() => handleStatusUpdate(partner._id, 'Approved')}
                                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2.5"
                                >
                                  <LuCheck size={13} /> Approve Partner
                                </button>
                              )}
                              {/* Suspend */}
                              {partner.approvalStatus === 'Approved' && (
                                <button
                                  onClick={() => handleStatusUpdate(partner._id, 'Suspended')}
                                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2.5"
                                >
                                  <LuCircleAlert size={13} /> Suspend Partner
                                </button>
                              )}
                              {/* Unsuspend */}
                              {partner.approvalStatus === 'Suspended' && (
                                <button
                                  onClick={() => handleStatusUpdate(partner._id, 'Approved')}
                                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2.5"
                                >
                                  <LuCircleCheck size={13} /> Unsuspend
                                </button>
                              )}
                              {/* Reject */}
                              {partner.approvalStatus !== 'Rejected' && partner.approvalStatus !== 'Suspended' && (
                                <button
                                  onClick={() => handleStatusUpdate(partner._id, 'Rejected')}
                                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
                                >
                                  <LuX size={13} /> Reject Partner
                                </button>
                              )}
                              {/* Reconsider (pending) */}
                              {(partner.approvalStatus === 'Rejected') && (
                                <button
                                  onClick={() => handleStatusUpdate(partner._id, 'Pending')}
                                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2.5"
                                >
                                  <LuBriefcase size={13} /> Move to Pending
                                </button>
                              )}

                              <div className="h-px bg-slate-100 my-1 mx-3" />

                              {/* Permanent Delete */}
                              <button
                                onClick={() => { setDeleteTarget(partner); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                              >
                                <LuTrash2 size={13} /> Remove Permanently
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagerFiltered} />
            </>
          )}
        </div>
      </div>

      {/* ── Document Viewer Drawer ─────────────────────────────────────────── */}
      {docPartner && (
        <DocumentDrawer partner={docPartner} onClose={() => setDocPartner(null)} />
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <DeleteModal
        partner={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </PageWrapper>
  );
};

export default FleetConsole;
