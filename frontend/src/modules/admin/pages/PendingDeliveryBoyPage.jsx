import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  LuUserPlus, 
  LuCheck, 
  LuX, 
  LuMail, 
  LuPhone, 
  LuFileText, 
  LuEye,
  LuCalendar,
  LuTruck
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const PendingDeliveryBoyPage = () => {
  const [pendingBoys, setPendingBoys] = useState([]);
  const [selectedBoy, setSelectedBoy] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/delivery/pending');
      if (data.success) {
        setPendingBoys(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending delivery boys:', err);
      toast.error('Failed to fetch pending applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Are you sure you want to approve this delivery partner?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.put(`/delivery/${id}/approve`, { approvalStatus: 'Approved' });
                if (data.success) {
                  toast.success("Delivery partner approved successfully!");
                  fetchPending();
                  setSelectedBoy(null);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to approve delivery partner");
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleReject = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Are you sure you want to reject this application?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.put(`/delivery/${id}/approve`, { approvalStatus: 'Rejected' });
                if (data.success) {
                  toast.success("Application rejected.");
                  fetchPending();
                  setSelectedBoy(null);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to reject application");
              }
            }}
            className="px-3 py-1 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleView = (boy) => {
    setSelectedBoy(boy);
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Pending Delivery Boys</h1>
            <p className="text-warm-sand text-sm md:text-base">Review and approve new delivery partner applications.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Applicant Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Vehicle & Docs</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Date Applied</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {loading ? (
                  Array(3).fill(0).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-6">
                        <div className="h-6 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : pendingBoys.length > 0 ? (
                  pendingBoys.map((boy) => (
                    <tr key={boy._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-800/10 flex items-center justify-center text-red-800">
                            <LuUserPlus size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-deep-espresso">{boy.fullName}</p>
                            <p className="text-xs text-warm-sand">Applicant #{boy._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-deep-espresso/70">
                            <LuMail size={12} />
                            {boy.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-deep-espresso/70">
                            <LuPhone size={12} />
                            {boy.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-bold text-deep-espresso/70 uppercase tracking-wider">{boy.vehicleType}</p>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <LuFileText size={12} className="text-warm-sand" />
                            <span className={boy.documents?.dl ? 'text-green-600' : 'text-amber-600'}>
                              {boy.documents?.dl ? 'Docs Uploaded' : 'Pending Docs'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/70 font-medium">
                        {new Date(boy.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-xl">
                          <button 
                            onClick={() => handleView(boy)}
                            className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-colors"
                          >
                            <LuEye />
                          </button>
                          <button 
                            onClick={() => handleApprove(boy._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <LuCheck />
                          </button>
                          <button 
                            onClick={() => handleReject(boy._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LuX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-warm-sand italic">
                      No pending delivery boy applications.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedBoy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedBoy(null)}
            ></div>
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="bg-red-800 p-8 text-white relative">
                 <button 
                   onClick={() => setSelectedBoy(null)}
                   className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <LuX size={20} />
                 </button>
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                     <LuUserPlus size={32} />
                   </div>
                   <div>
                     <h2 className="text-2xl font-display font-bold">{selectedBoy.fullName}</h2>
                     <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Application Review</p>
                   </div>
                 </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuMail size={12} /> Email Address
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedBoy.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuPhone size={12} /> Phone Number
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedBoy.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuTruck size={12} /> Vehicle Type
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedBoy.vehicleType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuCalendar size={12} /> Applied On
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{new Date(selectedBoy.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="bg-soft-oatmeal/20 p-4 rounded-2xl border border-soft-oatmeal flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <LuFileText className="text-warm-sand" size={20} />
                     <span className="text-xs font-bold text-deep-espresso">Identity Documents</span>
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                     selectedBoy.documents?.dl
                     ? 'bg-green-100 text-green-700 border-green-200' 
                     : 'bg-amber-100 text-amber-700 border-amber-200'
                   }`}>
                     {selectedBoy.documents?.dl ? 'Available' : 'Pending'}
                   </span>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => handleReject(selectedBoy._id)}
                    className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                  >
                    Reject Applicant
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedBoy._id)}
                    className="flex-1 bg-red-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-deep-espresso transition-all shadow-lg shadow-red-900/20"
                  >
                    Approve & Active
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PendingDeliveryBoyPage;
