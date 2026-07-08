import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCcw, FiCheck, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import TableSkeleton from '../../../shared/components/skeletons/TableSkeleton';
import PageWrapper from '../components/PageWrapper';
import ProofUploadModal from '../components/ProofUploadModal';

const ReturnOrders = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofTargetOrder, setProofTargetOrder] = useState(null);

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
    if (status === 'Completed') {
      const returnData = returns.find(r => r._id === id);
      if (returnData?.deliveryStatus === 'None') {
        setProofTargetOrder(id);
        setIsProofModalOpen(true);
        return;
      }
    }
    
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

  const submitProof = async ({ images, video }) => {
    setIsProofModalOpen(false);
    setProcessingId(proofTargetOrder);
    try {
      const payload = { 
        status: 'Completed',
        dropoffProofImages: images
      };
      
      const res = await api.put(`/returns/${proofTargetOrder}/status`, payload);
      
      if (res.data.success) {
        toast.success(`Return marked as Completed`);
        fetchReturns();
      }
    } catch (err) {
      toast.error('Failed to submit proof');
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
                        <p className="font-bold text-gray-800">{ret.reason}</p>
                        <div className="flex gap-1 mt-1">
                          {ret.images?.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                              <FiImage /> {ret.images.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          ret.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                          ret.status === 'Approved' ? 'bg-blue-50 text-blue-600' :
                          ret.status === 'Completed' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
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
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve Return"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ret._id, 'Rejected')}
                              disabled={processingId === ret._id}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Reject Return"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        )}
                        {ret.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(ret._id, 'Completed')}
                            disabled={processingId === ret._id}
                            className="px-4 py-2 bg-[#189D91] text-white text-xs font-bold rounded-lg hover:bg-[#14847a] transition-colors"
                          >
                            Mark Received
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ProofUploadModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onSubmit={submitProof}
        isPickup={false}
      />
    </PageWrapper>
  );
};

export default ReturnOrders;
