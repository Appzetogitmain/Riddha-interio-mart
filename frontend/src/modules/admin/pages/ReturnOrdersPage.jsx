import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCcw, FiCheck, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import TableSkeleton from '../../../shared/components/skeletons/TableSkeleton';
import PageWrapper from '../components/PageWrapper';

const ReturnOrdersPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async () => {
    try {
      const res = await api.get('/returns');
      if (res.data.success) {
        setReturns(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await api.put(`/returns/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`Return marked as ${status}`);
        fetchReturns();
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAutoAssign = async (id) => {
    try {
      toast.loading('Assigning delivery boy...', { id: 'auto-assign' });
      const res = await api.post(`/returns/${id}/auto-assign`);
      if (res.data.success) {
        toast.success('Auto-assignment triggered successfully', { id: 'auto-assign' });
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to trigger auto assignment', { id: 'auto-assign' });
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-display">All Return Requests</h1>
            <p className="text-gray-500 text-sm mt-1">Global oversight of all platform returns.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : returns.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">No returns found on the platform.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider font-bold text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Product / Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Seller</th>
                    <th className="px-6 py-4">Status & Reason</th>
                    <th className="px-6 py-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {returns.map((ret) => (
                    <tr key={ret._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={ret.product?.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          <div>
                            <p className="font-bold text-gray-900 max-w-[200px] truncate">{ret.product?.name}</p>
                            <p className="text-[10px] text-gray-500">Order: #{ret.order?.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{ret.user?.fullName}</p>
                        <p className="text-xs text-gray-500">{ret.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold">
                          {ret.seller?.shopName || ret.seller?.fullName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            ret.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                            ret.status === 'Approved' ? 'bg-blue-50 text-blue-600' :
                            ret.status === 'Completed' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {ret.status}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold max-w-[150px] truncate" title={ret.reason}>
                            {ret.reason}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedReturn(ret)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest"
                          >
                            View Details
                          </button>
                          {ret.status === 'Pending' && (
                             <button
                               onClick={() => handleUpdateStatus(ret._id, 'Approved')}
                               disabled={processingId === ret._id}
                               className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                             >
                               Approve
                             </button>
                          )}
                          {ret.status !== 'Completed' && ret.status !== 'Pending' && (
                             <button
                               onClick={() => handleUpdateStatus(ret._id, 'Completed')}
                               disabled={processingId === ret._id}
                               className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-lg hover:bg-green-100 transition-colors uppercase tracking-widest"
                             >
                               Force Complete
                             </button>
                          )}
                          {ret.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(ret._id, 'Rejected')}
                              disabled={processingId === ret._id}
                              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors uppercase tracking-widest"
                            >
                              Force Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-gray-900">Return Details</h2>
              <button onClick={() => setSelectedReturn(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FiX size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Info</h3>
                  <p className="font-bold text-gray-900">{selectedReturn.user?.fullName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.user?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.user?.phone || selectedReturn.user?.mobileNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Seller Info</h3>
                  <p className="font-bold text-gray-900">{selectedReturn.seller?.shopName || selectedReturn.seller?.fullName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.seller?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.seller?.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Delivery Boy</h3>
                  {selectedReturn.deliveryBoy ? (
                    <>
                      <p className="font-bold text-gray-900">{selectedReturn.deliveryBoy.fullName}</p>
                      <p className="text-sm text-gray-500">{selectedReturn.deliveryBoy.phone || 'N/A'}</p>
                      <p className="text-sm text-gray-500 mt-1 capitalize text-blue-600 font-semibold">{selectedReturn.deliveryStatus}</p>
                    </>
                  ) : (
                    <p className="font-bold text-gray-500 mt-4 text-center italic">Not Assigned</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                <img src={selectedReturn.product?.images?.[0]} alt="" className="w-16 h-16 rounded-lg object-cover bg-white shadow-sm" />
                <div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Product & Order</h3>
                  <p className="font-bold text-blue-900">{selectedReturn.product?.name}</p>
                  <p className="text-sm text-blue-700/70 mt-0.5">Order ID: {selectedReturn.order}</p>
                  <p className="text-sm font-bold text-blue-800 mt-1">Status: <span className="uppercase tracking-widest">{selectedReturn.status}</span></p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Return Reason & Description</h3>
                <p className="font-bold text-gray-900 text-lg mb-2">{selectedReturn.reason}</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedReturn.description || 'No additional description provided.'}</p>
              </div>

              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiImage /> Return Images ({selectedReturn.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedReturn.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors group">
                        <img src={img} alt="Return proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedReturn.status === 'Pending' && (
                <button
                  onClick={() => { handleUpdateStatus(selectedReturn._id, 'Approved'); setSelectedReturn(null); }}
                  className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Approve Return
                </button>
              )}
              {selectedReturn.status === 'Approved' && (!selectedReturn.deliveryBoy) && (
                <button
                  onClick={() => { handleAutoAssign(selectedReturn._id); setSelectedReturn(null); }}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Auto Assign Delivery
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ReturnOrdersPage;
