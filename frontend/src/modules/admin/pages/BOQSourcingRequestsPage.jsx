import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiCheckCircle, FiClock, FiAlertCircle, FiSearch,
  FiFilter, FiDollarSign, FiUser, FiExternalLink, FiEdit3, FiCheck, FiX
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const BOQSourcingRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'in-review' | 'sourced'
  const [searchTerm, setSearchTerm] = useState('');

  // Sourcing Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalStatus, setModalStatus] = useState('sourced');
  const [modalPrice, setModalPrice] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSourcingRequests();
  }, []);

  const fetchSourcingRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/boqs/admin/sourcing-requests');
      if (res.data?.success && res.data?.data?.requests) {
        setRequests(res.data.data.requests);
      }
    } catch (e) {
      toast.error('Failed to fetch sourcing requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (req) => {
    setSelectedReq(req);
    setModalStatus(req.sourcingStatus === 'pending' ? 'in-review' : req.sourcingStatus);
    setModalPrice(req.item.unitCost || '');
    setModalNotes(req.item.sourcingNotes || '');
  };

  const handleUpdateSourcing = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      const res = await api.put(`/boqs/admin/sourcing-requests/${selectedReq.boqId}/items/${selectedReq.item._id}`, {
        sourcingStatus: modalStatus,
        unitCost: Number(modalPrice) || selectedReq.item.unitCost,
        notes: modalNotes
      });

      if (res.data?.success) {
        toast.success(`Sourcing status updated to ${modalStatus.toUpperCase()}`);
        setSelectedReq(null);
        fetchSourcingRequests();
      }
    } catch (e) {
      toast.error('Failed to update sourcing request.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filterStatus === 'all' || r.sourcingStatus === filterStatus;
    const matchesSearch = !searchTerm ||
      r.item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.boqName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.client?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.sourcingStatus === 'pending').length;
  const inReviewCount = requests.filter(r => r.sourcingStatus === 'in-review').length;
  const sourcedCount = requests.filter(r => r.sourcingStatus === 'sourced').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-2">
            <LuSparkles />
            <span>Procurement Control Center</span>
          </div>
          <h1 className="text-2xl font-bold font-display">BOQ Unlisted Sourcing Requests</h1>
          <p className="text-xs text-slate-300 mt-1">Review unlisted interior items requested by clients & designers, quote vendor prices, and link catalog products.</p>
        </div>

        <button
          onClick={fetchSourcingRequests}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-md shrink-0"
        >
          Refresh Requests
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Requests</span>
          <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-amber-600 font-semibold uppercase">Pending Review</span>
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-blue-600 font-semibold uppercase">In Procurement</span>
          <div className="text-2xl font-bold text-blue-600">{inReviewCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-emerald-600 font-semibold uppercase">Sourced & Linked</span>
          <div className="text-2xl font-bold text-emerald-600">{sourcedCount}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs">
        <div className="flex bg-slate-100 p-1 rounded-xl font-semibold gap-1">
          {[
            { id: 'all', label: `All (${requests.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'in-review', label: `In Review (${inReviewCount})` },
            { id: 'sourced', label: `Sourced (${sourcedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === tab.id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, BOQ name, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:outline-none"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading sourcing requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No sourcing requests match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">BOQ & Item Specs</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Est Unit Price</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="font-bold text-slate-900">{req.client?.fullName || req.client?.name || 'Client'}</div>
                      <div className="text-[10px] text-slate-400">{req.client?.email}</div>
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="font-bold text-amber-900 text-xs">{req.item.itemName}</div>
                      <div className="text-[10px] text-slate-500">BOQ: {req.boqName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {req.item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {req.item.quantity} {req.item.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                      Rs. {(req.item.unitCost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        req.sourcingStatus === 'sourced' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        req.sourcingStatus === 'in-review' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {req.sourcingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenModal(req)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg shadow-sm"
                      >
                        Process Sourcing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sourcing Modal */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Process Sourcing Request</h3>
                <button onClick={() => setSelectedReq(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <FiX className="text-lg" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{selectedReq.item.itemName}</div>
                <div className="text-slate-500">Client: {selectedReq.client?.email}</div>
                <div className="text-slate-500">Qty: {selectedReq.item.quantity} {selectedReq.item.unit}</div>
              </div>

              <form onSubmit={handleUpdateSourcing} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sourcing Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-review">In Review / Procuring</option>
                    <option value="sourced">Sourced & Confirmed</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor Quoted Unit Price (Rs.)</label>
                  <input
                    type="number"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Procurement Notes / Vendor Info</label>
                  <textarea
                    rows="2"
                    placeholder="Enter vendor details or catalog SKU link..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold rounded-xl shadow-sm"
                  >
                    {updating ? 'Updating...' : 'Save Sourcing Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BOQSourcingRequestsPage;
