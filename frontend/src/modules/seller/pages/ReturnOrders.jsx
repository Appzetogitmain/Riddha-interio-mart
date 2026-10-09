import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCcw, FiCheck, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import TableSkeleton from '../../../shared/components/skeletons/TableSkeleton';
import PageWrapper from '../components/PageWrapper';
import ReturnInspectionModal from '../components/ReturnInspectionModal';

const ReturnOrders = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async () => {
    try {
      const res = await api.get('/returns/seller');
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
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReceiveModal = (ret) => {
    setSelectedReturn(ret);
    setIsInspectionModalOpen(true);
  };

  const handleConfirmReceived = async ({ comment, images }) => {
    if (!selectedReturn) return;
    setProcessingId(selectedReturn._id);
    try {
      const payload = { 
        status: 'Completed',
        comment: comment || 'Return received and inspected by seller',
        dropoffProofImages: images || []
      };
      
      const res = await api.put(`/returns/${selectedReturn._id}/status`, payload);
      
      if (res.data.success) {
        toast.success('Return received! Product restocked to your inventory.');
        setIsInspectionModalOpen(false);
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete return');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-display">Manage Returns</h1>
            <p className="text-gray-500 text-sm mt-1">Review and process customer return requests.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : returns.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">No returns found.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider font-bold text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {returns.map((ret) => {
                    const orderId = ret.order?._id ? String(ret.order._id) : (typeof ret.order === 'string' ? ret.order : '');
                    return (
                    <tr key={ret._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={ret.product?.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200'} 
                            alt="" 
                            className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0" 
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 max-w-[220px] truncate">{ret.product?.name || 'Product'}</p>
                            <p className="text-[11px] text-gray-400 font-medium">Order: #{orderId ? orderId.slice(-6).toUpperCase() : 'N/A'}</p>
                            {ret.deliveryBoy && (
                              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                <span>🚚</span> {ret.deliveryBoy.fullName} ({ret.deliveryStatus || 'Assigned'})
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{ret.user?.fullName || 'Customer'}</p>
                        <p className="text-xs text-gray-500">{ret.user?.email || ret.user?.phone || 'No contact'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{ret.reason}</p>
                        {ret.description && (
                          <p className="text-xs text-gray-500 max-w-[200px] truncate mt-0.5">{ret.description}</p>
                        )}
                        <div className="flex gap-1 mt-1">
                          {ret.images?.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                              <FiImage /> {ret.images.length} photos
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          ret.status === 'Pending' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                          ret.status === 'Approved' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          ret.status === 'Completed' || ret.status === 'Received' ? 'bg-green-50 text-green-600 border border-green-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {ret.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(ret._id, 'Approved')}
                              disabled={processingId === ret._id}
                              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                              title="Approve Return"
                            >
                              <FiCheck size={14} /> Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ret._id, 'Rejected')}
                              disabled={processingId === ret._id}
                              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                              title="Reject Return"
                            >
                              <FiX size={14} /> Reject
                            </button>
                          </div>
                        )}
                        {ret.status === 'Approved' && (
                          <button
                            onClick={() => handleOpenReceiveModal(ret)}
                            disabled={processingId === ret._id}
                            className="px-4 py-2 bg-[#189D91] hover:bg-[#14847a] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <FiCheck size={14} /> Mark Received & Restock
                          </button>
                        )}
                        {(ret.status === 'Completed' || ret.status === 'Received') && (
                          <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                            <FiCheck size={14} /> Restocked
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ReturnInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedReturn(null);
        }}
        returnItem={selectedReturn}
        onConfirm={handleConfirmReceived}
        isSubmitting={processingId === selectedReturn?._id}
      />
    </PageWrapper>
  );
};

export default ReturnOrders;
