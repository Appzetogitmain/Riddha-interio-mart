import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  User, 
  ShoppingBag, 
  Star, 
  Settings, 
  LogOut, 
  Pencil, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Trash2, 
  Save, 
  MapPin, 
  CreditCard, 
  ImagePlus,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Store,
  Briefcase,
  BarChart3,
  Globe,
  Award,
  Zap,
  Lock,
  RefreshCw,
  Bell,
  HelpCircle,
  FileText
} from 'lucide-react';
import sellerBanner from '../../../assets/seller_banner.png';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../user/data/UserContext';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const SellerProfile = () => {
  const navigate = useNavigate();
  const { logout, user: currentUser, setUser } = useUser();
  const avatarInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [stats, setStats] = useState({
    revenue: 0,
    rating: 4.9,
    service: 98
  });

  const [profileData, setProfileData] = useState({
    shopName: currentUser?.shopName || "",
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    avatar: currentUser?.avatar || "",
    shopAddress: "",
    gstNumber: "",
    panNumber: "",
    tier: "Standard Seller",
    rating: 0,
    joinDate: "N/A"
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, analyticsRes] = await Promise.all([
        api.get('/auth/seller/me'),
        api.get('/seller/analytics?timeRange=yearly').catch(() => null)
      ]);
      
      if (profileRes.data.success && profileRes.data.data) {
        const s = profileRes.data.data;
        setProfileData({
          shopName: s.shopName || "",
          fullName: s.fullName || "",
          email: s.email || "",
          phone: s.phone || "",
          avatar: s.avatar || "",
          shopAddress: s.shopAddress || "",
          gstNumber: s.gstNumber || "",
          panNumber: s.panNumber || "",
          tier: s.isVerified ? "Premium Seller" : "Standard Seller",
          rating: 4.8, 
          joinDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A"
        });
      }

      if (analyticsRes?.data?.success) {
        const totalRevenue = analyticsRes.data.data.stats.totalRevenue || 0;
        setStats(prev => ({ ...prev, revenue: totalRevenue }));
      }

    } catch (err) {
      console.error('Failed to fetch seller profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.put('/auth/seller/profile', {
        fullName: profileData.fullName,
        email: profileData.email,
        shopName: profileData.shopName,
        shopAddress: profileData.shopAddress,
        phone: profileData.phone,
        avatar: profileData.avatar,
        gstNumber: profileData.gstNumber,
        panNumber: profileData.panNumber
      });
      if (data.success && data.data) {
        setIsEditing(false);
        setUser({ 
          ...currentUser, 
          fullName: data.data.fullName, 
          avatar: data.data.avatar, 
          shopName: data.data.shopName 
        });
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const url = await uploadImage(file);
      setProfileData(prev => ({ ...prev, avatar: url }));
      const { data } = await api.put('/auth/seller/profile', { avatar: url });
      if (data.success) {
        setUser({ ...currentUser, avatar: url });
        toast.success('Profile photo updated.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setIsSaving(false);
      input.value = '';
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="py-24 text-center space-y-4">
           <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
           <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
        
        {/* Profile Header Card - High Density Enterprise */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 relative"
        >
          {/* Cover Area with Premium Banner */}
          <div className="h-32 md:h-48 relative overflow-hidden">
             <img src={sellerBanner} className="absolute inset-0 w-full h-full object-cover" alt="Banner" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
          </div>
          
          <div className="px-5 md:px-10 pb-6 md:pb-8 -mt-12 md:-mt-16 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="relative">
                  <div className="h-28 w-28 md:h-40 md:w-40 rounded-[2rem] md:rounded-[2.5rem] bg-white p-1.5 shadow-2xl ring-4 ring-white">
                    <div className="h-full w-full rounded-[1.6rem] md:rounded-[2.1rem] overflow-hidden bg-slate-50 flex items-center justify-center relative">
                      {profileData.avatar ? (
                        <img src={profileData.avatar} alt="Shop Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={40} className="text-slate-200" />
                      )}
                    </div>
                  </div>
                  <label className="absolute -bottom-1 -right-1 h-9 w-9 bg-seller-primary text-white rounded-xl flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-all z-20 border-2 border-white">
                    <ImagePlus size={14} />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleAvatarChange}
                      accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                    />
                  </label>
                </div>

                <div className="text-center md:text-left space-y-0.5 md:space-y-1 pb-1 flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-seller-primary/10 text-seller-primary text-[8px] md:text-[9px] font-semibold uppercase tracking-widest rounded-lg border border-seller-primary/10">
                      {profileData.tier}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white text-[8px] md:text-[9px] font-semibold uppercase tracking-widest rounded-lg">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-semibold text-slate-900 tracking-tighter leading-none">{profileData.shopName}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-slate-400 font-semibold text-[9px] md:text-[10px] uppercase tracking-widest">
                    <p className="flex items-center gap-1.5">
                       <User size={12} className="text-seller-primary" /> {profileData.fullName}
                    </p>
                    <p className="flex items-center gap-1.5">
                       <MapPin size={12} className="text-seller-primary" /> {profileData.shopAddress.split(',')[0] || 'Warehouse'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto md:pb-1">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-8 py-3 rounded-xl font-semibold text-[9px] md:text-[10px] uppercase tracking-widest transition-all border shadow-lg ${isEditing ? 'bg-slate-50 text-slate-500 border-slate-200 shadow-slate-100' : 'bg-seller-primary text-white border-seller-primary hover:bg-seller-dark active:scale-95'}`}
                  >
                    {isEditing ? 'Discard' : 'Manage Profile'}
                  </button>
                 <p className="text-[8px] md:text-[9px] font-semibold text-slate-400 text-center md:text-right uppercase tracking-widest opacity-60">
                    <Calendar size={10} className="inline mr-1" /> Member Since {profileData.joinDate}
                 </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Main Info / Form */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  key="edit-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-8"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                     <div className="w-10 h-10 bg-seller-light/40 rounded-xl flex items-center justify-center text-seller-primary">
                        <Pencil size={20} />
                     </div>
                     <h3 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">Personal & Business Info</h3>
                  </div>
                  
                  <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Shop Name</label>
                        <input 
                           type="text" 
                           value={profileData.shopName}
                           onChange={(e) => setProfileData({...profileData, shopName: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Full Name</label>
                        <input 
                           type="text" 
                           value={profileData.fullName}
                           onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
                        <input 
                           type="email" 
                           value={profileData.email}
                           onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Phone Number</label>
                        <input 
                           type="tel" 
                           value={profileData.phone}
                           onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Store Address</label>
                        <textarea 
                           value={profileData.shopAddress}
                           onChange={(e) => setProfileData({...profileData, shopAddress: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none h-28 resize-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">GSTIN Number</label>
                        <input 
                           type="text" 
                           value={profileData.gstNumber}
                           onChange={(e) => setProfileData({...profileData, gstNumber: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-1">PAN Card Number</label>
                        <input 
                           type="text" 
                           value={profileData.panNumber}
                           onChange={(e) => setProfileData({...profileData, panNumber: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none"
                        />
                     </div>
                     <div className="md:col-span-2 pt-2">
                         <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full py-4 bg-seller-primary text-white rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-seller-primary/20 hover:bg-seller-dark transition-all flex items-center justify-center gap-3"
                         >
                           {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                           {isSaving ? 'Processing...' : 'Apply Changes'}
                        </button>
                     </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="view-info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 md:space-y-8"
                >
                  {/* Enhanced Stats Row - Dashboard Compact */}
                  <div className="grid grid-cols-3 gap-3 md:gap-6">
                     {[
                       { 
                         label: 'Revenue', 
                         value: stats.revenue >= 100000 ? `₹${(stats.revenue / 100000).toFixed(1)}L` : `₹${stats.revenue.toLocaleString()}`, 
                         icon: <ShoppingBag size={18} />, 
                         color: 'text-seller-primary', bg: 'bg-seller-primary/5' 
                       },
                       { label: 'Rating', value: `${stats.rating}/5`, icon: <Star size={18} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                       { label: 'Service', value: `${stats.service}%`, icon: <Zap size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                     ].map((stat, i) => (
                       <div key={i} className="bg-white p-3.5 md:p-6 rounded-[1.5rem] md:rounded-[1.8rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-2 md:gap-4 group">
                          <div className={`w-8 h-8 md:w-11 md:h-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                             {stat.icon}
                          </div>
                          <div className="text-center md:text-left">
                             <p className="text-[8px] md:text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                             <h4 className="text-sm md:text-xl font-semibold text-slate-900 tracking-tight leading-none">{stat.value}</h4>
                          </div>
                       </div>
                     ))}
                  </div>

                  {/* Merchant Details Card - High Density */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
                     <h3 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-1.5 h-5 md:h-6 bg-seller-primary rounded-full" />
                        Merchant Identification
                     </h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 md:gap-y-6 gap-x-8 md:gap-x-10">
                        {[
                          { label: 'Registered Email', value: profileData.email, icon: <Mail size={14} /> },
                          { label: 'Merchant Hotline', value: profileData.phone, icon: <Phone size={14} /> },
                          { label: 'GST Identification', value: profileData.gstNumber, icon: <CheckCircle2 size={14} /> },
                          { label: 'Tax Identity (PAN)', value: profileData.panNumber, icon: <CreditCard size={14} /> },
                          { label: 'Primary Fulfillment Center', value: profileData.shopAddress, icon: <MapPin size={14} />, full: true },
                        ].map((field, i) => (
                          <div key={i} className={`${field.full ? 'md:col-span-2' : ''} space-y-1`}>
                             <div className="flex items-center gap-2 text-slate-400 font-semibold text-[8px] md:text-[9px] uppercase tracking-widest">
                                {field.icon} {field.label}
                             </div>
                             <p className="text-[12px] md:text-sm font-semibold text-slate-900 truncate">
                                {field.value || 'N/A'}
                             </p>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Compliance Section - High Fidelity */}
                  <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/50 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Lock size={14} className="text-seller-primary" /> Security & Compliance
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[7px] md:text-[8px] font-semibold uppercase tracking-widest rounded-md border border-emerald-200/50">Lvl 3 Secure</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { title: 'Privacy', val: 'E2E Encryption', icon: <ShieldCheck size={14} /> },
                          { title: 'Tax Flow', val: 'Verified Q1', icon: <FileText size={14} /> },
                          { title: 'Identity', val: 'KYC Tier 2', icon: <Globe size={14} /> }
                        ].map((item, i) => (
                          <div key={i} className="bg-white px-4 py-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                             <div className="text-seller-primary opacity-60 shrink-0">{item.icon}</div>
                             <div>
                                <p className="text-[7px] md:text-[8px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{item.title}</p>
                                <p className="text-[9px] md:text-[10px] font-semibold text-slate-900 uppercase tracking-widest leading-none">{item.val}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions Sidebar - Professional Hub */}
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6">
               <div className="space-y-0.5">
                 <h3 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight">Merchant Hub</h3>
                 <p className="text-[8px] md:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">System Control</p>
               </div>
               
               <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: 'Analytics', icon: <BarChart3 size={16} />, path: '/seller/reports/sales', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Finances', icon: <CreditCard size={16} />, path: '/seller/wallet', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Settings', icon: <Settings size={16} />, path: '/seller/profile', color: 'bg-slate-50 text-slate-600' },
                    { label: 'System', icon: <Bell size={16} />, path: '/seller/notifications', color: 'bg-rose-50 text-rose-600' },
                  ].map((tool, i) => (
                    <button 
                      key={i}
                      onClick={() => navigate(tool.path)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${tool.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                             {tool.icon}
                          </div>
                          <span className="text-[9px] md:text-[10px] font-semibold text-slate-700 uppercase tracking-widest">{tool.label}</span>
                       </div>
                       <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
               </div>
               
               <button 
                 onClick={() => logout()}
                 className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all font-semibold text-[9px] uppercase tracking-widest mt-2 shadow-xl shadow-slate-900/10"
               >
                  <LogOut size={14} /> Terminate Session
               </button>
            </div>


          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SellerProfile;
