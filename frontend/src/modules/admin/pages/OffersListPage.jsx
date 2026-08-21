import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { OFFER_TYPES, slugToLabel } from '../../../shared/constants/offerTypes';

const OffersListPage = () => {
  const navigate = useNavigate();
  const { typeSlug } = useParams();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: typeSlug ? slugToLabel(typeSlug) : 'all',
    approvalStatus: 'all'
  });
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.type && filter.type !== 'all') params.type = filter.type;
      if (filter.approvalStatus && filter.approvalStatus !== 'all') params.approvalStatus = filter.approvalStatus;

      const res = await api.get('/offers', { params });
      setOffers(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load offers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setApprovingId(id);
      await api.patch(`/offers/${id}/approval`, { approvalStatus: 'approved' });
      toast.success('Offer approved');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to approve offer');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      setApprovingId(id);
      await api.patch(`/offers/${id}/approval`, {
        approvalStatus: 'rejected',
        rejectionReason: reason || ''
      });
      toast.success('Offer rejected');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to reject offer');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await api.delete(`/offers/${id}`);
      toast.success('Offer deleted successfully');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCreatorInfo = (offer) => {
    if (offer.creatorType === 'Admin') return 'Admin';
    return 'Vendor';
  };

  const isOfferActive = (offer) => {
    const now = new Date();
    return offer.isActive && offer.approvalStatus === 'approved' &&
      new Date(offer.startDate) <= now && new Date(offer.endDate) >= now;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Offers & Deals Management</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve vendor offers</p>
        </div>
        <button
          onClick={() => navigate('/admin/offers/add')}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <Plus size={20} /> Create Offer
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Type</label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {OFFER_TYPES.map(t => (
              <option key={t.slug} value={t.label}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Status</label>
          <select
            value={filter.approvalStatus}
            onChange={(e) => setFilter({ ...filter, approvalStatus: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No offers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Creator</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Products</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Period</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offers.map(offer => (
                  <tr key={offer._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{offer.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{offer.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {offer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getCreatorInfo(offer)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{offer.products.length}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {offer.approvalStatus === 'pending' && (
                            <Clock size={14} className="text-yellow-600" />
                          )}
                          {offer.approvalStatus === 'approved' && (
                            <CheckCircle size={14} className="text-green-600" />
                          )}
                          {offer.approvalStatus === 'rejected' && (
                            <XCircle size={14} className="text-red-600" />
                          )}
                          <span className={`text-xs font-semibold ${
                            offer.approvalStatus === 'pending' ? 'text-yellow-700' :
                            offer.approvalStatus === 'approved' ? 'text-green-700' :
                            'text-red-700'
                          }`}>
                            {offer.approvalStatus.charAt(0).toUpperCase() + offer.approvalStatus.slice(1)}
                          </span>
                        </div>
                        {isOfferActive(offer) && (
                          <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                            <Eye size={12} /> Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {offer.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(offer._id)}
                              disabled={approvingId === offer._id}
                              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs rounded transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(offer._id)}
                              disabled={approvingId === offer._id}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/admin/offers/edit/${offer._id}`)}
                          className="p-2 hover:bg-slate-100 rounded transition text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="p-2 hover:bg-red-100 rounded transition text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersListPage;
