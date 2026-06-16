import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuUsers,
  LuSearch,
  LuFilter,
  LuUser,
  LuPhone,
  LuTruck,
  LuMail,
  LuCheck,
  LuX,
  LuTrash2
} from "react-icons/lu";
import { FiMoreVertical } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const ManageDeliveryBoyPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/delivery');
      if (data.success) {
        setDeliveryBoys(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys:', err);
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.put(`/delivery/${id}/approve`, { approvalStatus: status });
      if (data.success) {
        setDeliveryBoys(prev => prev.map(boy => 
          boy._id === id ? { ...boy, approvalStatus: status } : boy
        ));
        toast.success(`Partner ${status.toLowerCase()} successfully`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this delivery partner?')) return;
    try {
      // Assuming there's a delete endpoint or we just reject them
      // If there's no delete endpoint, we might just hide them or set status to Rejected
      // Let's check if we can delete. Based on deliveryRoutes.js, there is no delete.
      // But we can add it or just use approvalStatus='Rejected'
      toast.error('Delete functionality not implemented on backend yet. Rejecting instead.');
      handleStatusUpdate(id, 'Rejected');
    } catch (err) {
      toast.error('Failed to delete');
    }
    setActiveMenu(null);
  };

  const filteredBoys = deliveryBoys.filter(
    (boy) =>
      boy.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boy.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boy.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }) => {
    const styles = {
      Approved: 'text-green-700 bg-green-50 border-green-700/10',
      Rejected: 'text-red-700 bg-red-50 border-red-700/10',
      Suspended: 'text-red-700 bg-red-50 border-red-700/10',
      Pending: 'text-amber-700 bg-amber-50 border-amber-700/10',
      Available: 'text-emerald-700 bg-emerald-50 border-emerald-700/10',
      Busy: 'text-blue-700 bg-blue-50 border-blue-700/10',
      Offline: 'text-gray-700 bg-gray-50 border-gray-700/10',
      'Self-Deleted': 'text-slate-500 bg-slate-100 border-slate-300/40 line-through',
    };

    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${styles[status] || 'text-gray-700 bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Manage Delivery Boys
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Monitor and manage all your delivery partners and fleet status.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-soft-oatmeal shadow-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-widest text-deep-espresso">
              {deliveryBoys.filter(b => b.status === 'Available').length} Online Now
            </span>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-bold"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all">
            <LuFilter size={16} />
            Filters
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-warm-sand border-t-deep-espresso rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-warm-sand">Syncing Fleet Data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Delivery Partner
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Contact Info
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Vehicle Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Live Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Approval
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredBoys.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-warm-sand font-bold uppercase tracking-widest italic text-sm">
                        No delivery partners found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredBoys.map((boy) => (
                      <tr
                        key={boy._id}
                        className={`hover:bg-soft-oatmeal/5 transition-colors group ${boy.isDeleted ? 'opacity-60 bg-slate-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-deep-espresso/5 flex items-center justify-center text-deep-espresso border border-soft-oatmeal">
                              <LuUser size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-deep-espresso ${boy.isDeleted ? 'line-through text-slate-400' : ''}`}>
                                  {boy.fullName}
                                </p>
                                {boy.isDeleted && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-100 text-rose-500 border border-rose-200">Deleted</span>
                                )}
                              </div>
                              <p className="text-[10px] font-black text-warm-sand uppercase tracking-tighter">Joined {new Date(boy.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                              <LuMail size={12} className="text-warm-sand" />
                              {boy.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                              <LuPhone size={12} className="text-warm-sand" />
                              {boy.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal uppercase tracking-wider w-fit">
                              <LuTruck size={12} />
                              {boy.vehicleType}
                            </div>
                            <p className="text-[10px] font-bold text-warm-sand uppercase tracking-widest ml-1">
                              {boy.vehicleNumber || 'No Plate'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-black text-deep-espresso uppercase tracking-tighter">
                              {boy.totalDeliveries || 0} Delivered
                            </p>
                            {boy.activeDeliveries > 0 && (
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                {boy.activeDeliveries} Active
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={boy.status} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={boy.isDeleted ? 'Self-Deleted' : boy.approvalStatus} />
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === boy._id ? null : boy._id)}
                            className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-colors"
                          >
                            <FiMoreVertical size={16} />
                          </button>

                          {activeMenu === boy._id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenu(null)}
                              ></div>
                              <div className="absolute right-6 top-14 w-52 bg-white rounded-2xl shadow-2xl border border-soft-oatmeal py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                                {boy.isDeleted ? (
                                  <button
                                    onClick={() => handleStatusUpdate(boy._id, 'Approved')}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-3"
                                  >
                                    <LuCheck size={14} /> Restore Account
                                  </button>
                                ) : (
                                  <>
                                    {boy.approvalStatus !== 'Approved' && boy.approvalStatus !== 'Suspended' && (
                                      <button
                                        onClick={() => handleStatusUpdate(boy._id, 'Approved')}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-3"
                                      >
                                        <LuCheck size={14} /> Approve Partner
                                      </button>
                                    )}
                                    {boy.approvalStatus === 'Approved' && (
                                      <button
                                        onClick={() => handleStatusUpdate(boy._id, 'Suspended')}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-3"
                                      >
                                        <LuX size={14} /> Suspend Partner
                                      </button>
                                    )}
                                    {boy.approvalStatus === 'Suspended' && (
                                      <button
                                        onClick={() => handleStatusUpdate(boy._id, 'Approved')}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-3"
                                      >
                                        <LuCheck size={14} /> Unsuspend Partner
                                      </button>
                                    )}
                                    {boy.approvalStatus !== 'Rejected' && boy.approvalStatus !== 'Suspended' && (
                                      <button
                                        onClick={() => handleStatusUpdate(boy._id, 'Rejected')}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"
                                      >
                                        <LuX size={14} /> Reject Partner
                                      </button>
                                    )}
                                  </>
                                )}
                                <div className="h-px bg-soft-oatmeal my-1 mx-2"></div>
                                <button
                                  onClick={() => handleDelete(boy._id)}
                                  className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-800 hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                  <LuTrash2 size={14} /> Remove Permanently
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageDeliveryBoyPage;
