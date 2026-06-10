import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { 
  LuUser, 
  LuPhone, 
  LuTruck, 
  LuShieldCheck, 
  LuMapPin, 
  LuLogOut, 
  LuMail, 
  LuFileText, 
  LuSave, 
  LuX,
  LuActivity,
  LuExternalLink,
  LuChevronRight,
  LuBadgeCheck,
  LuCheck
} from 'react-icons/lu';
import { FiEdit2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../user/data/UserContext';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { logout, user: currentUser, setUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDocDrawer, setShowDocDrawer] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    vehicleType: "Bike",
    vehicleNumber: "",
    avatar: "",
    approvalStatus: "Pending",
    documents: {
      rc: "",
      dl: "",
      aadhar: "",
      bankDetails: "",
      insurance: "",
      pollution: ""
    }
  });

  const documentTypes = [
    { key: 'aadhar', label: 'Aadhar Card', icon: LuUser },
    { key: 'dl', label: 'Driving License (DL)', icon: LuFileText },
    { key: 'rc', label: 'Registration Certificate (RC)', icon: LuFileText },
    { key: 'insurance', label: 'Vehicle Insurance', icon: LuShieldCheck },
    { key: 'pollution', label: 'Pollution Certificate (PUC)', icon: LuActivity },
    { key: 'bankDetails', label: 'Bank Details', icon: LuFileText }
  ];

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/delivery/me');
      if (data.success && data.data) {
        setProfile({
          name: data.data.fullName || "Partner",
          phone: data.data.phone || "",
          email: data.data.email || "",
          vehicleType: data.data.vehicleType || "Bike",
          vehicleNumber: data.data.vehicleNumber || "",
          avatar: data.data.avatar || "",
          approvalStatus: data.data.approvalStatus || "Pending",
          documents: data.data.documents || {
            rc: "",
            dl: "",
            aadhar: "",
            bankDetails: "",
            insurance: "",
            pollution: ""
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBack = () => {
    if (showDocDrawer) {
      setShowDocDrawer(false);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/delivery/dashboard');
    }
  };

  const validateForm = () => {
    if (!profile.name.trim()) {
      toast.error('Full Name is required');
      return false;
    }
    if (!profile.email.trim() || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(profile.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!profile.phone.trim() || !/^\d{10}$/.test(profile.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    if (profile.vehicleNumber && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i.test(profile.vehicleNumber.trim())) {
      toast.error('Please enter a valid vehicle number (e.g. MH12AB1234)');
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    const loadingToast = toast.loading('Synchronizing Profile Matrix...');
    try {
      const { data } = await api.put('/auth/delivery/profile', {
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone,
        vehicleType: profile.vehicleType,
        vehicleNumber: profile.vehicleNumber,
        avatar: profile.avatar
      });
      if (data.success && data.data) {
        setIsEditing(false);
        setUser({ ...currentUser, fullName: data.data.fullName, avatar: data.data.avatar });
        toast.success('Matrix Synchronized', { id: loadingToast });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync Failure', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loadingToast = toast.loading('Uploading Biometric Asset...');
    try {
      const url = await uploadImage(file);
      setProfile(prev => ({ ...prev, avatar: url }));
      await api.put('/auth/delivery/profile', { avatar: url });
      setUser({ ...currentUser, avatar: url });
      toast.success('Asset Verified', { id: loadingToast });
    } catch (err) {
      toast.error('Asset Upload Failed', { id: loadingToast });
    }
  };

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(docType);
    const loadingToast = toast.loading(`Uploading ${docType.toUpperCase()} asset...`);
    try {
      const url = await uploadImage(file);
      const updatedDocs = {
        ...profile.documents,
        [docType]: url
      };
      
      const { data } = await api.put('/auth/delivery/profile', {
        documents: updatedDocs
      });

      if (data.success && data.data) {
        setProfile(prev => ({
          ...prev,
          documents: data.data.documents || updatedDocs
        }));
        toast.success(`${docType.toUpperCase()} uploaded successfully`, { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Sync Failure for ${docType.toUpperCase()}`, { id: loadingToast });
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-40">
           <LuActivity className="text-[#D63384] animate-pulse mb-4" size={48} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Identity Protocol...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-24 relative overflow-hidden">
      {/* Top Header */}
      <div className="bg-white text-slate-900 px-4 py-5 flex items-center shadow-sm border-b border-slate-100 mb-6 sticky top-0 z-20">
        <button onClick={handleBack} className="p-1 text-slate-500 hover:text-slate-900 transition-colors">
          <LuChevronRight className="rotate-180" size={24} />
        </button>
        <h1 className="text-base font-bold flex-1 text-center mr-6">Partner Profile</h1>
      </div>

      <div className="px-4 space-y-5 max-w-4xl mx-auto pt-4 lg:py-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.form 
              key="edit-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSave} 
              className="space-y-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto"
            >
              <h2 className="text-base font-semibold text-slate-800 mb-4 border-b pb-3">Edit Details</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Full Name</label>
                  <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A458A] focus:bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A458A] focus:bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                  <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A458A] focus:bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Vehicle Type</label>
                  <select value={profile.vehicleType} onChange={(e) => setProfile({...profile, vehicleType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A458A] focus:bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none">
                    <option value="Bike">Bike</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Vehicle Number</label>
                  <input value={profile.vehicleNumber} onChange={(e) => setProfile({...profile, vehicleNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A458A] focus:bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none uppercase" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-200 w-1/3">Cancel</button>
                <button disabled={isSaving} type="submit" className="flex-1 bg-[#2A458A] text-white py-2.5 rounded-xl font-semibold text-xs shadow hover:bg-[#1f346b]">{isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="view-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="space-y-5">
                {/* Section 1: Profile details */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile details</h2>
                    <button onClick={() => setIsEditing(true)} className="text-[#2A458A] text-xs font-semibold hover:underline">Edit</button>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                          <img src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=2A458A&color=fff`} alt={profile.name} className="w-full h-full object-cover" />
                        </div>
                        <label className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow shadow-slate-300 cursor-pointer hover:scale-110 transition-transform border border-slate-100">
                          <FiEdit2 size={10} className="text-[#2A458A]" />
                          <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{profile.name}</h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{profile.email.split('@')[0]} Partner</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#2A458A]/10 text-[#2A458A] flex items-center justify-center shadow-sm">
                      <LuCheck size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Profile setting */}
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Profile setting</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setIsEditing(true)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:border-[#2A458A]/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center group-hover:bg-[#2A458A] group-hover:text-white transition-colors">
                        <LuUser size={16} />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">Profile</span>
                    </div>
                    <div onClick={() => setShowDocDrawer(true)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:border-[#2A458A]/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center group-hover:bg-[#2A458A] group-hover:text-white transition-colors">
                        <LuTruck size={16} />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">Vehicle</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Section 3: Vehicle info */}
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle info</h2>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center shrink-0">
                        <LuTruck size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{profile.vehicleType}</p>
                        <p className="text-[11px] font-medium text-slate-500">Verified Partner Vehicle</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center shrink-0">
                        <LuFileText size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{profile.vehicleNumber || 'Pending Registration'}</p>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                           Status: <span className="text-[#189D91] bg-teal-50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{profile.approvalStatus}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Training modules */}
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Training modules</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => toast.success('All payouts are processed weekly. You can view your active logs under the Earnings screen.', { icon: '💰' })} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:border-[#2A458A]/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center group-hover:bg-[#2A458A] group-hover:text-white transition-colors">
                        <LuActivity size={16} />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">Payout Calls</span>
                    </div>
                    <div onClick={() => toast.success('Verification Status: Active. You have full clearance for regional logistics operations.', { icon: '🛡️' })} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:border-[#2A458A]/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-[#F5F7FA] text-[#2A458A] flex items-center justify-center group-hover:bg-[#2A458A] group-hover:text-white transition-colors">
                        <LuFileText size={16} />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">Permissions</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 max-w-sm mx-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-rose-100 text-rose-500 font-semibold text-xs hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
          >
            <LuLogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Slide-over Document Drawer */}
      <AnimatePresence>
        {showDocDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocDrawer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-50 border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Documents & Verification</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload and manage active verification assets</p>
                </div>
                <button
                  onClick={() => setShowDocDrawer(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <LuX size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Global Verification Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                    profile.approvalStatus === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : profile.approvalStatus === 'Pending'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {profile.approvalStatus}
                  </span>
                </div>
              </div>

              {/* Scrollable Docs List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {documentTypes.map((doc) => {
                  const Icon = doc.icon;
                  const fileUrl = profile.documents?.[doc.key];
                  const isUploading = uploadingDoc === doc.key;

                  return (
                    <div key={doc.key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-[#2A458A]">
                            <Icon size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{doc.label}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {fileUrl ? 'Asset Submitted & Logged' : 'Verification asset required'}
                            </p>
                          </div>
                        </div>

                        {/* File Action/Upload Badge */}
                        {fileUrl ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-[#2A458A] hover:underline flex items-center gap-0.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm"
                            >
                              <span>View File</span>
                              <LuExternalLink size={10} />
                            </a>
                            <label className="text-[10px] font-bold text-slate-600 cursor-pointer hover:bg-slate-200 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                              <span>Update</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleDocUpload(e, doc.key)}
                                accept="image/*,application/pdf"
                                disabled={isUploading}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className={`text-[10px] font-bold text-white cursor-pointer hover:bg-[#1f346b] bg-[#2A458A] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploading ? 'Uploading...' : 'Upload Asset'}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleDocUpload(e, doc.key)}
                              accept="image/*,application/pdf"
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
