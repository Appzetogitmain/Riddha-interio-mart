import React from "react";
import PageWrapper from "../components/PageWrapper";
import { LuSearch, LuUser, LuTruck, LuClock, LuPackage, LuCheck, LuX, LuInfo, LuPlus, LuCar } from "react-icons/lu";
import { FiMapPin } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const AssignDeliveryBoy = () => {
  const [orders, setOrders] = React.useState([]);
  const [deliveryBoys, setDeliveryBoys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [assignmentMode, setAssignmentMode] = React.useState('select-type');

  // Seller-managed staff picker state
  const [staffList, setStaffList] = React.useState([]);
  const [loadingStaff, setLoadingStaff] = React.useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = React.useState(false);
  const [savingStaff, setSavingStaff] = React.useState(false);
  const [newStaff, setNewStaff] = React.useState({ name: '', phone: '', vehicleNumber: '', drivingLicense: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersRes = await api.get('/orders');

      if (ordersRes.data.success) {
        // Show orders that need assignment (Processing and no deliveryBoy yet or rejected)
        const filtered = (ordersRes.data.data || []).filter(o => 
          o.status === 'Processing' && (!o.deliveryBoy || o.deliveryStatus === 'Rejected' || o.deliveryStatus === 'None') && o.deliveryType !== 'seller-managed'
        );
        setOrders(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch assignment data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    
    const onResponse = () => fetchData();
    window.addEventListener('delivery:response_received', onResponse);
    return () => window.removeEventListener('delivery:response_received', onResponse);
  }, []);

  const handleAssignClick = async (order) => {
    setSelectedOrder(order);
    setAssignmentMode('select-type');
    setShowModal(true);
  };

  const handleInAppSelect = async () => {
    setAssignmentMode('in-app');
    setLoading(true);
    try {
      const res = await api.get(`/delivery/available?pincode=${selectedOrder.shippingAddress?.pincode}`);
      if (res.data.success) {
        setDeliveryBoys(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys for pincode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerManagedSelect = async () => {
    setAssignmentMode('seller-managed');
    setShowAddStaffForm(false);
    setLoadingStaff(true);
    try {
      const res = await api.get('/seller/staff');
      if (res.data.success) {
        setStaffList(res.data.data || []);
        // No staff on file yet — jump straight to the add-staff form.
        if (!res.data.data || res.data.data.length === 0) {
          setShowAddStaffForm(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const finalizeSellerManaged = async (staffId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryType: 'seller-managed',
        staffId: staffId || undefined
      });
      if (data.success) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) return;
    setSavingStaff(true);
    try {
      const res = await api.post('/seller/staff', newStaff);
      if (res.data.success) {
        setStaffList((prev) => [res.data.data, ...prev]);
        setNewStaff({ name: '', phone: '', vehicleNumber: '', drivingLicense: '' });
        setShowAddStaffForm(false);
      }
    } catch (err) {
      console.error('Failed to add staff:', err);
    } finally {
      setSavingStaff(false);
    }
  };

  const handleAssignProcess = async (dbId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryBoyId: dbId,
        deliveryType: 'in-app'
      });

      if (data.success) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase italic">
              Delivery <span className="text-seller-primary">Dispatch</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
              Assign reliable partners for your pending shipments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ready to Dispatch</p>
              <p className="text-xl font-black text-slate-900">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-seller-primary rounded-2xl shadow-lg shadow-seller-primary/20 flex items-center justify-center text-white">
              <LuTruck size={24} />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-800">
           <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <LuInfo size={20} />
           </div>
           <p className="text-sm font-medium">
             Sellers can only assign delivery partners to orders currently in <strong>Processing</strong> stage. Once assigned, the partner has to accept the request.
           </p>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning logistics network...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <LuPackage size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-900">All clear!</h3>
             <p className="text-slate-400 text-sm mt-1">There are no orders waiting for delivery assignment right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={order._id}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden group hover:border-seller-primary/20 transition-all p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-seller-light/20 group-hover:text-seller-primary transition-colors">
                      <LuClock size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 tracking-tighter">₹{Number(order.totalPrice || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-seller-primary font-black uppercase tracking-widest">{order.orderItems.length} Items • Paid</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-seller-light/40 flex items-center justify-center text-seller-primary font-black text-[10px]">
                        {String(order.shippingAddress?.fullName || "G").charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{String(order.shippingAddress?.fullName || "Guest")}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest truncate">
                          <FiMapPin size={10} /> {order.shippingAddress?.fullAddress}, {order.shippingAddress?.city}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-50 pt-6">
                   <button 
                     onClick={() => handleAssignClick(order)}
                     className="flex-1 bg-seller-primary text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 flex items-center justify-center gap-2"
                   >
                     <LuTruck size={16} />
                     Assign Partner
                   </button>
                   <button className="w-14 h-14 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                      <LuSearch size={18} />
                   </button>
                </div>
                
                {order.deliveryStatus === 'Rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
                    <LuX size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Previous partner rejected this request</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Assignment Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {assignmentMode === 'select-type' ? (
                  <>
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-display font-black text-slate-900 uppercase italic">Delivery <span className="text-seller-primary">Method</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose how you want to deliver this order</p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="w-10 h-10 border border-slate-200 rounded-full flex items-center justify-center hover:bg-white transition-all">
                        <LuX size={20} />
                      </button>
                    </div>
                    <div className="p-8 space-y-4">
                      {/* Option 1: In App Delivery */}
                      <button
                        onClick={handleInAppSelect}
                        className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-seller-primary/10 text-seller-primary flex items-center justify-center group-hover:bg-seller-primary group-hover:text-white transition-all">
                          <LuTruck size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">In-App Delivery Network</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assign to available delivery boys in your region</p>
                        </div>
                      </button>
                      
                      {/* Option 2: Seller Managed */}
                      <button
                        onClick={handleSellerManagedSelect}
                        disabled={assigning}
                        className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all">
                          <LuUser size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Self / Seller-Managed</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">You will manage this delivery and update status manually</p>
                        </div>
                      </button>

                      {/* Option 3: Shiprocket */}
                      <button
                        disabled
                        className="w-full p-5 rounded-2xl border border-slate-200 opacity-60 bg-slate-50 flex items-center gap-4 text-left cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                          <LuPackage size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Shiprocket</h4>
                            <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-1 rounded-md uppercase">Pending</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Automated shipping via Shiprocket API (Coming Soon)</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : assignmentMode === 'seller-managed' ? (
                  <>
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-display font-black text-slate-900 uppercase italic">Delivery <span className="text-seller-primary">Staff</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Who will handle this delivery?</p>
                      </div>
                      <button onClick={() => setAssignmentMode('select-type')} className="w-10 h-10 border border-slate-200 rounded-full flex items-center justify-center hover:bg-white transition-all text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Back
                      </button>
                    </div>

                    <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                      {loadingStaff ? (
                        <div className="text-center py-10">
                           <div className="w-8 h-8 border-2 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto mb-2" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading staff...</p>
                        </div>
                      ) : (
                        <>
                          {staffList.map((staff) => (
                            <div
                              key={staff._id}
                              className="p-5 rounded-2xl border border-slate-100 hover:border-seller-primary/30 transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-seller-primary flex items-center justify-center text-white shadow-lg shadow-seller-primary/10">
                                  <LuUser size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{staff.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2 flex-wrap">
                                    {staff.phone}
                                    {staff.vehicleNumber && (<><span>•</span><LuCar size={12} /> {staff.vehicleNumber}</>)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => finalizeSellerManaged(staff._id)}
                                disabled={assigning}
                                className="bg-seller-primary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 disabled:opacity-50 shrink-0"
                              >
                                {assigning ? 'Assigning...' : 'Assign'}
                              </button>
                            </div>
                          ))}

                          {!showAddStaffForm ? (
                            <button
                              onClick={() => setShowAddStaffForm(true)}
                              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-seller-primary/50 text-slate-500 hover:text-seller-primary transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                            >
                              <LuPlus size={16} /> Add New Staff
                            </button>
                          ) : (
                            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Staff Details</p>
                              <input
                                type="text"
                                placeholder="Full Name *"
                                value={newStaff.name}
                                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-seller-primary/50"
                              />
                              <input
                                type="text"
                                placeholder="Phone Number *"
                                value={newStaff.phone}
                                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-seller-primary/50"
                              />
                              <input
                                type="text"
                                placeholder="Vehicle Number"
                                value={newStaff.vehicleNumber}
                                onChange={(e) => setNewStaff({ ...newStaff, vehicleNumber: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-seller-primary/50"
                              />
                              <input
                                type="text"
                                placeholder="Driving License (optional)"
                                value={newStaff.drivingLicense}
                                onChange={(e) => setNewStaff({ ...newStaff, drivingLicense: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-seller-primary/50"
                              />
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setShowAddStaffForm(false)}
                                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleAddStaff}
                                  disabled={savingStaff || !newStaff.name.trim() || !newStaff.phone.trim()}
                                  className="flex-1 py-2.5 rounded-xl bg-seller-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all disabled:opacity-50"
                                >
                                  {savingStaff ? 'Saving...' : 'Save Staff'}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-50 text-center">
                      <button
                        onClick={() => finalizeSellerManaged(null)}
                        disabled={assigning}
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest underline underline-offset-2 disabled:opacity-50"
                      >
                        Continue without assigning a staff member
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-display font-black text-slate-900 uppercase italic">Select <span className="text-seller-primary">Partner</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Available delivery boys in your region</p>
                      </div>
                      <button onClick={() => setAssignmentMode('select-type')} className="w-10 h-10 border border-slate-200 rounded-full flex items-center justify-center hover:bg-white transition-all text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Back
                      </button>
                    </div>

                    <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                      {loading ? (
                        <div className="text-center py-10">
                           <div className="w-8 h-8 border-2 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto mb-2" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finding partners...</p>
                        </div>
                      ) : deliveryBoys.length === 0 ? (
                        <div className="text-center py-10">
                           <p className="text-sm font-bold text-slate-400">No active delivery boys found online.</p>
                        </div>
                      ) : deliveryBoys.map((boy) => (
                        <div 
                          key={boy._id}
                          className="p-5 rounded-2xl border border-slate-100 hover:border-seller-primary/30 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-seller-primary flex items-center justify-center text-white relative shadow-lg shadow-seller-primary/10">
                              <LuUser size={20} />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{boy.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                 <LuTruck size={12} /> {boy.vehicleType} • {boy.phone}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAssignProcess(boy._id)}
                            disabled={assigning}
                            className="bg-seller-primary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 disabled:opacity-50"
                          >
                            {assigning ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-50 text-center">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Partner selection is based on real-time availability and region proximity.</p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default AssignDeliveryBoy;
