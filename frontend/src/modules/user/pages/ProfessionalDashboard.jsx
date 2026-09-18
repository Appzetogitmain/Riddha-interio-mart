import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { 
  FiInbox, 
  FiBriefcase, 
  FiCheckCircle, 
  FiClock, 
  FiPhone, 
  FiMessageSquare, 
  FiUser, 
  FiStar, 
  FiToggleLeft, 
  FiToggleRight, 
  FiRefreshCw, 
  FiDollarSign,
  FiChevronRight,
  FiSliders,
  FiCalendar
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import BroadcastNotificationModal from '../components/BroadcastNotificationModal';

const ProfessionalDashboard = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('broadcasts'); // 'broadcasts', 'active', 'history'
  const [availability, setAvailability] = useState(true);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [consultancyAmount, setConsultancyAmount] = useState('');
  const [submittingAmount, setSubmittingAmount] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !user.professionalProfile?.isProfessional) {
      toast.error('Professional access required');
      navigate('/');
      return;
    }
    setAvailability(user.professionalProfile?.availabilityStatus ?? true);
    fetchRequests();
  }, [user, userLoading, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/service-requests/professional');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id) => {
    try {
      await api.put(`/v1/service-requests/${id}/accept`);
      toast.success('🎉 Request accepted! Customer contact details unlocked.');
      fetchRequests();
      setActiveTab('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept request');
      fetchRequests();
    }
  };

  const handleOpenAmountModal = (id) => {
    setSelectedRequestId(id);
    setConsultancyAmount('');
    setShowAmountModal(true);
  };

  const submitConsultancyDone = async () => {
    const amount = Number(consultancyAmount);
    if (!consultancyAmount || isNaN(amount) || amount <= 0) {
      return toast.error('Please enter a valid amount greater than 0.');
    }

    try {
      setSubmittingAmount(true);
      await api.put(`/v1/service-requests/${selectedRequestId}/consultancy-done`, { amount });
      toast.success('Consultancy complete! Waiting for customer payment.');
      setShowAmountModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update request');
    } finally {
      setSubmittingAmount(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const activeRequests = requests.filter(r => r.status === 'Consultancy' || r.status === 'Pending Payment');
  const completedRequests = requests.filter(r => r.status === 'Hired' || r.status === 'Completed');

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <FiRefreshCw className="animate-spin text-[#189D91]" size={32} />
        <p className="text-gray-500 font-semibold text-sm">Loading Professional Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Broadcast Notification Popup */}
      <BroadcastNotificationModal user={user} onAcceptSuccess={() => { fetchRequests(); setActiveTab('active'); }} />

      <div className="max-w-7xl mx-auto">
        {/* Header Title & Professional Profile Badge */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-[#189D91]/15 rounded-2xl flex items-center justify-center text-[#189D91] font-black text-2xl border border-[#189D91]/20">
              {user.fullName ? user.fullName[0].toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900">{user.fullName}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#189D91]/10 text-[#189D91] border border-[#189D91]/20 uppercase tracking-wider">
                  {user.professionalProfile?.category || 'Professional'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <FiStar size={14} className="fill-amber-400 text-amber-400" />
                  {user.professionalProfile?.rating || 5.0} Rating
                </span>
                <span>•</span>
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          {/* Quick Refresh & Availability */}
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchRequests} 
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Refresh leads"
            >
              <FiRefreshCw size={18} />
            </button>

            <div className="flex items-center gap-2 bg-gray-50 p-2 px-3 rounded-xl border">
              <span className="text-xs font-bold text-gray-600">Status:</span>
              <button 
                onClick={() => setAvailability(!availability)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  availability ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${availability ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {availability ? 'Online & Available' : 'Offline'}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Main Grid Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Compact Sidebar */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-1">
              <button
                onClick={() => setActiveTab('broadcasts')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'broadcasts'
                    ? 'bg-[#189D91] text-white shadow-lg shadow-[#189D91]/20 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiInbox size={18} />
                  <span className="text-sm">Broadcast Leads</span>
                </div>
                {pendingRequests.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    activeTab === 'broadcasts' ? 'bg-white text-[#189D91]' : 'bg-amber-400 text-gray-900'
                  }`}>
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'active'
                    ? 'bg-[#189D91] text-white shadow-lg shadow-[#189D91]/20 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiBriefcase size={18} />
                  <span className="text-sm">Active Jobs</span>
                </div>
                {activeRequests.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    activeTab === 'active' ? 'bg-white text-[#189D91]' : 'bg-[#189D91]/15 text-[#189D91]'
                  }`}>
                    {activeRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#189D91] text-white shadow-lg shadow-[#189D91]/20 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiCheckCircle size={18} />
                  <span className="text-sm">Completed History</span>
                </div>
                <span className="text-xs text-gray-400 font-bold">{completedRequests.length}</span>
              </button>
            </div>

            {/* Quick Metrics Widget */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Summary</h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{requests.length}</p>
                  <p className="text-[11px] text-gray-300">Total Leads</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black text-emerald-400">{completedRequests.length}</p>
                  <p className="text-[11px] text-gray-300">Jobs Hired</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Panel Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Tab 1: Broadcast Leads */}
            {activeTab === 'broadcasts' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">New Broadcast Leads</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Leads broadcasted to registered {user.professionalProfile?.category || 'professionals'}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                    ⚡ First-Come, First-Served
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <FiInbox className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-600 font-bold">No new broadcast leads right now.</p>
                    <p className="text-xs text-gray-400 mt-1">Keep your availability status online to receive incoming requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((req) => (
                      <div key={req._id} className="border border-gray-200 hover:border-[#189D91]/40 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#189D91]/10 text-[#189D91] font-bold text-xs">
                                {req.category} Request
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <FiClock size={12} />
                                {new Date(req.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-800 font-medium text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
                              {req.projectDetails || 'No project description provided.'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <FiUser className="text-gray-400" />
                              Requested by: <strong className="text-gray-700">{req.customerId?.fullName || 'Client'}</strong>
                            </p>
                          </div>

                          <button
                            onClick={() => acceptRequest(req._id)}
                            className="bg-[#189D91] hover:bg-[#137c72] text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-[#189D91]/20 transition-all whitespace-nowrap self-end sm:self-center"
                          >
                            Accept Lead
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Active Jobs */}
            {activeTab === 'active' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Active Consultations & Jobs</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Contact clients directly and finalize consultancy fees.</p>
                </div>

                {activeRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <FiBriefcase className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-600 font-bold">No active jobs right now.</p>
                    <p className="text-xs text-gray-400 mt-1">Accept incoming broadcast leads to start consultations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRequests.map((req) => (
                      <div key={req._id} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                        <div className="flex justify-between items-start border-b pb-4">
                          <div>
                            <span className="text-xs font-bold text-[#189D91] uppercase tracking-wider block mb-1">Client Consultation</span>
                            <h3 className="text-lg font-bold text-gray-900">{req.customerId?.fullName || 'Client'}</h3>
                            <p className="text-xs text-gray-500">{req.customerId?.email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            req.status === 'Consultancy' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'Consultancy' ? 'In Consultation' : 'Payment Pending'}
                          </span>
                        </div>

                        {/* Project Details */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700">
                          <strong className="block text-xs text-gray-400 uppercase mb-1">Project Details:</strong>
                          {req.projectDetails}
                        </div>

                        {/* Direct Communication Bar */}
                        <div className="bg-[#189D91]/5 border border-[#189D91]/15 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-[#189D91] uppercase">Client Phone Contact</p>
                            <p className="text-sm font-black text-gray-800">{req.customerId?.phone || 'Phone not listed'}</p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {req.customerId?.phone && (
                              <>
                                <a
                                  href={`tel:${cleanPhone(req.customerId.phone)}`}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                                >
                                  <FiPhone size={14} /> Call Client
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhone(req.customerId.phone)}?text=${encodeURIComponent(
                                    `Hello ${req.customerId.fullName}, I accepted your ${req.category} request on Riddha Interio Mart.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                                >
                                  <FaWhatsapp size={16} /> WhatsApp
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Action Buttons */}
                        {req.status === 'Consultancy' && (
                          <button
                            onClick={() => handleOpenAmountModal(req._id)}
                            className="w-full bg-[#189D91] hover:bg-[#137c72] text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <FiCheckCircle size={16} /> Mark Consultancy Done & Request Fee
                          </button>
                        )}

                        {req.status === 'Pending Payment' && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs font-bold text-amber-800">
                            Waiting for client to pay ₹{req.payment?.amount} to finalize hiring.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Completed History */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Completed Job History</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Past hiring history and completed consultations.</p>
                </div>

                {completedRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <FiCheckCircle className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-600 font-bold">No completed jobs yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedRequests.map((req) => (
                      <div key={req._id} className="border p-4 rounded-xl flex justify-between items-center bg-emerald-50/30 border-emerald-100">
                        <div>
                          <h4 className="font-bold text-gray-800">{req.customerId?.fullName || 'Client'}</h4>
                          <p className="text-xs text-gray-500">{req.projectDetails}</p>
                          <p className="text-xs text-emerald-700 font-semibold mt-1">Paid: ₹{req.payment?.amount || 0}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                          Completed / Hired
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consultancy Fee Input Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Set Consultancy Fee Amount</h3>
            <p className="text-xs text-gray-500">Enter the consultancy or project fee amount to request from the customer.</p>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Fee Amount (in ₹ INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={consultancyAmount}
                  onChange={(e) => setConsultancyAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#189D91]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowAmountModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitConsultancyDone}
                disabled={submittingAmount}
                className="bg-[#189D91] hover:bg-[#137c72] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {submittingAmount ? 'Submitting...' : 'Send Fee Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDashboard;
