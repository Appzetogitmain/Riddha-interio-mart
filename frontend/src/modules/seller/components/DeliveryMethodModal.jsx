import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, User, X, Package, ChevronRight, Plus, Car, Upload } from "lucide-react";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

// Delivery-method assignment modal: pick In-App Delivery Network / Self-Managed
// Staff / Shiprocket for a given order. Self-contained — owns all its own
// fetch/loading state — so it can be mounted from the orders list page, the
// order detail page, or anywhere else an order needs a delivery method.
const DeliveryMethodModal = ({ order, onClose, onAssigned, initialMode = "select-type" }) => {
  const [assignmentMode, setAssignmentMode] = useState(initialMode);
  const [assigning, setAssigning] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', vehicleNumber: '', drivingLicense: '', drivingLicenseImage: '' });
  const [uploadingLicense, setUploadingLicense] = useState(false);

  const handleInAppSelect = async () => {
    setAssignmentMode('in-app');
    try {
      const { data } = await api.get(`/delivery/available?pincode=${order?.shippingAddress?.pincode || ''}`);
      if (data.success) {
        setDeliveryBoys(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys:', err);
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

  // If the caller wants to jump straight into a specific picker (e.g. "Assign
  // Member" shortcut for an already seller-managed order), kick that off once.
  useEffect(() => {
    if (initialMode === 'seller-managed') handleSellerManagedSelect();
    else if (initialMode === 'in-app') handleInAppSelect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalizeSellerManaged = async (staffId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/assign-delivery`, {
        deliveryType: 'seller-managed',
        staffId: staffId || undefined
      });
      if (data.success) {
        onAssigned?.(data.data);
        onClose();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleLicenseImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLicense(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setNewStaff((prev) => ({ ...prev, drivingLicenseImage: res.data.url }));
        toast.success('License image uploaded');
      }
    } catch (err) {
      console.error('Failed to upload license image:', err);
      toast.error('Failed to upload license image.');
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) return;
    setSavingStaff(true);
    try {
      const res = await api.post('/seller/staff', newStaff);
      if (res.data.success) {
        setStaffList((prev) => [res.data.data, ...prev]);
        setNewStaff({ name: '', phone: '', vehicleNumber: '', drivingLicense: '', drivingLicenseImage: '' });
        setShowAddStaffForm(false);
      }
    } catch (err) {
      console.error('Failed to add staff:', err);
      toast.error(err.response?.data?.error || 'Failed to add staff member.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleAssignProcess = async (dbId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/assign-delivery`, {
        deliveryBoyId: dbId,
        deliveryType: 'in-app'
      });
      if (data.success) {
        onAssigned?.(data.data);
        onClose();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-slate-100"
          onClick={e => e.stopPropagation()}
        >
          {assignmentMode === 'select-type' ? (
            <>
              <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Delivery Method</h3>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Order #{order?._id.slice(-8).toUpperCase()}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-5 md:p-8 space-y-4">
                {/* Option 1: In App Delivery */}
                <button
                  onClick={handleInAppSelect}
                  className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-seller-primary/10 text-seller-primary flex items-center justify-center group-hover:bg-seller-primary group-hover:text-white transition-all shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">In-App Delivery Network</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assign to available delivery boys in your region</p>
                  </div>
                </button>

                {/* Option 2: Seller Managed */}
                <button
                  onClick={handleSellerManagedSelect}
                  disabled={assigning}
                  className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Self / Seller-Managed</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">You will manage this delivery and update status manually</p>
                  </div>
                </button>

                {/* Option 3: Shiprocket */}
                <button
                  disabled
                  className="w-full p-5 rounded-2xl border border-slate-200 opacity-60 bg-slate-50 flex items-center gap-4 text-left cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Shiprocket</h4>
                      <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-1 rounded-md uppercase">Pending</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Automated shipping via Shiprocket API</p>
                  </div>
                </button>
              </div>
            </>
          ) : assignmentMode === 'seller-managed' ? (
            <>
              <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Delivery Staff</h3>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Who will handle this delivery?</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAssignmentMode('select-type')} className="px-3 py-1.5 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Back
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="px-4 py-3 md:p-8 max-h-[55vh] overflow-y-auto custom-scrollbar space-y-2.5 md:space-y-4">
                {loadingStaff ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading staff...</p>
                  </div>
                ) : (
                  <>
                    {staffList.map((staff) => (
                      <div
                        key={staff._id}
                        className="p-3.5 md:p-5 rounded-xl md:rounded-3xl border border-slate-100 hover:border-seller-primary/30 hover:bg-seller-light/10 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-seller-primary flex items-center justify-center text-white border-2 border-white shadow-sm shrink-0">
                            <User size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{staff.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400">{staff.phone}</span>
                              {staff.vehicleNumber && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Car size={11} /> {staff.vehicleNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => finalizeSellerManaged(staff._id)}
                          disabled={assigning}
                          className="bg-seller-primary text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all disabled:opacity-50 shrink-0"
                        >
                          {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}

                    {!showAddStaffForm ? (
                      <button
                        onClick={() => setShowAddStaffForm(true)}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-seller-primary/50 text-slate-500 hover:text-seller-primary transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Plus size={16} /> Add New Staff
                      </button>
                    ) : (
                      <div className="p-4 md:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Staff Details</p>
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
                          placeholder="Driving License Number (optional)"
                          value={newStaff.drivingLicense}
                          onChange={(e) => setNewStaff({ ...newStaff, drivingLicense: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-seller-primary/50"
                        />

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Driving License Photo (optional)</label>
                          {newStaff.drivingLicenseImage ? (
                            <div className="relative w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                              <img src={newStaff.drivingLicenseImage} alt="Driving license" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setNewStaff((prev) => ({ ...prev, drivingLicenseImage: '' }))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-seller-primary/50 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-seller-primary transition-all gap-1">
                              {uploadingLicense ? (
                                <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                              ) : (
                                <>
                                  <Upload size={18} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Upload License Photo</span>
                                </>
                              )}
                              <input type="file" accept="image/*" className="hidden" onChange={handleLicenseImageUpload} disabled={uploadingLicense} />
                            </label>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setShowAddStaffForm(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddStaff}
                            disabled={savingStaff || !newStaff.name.trim() || !newStaff.phone.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-seller-primary text-white font-bold text-[10px] uppercase tracking-widest hover:bg-seller-dark transition-all disabled:opacity-50"
                          >
                            {savingStaff ? 'Saving...' : 'Save Staff'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 md:p-6 bg-gray-50/50 border-t border-gray-50 text-center">
                <button
                  onClick={() => finalizeSellerManaged(null)}
                  disabled={assigning}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest underline underline-offset-2 disabled:opacity-50"
                >
                  Continue without assigning a staff member
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Assign Partner</h3>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Available partners in your region</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAssignmentMode('select-type')} className="px-3 py-1.5 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Back
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="px-4 py-3 md:p-8 max-h-[55vh] overflow-y-auto custom-scrollbar space-y-2.5 md:space-y-4">
                {deliveryBoys.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                     <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <User size={28} />
                     </div>
                     <p className="text-sm font-bold text-slate-400">No active delivery partners online.</p>
                  </div>
                ) : deliveryBoys.map((boy) => (
                  <div
                    key={boy._id}
                    className="p-3.5 md:p-5 rounded-xl md:rounded-3xl border border-slate-100 hover:border-seller-primary/30 hover:bg-seller-light/10 transition-all flex items-center justify-between group cursor-pointer"
                    onClick={() => handleAssignProcess(boy._id)}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-seller-primary flex items-center justify-center text-white relative border-2 border-white shadow-sm shrink-0">
                        <User size={17} />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{boy.fullName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{boy.vehicleType}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] font-bold text-slate-400">{boy.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-seller-primary group-hover:text-white transition-all shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 md:p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Partner selection is prioritized by real-time distance and capacity.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeliveryMethodModal;
