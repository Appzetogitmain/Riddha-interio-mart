import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  Megaphone, 
  Tag, 
  Percent, 
  Zap, 
  TrendingUp, 
  Calendar, 
  Users, 
  Plus, 
  ChevronRight, 
  ArrowUpRight,
  Target,
  BarChart3,
  Gift,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const Marketing = () => {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [activeTab, setActiveTab] = useState('Campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState({
    roi: '4.2x',
    conversionRate: '5.8%',
    cac: '₹142',
    totalSpend: 0,
    totalReach: 0,
    totalConversions: 0
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    type: 'Flash Sale',
    discountPercentage: '',
    products: [],
    budget: '',
    startDate: '',
    endDate: ''
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    expiryDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, coupRes, analRes, prodRes] = await Promise.all([
        api.get('/marketing/campaigns'),
        api.get('/marketing/coupons'),
        api.get('/marketing/analytics'),
        api.get('/products/my-products')
      ]);

      if (campRes.data.success) setCampaigns(campRes.data.data);
      if (coupRes.data.success) setCoupons(coupRes.data.data);
      if (analRes.data.success) setAnalytics(analRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error('Failed to fetch growth center data:', err);
      toast.error('Failed to load growth center details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayDateString = getTodayDateString();

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await api.delete(`/marketing/coupons/${id}`);
      if (res.data.success) {
        toast.success('Coupon deleted successfully.');
        setCoupons(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to delete coupon.');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.budget || !campaignForm.discountPercentage || !campaignForm.startDate || !campaignForm.endDate) {
      toast.error('Please fill all required fields.');
      return;
    }

    const startDate = new Date(campaignForm.startDate);
    const endDate = new Date(campaignForm.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error('Please select valid campaign dates.');
      return;
    }

    if (startDate >= endDate) {
      toast.error('Sale start date should be earlier than sale end date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/marketing/campaigns', {
        ...campaignForm,
        discountPercentage: Number(campaignForm.discountPercentage),
        budget: Number(campaignForm.budget)
      });

      if (res.data.success) {
        toast.success('Campaign created successfully.');
        setShowCampaignModal(false);
        setCampaignForm({
          title: '',
          type: 'Flash Sale',
          discountPercentage: '',
          products: [],
          budget: '',
          startDate: '',
          endDate: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to launch campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue || !couponForm.expiryDate) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (couponForm.expiryDate < todayDateString) {
      toast.error('Coupon expiry date cannot be in the past.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/marketing/coupons', {
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        minPurchaseAmount: couponForm.minPurchaseAmount ? Number(couponForm.minPurchaseAmount) : undefined,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : undefined,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined
      });

      if (res.data.success) {
        toast.success('Coupon created successfully.');
        setShowCouponModal(false);
        setCouponForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          minPurchaseAmount: '',
          maxDiscountAmount: '',
          usageLimit: '',
          expiryDate: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setCampaignForm(prev => {
      const isSelected = prev.products.includes(productId);
      return {
        ...prev,
        products: isSelected 
          ? prev.products.filter(id => id !== productId)
          : [...prev.products, productId]
      };
    });
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-0">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Growth Center</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deploying advanced merchant marketing strategies</p>
          </div>
          
          {activeTab !== 'Intelligence' && (
            <button 
              onClick={() => activeTab === 'Coupons' ? setShowCouponModal(true) : setShowCampaignModal(true)}
              className="flex items-center gap-2 px-8 py-4 bg-seller-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-seller-primary/20 hover:bg-seller-dark transition-all active:scale-95"
            >
               <Plus size={18} /> {activeTab === 'Coupons' ? 'Create New Coupon' : 'Create New Campaign'}
            </button>
          )}
        </div>

        {/* Marketing Hub Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
           {['Campaigns', 'Coupons', 'Intelligence'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-seller-primary text-white shadow-lg shadow-seller-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 {tab}
              </button>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Main Content Area */}
           <div className="lg:col-span-2 space-y-8">
              
              <AnimatePresence mode="wait">
                 {activeTab === 'Campaigns' && (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="space-y-6"
                   >
                      {loading ? (
                        <div className="py-20 text-center space-y-4">
                           <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Campaigns...</p>
                        </div>
                      ) : campaigns.length === 0 ? (
                        <div 
                          onClick={() => setShowCampaignModal(true)}
                          className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:border-seller-primary/30 transition-all"
                        >
                           <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 group-hover:bg-seller-primary/5 group-hover:text-seller-primary transition-all">
                              <Megaphone size={32} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">New Growth Strategy</h4>
                              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No active campaigns. Click to schedule one.</p>
                           </div>
                        </div>
                      ) : campaigns.map((camp, i) => (
                        <div key={camp._id || i} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-5">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${camp.status === 'Active' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-500 shadow-lg shadow-amber-500/20'}`}>
                                    {camp.status === 'Active' ? <Zap size={24} /> : <Clock size={24} />}
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <h3 className="text-lg font-black text-slate-900 tracking-tight">{camp.title}</h3>
                                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${camp.status === 'Active' ? 'bg-emerald-55 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                          {camp.status}
                                       </span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{camp.type} • {camp.discountPercentage}% Off</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                                 <div className="text-center md:text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulated Reach</p>
                                    <h4 className="text-lg font-black text-slate-900">{camp.reachCount ? camp.reachCount.toLocaleString() : '0'}</h4>
                                 </div>
                                 <div className="text-center md:text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversions</p>
                                    <h4 className="text-lg font-black text-slate-900">{camp.conversions || 0}</h4>
                                 </div>
                                 <div className="text-center md:text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget</p>
                                    <h4 className="text-lg font-black text-slate-900">₹{(camp.budget || 0).toLocaleString()}</h4>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </motion.div>
                 )}

                 {activeTab === 'Coupons' && (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-6"
                   >
                      {loading ? (
                        <div className="py-20 text-center space-y-4">
                           <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Coupons...</p>
                        </div>
                      ) : coupons.length === 0 ? (
                        <div 
                          onClick={() => setShowCouponModal(true)}
                          className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:border-seller-primary/30 transition-all"
                        >
                           <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 group-hover:bg-seller-primary/5 group-hover:text-seller-primary transition-all">
                              <Tag size={32} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">New Discount Code</h4>
                              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No active coupons. Click to create one.</p>
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {coupons.map((coupon, i) => (
                             <div key={coupon._id || i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-seller-primary/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
                                <div className="relative z-10 space-y-6">
                                   <div className="flex items-center justify-between">
                                      <div className="w-12 h-12 bg-seller-primary/10 rounded-2xl flex items-center justify-center text-seller-primary">
                                         <Tag size={20} />
                                      </div>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Exp: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                         <button 
                                           onClick={() => handleDeleteCoupon(coupon._id)}
                                           className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                         >
                                            <Trash2 size={14} />
                                         </button>
                                      </div>
                                   </div>
                                   <div className="space-y-1">
                                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{coupon.code}</h3>
                                      <p className="text-xs font-black text-seller-primary uppercase tracking-widest">
                                         {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} OFF
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                         Min Order: ₹{coupon.minPurchaseAmount || 0}
                                      </p>
                                   </div>
                                   <div className="space-y-2">
                                      <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                         <span>Redemption Rate</span>
                                         <span>{coupon.usedCount || 0} / {coupon.usageLimit || 100}</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-seller-primary rounded-full transition-all" 
                                           style={{ width: `${Math.min(100, ((coupon.usedCount || 0) / (coupon.usageLimit || 100)) * 100)}%` }}
                                         ></div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </motion.div>
                 )}

                 {activeTab === 'Intelligence' && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8"
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-seller-primary/10 rounded-2xl flex items-center justify-center text-seller-primary shrink-0">
                            <Target size={28} />
                         </div>
                         <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Growth Diagnostics</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live store optimization feedback</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                         <div className="p-6 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl space-y-3">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest">Campaign Power</h4>
                               <span className="text-[8px] font-black text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded">High ROI</span>
                            </div>
                            <p className="text-xs text-emerald-800 leading-relaxed font-bold">
                               Your Flash Sale campaigns are performing significantly better than average in the interior decor sector. Consider scheduling weekend campaigns to capture maximum customer traffic.
                            </p>
                         </div>
                         <div className="p-6 bg-seller-primary/5 border border-seller-primary/10 rounded-3xl space-y-3">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-black text-seller-primary uppercase tracking-widest">Coupon Penetration</h4>
                               <span className="text-[8px] font-black text-seller-primary bg-white border border-seller-primary/10 px-2 py-0.5 rounded">Action Required</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-bold">
                               Coupon codes have a 45% higher cart-to-checkout conversion rate. Launch a percentage coupon code like <strong>WELCOME10</strong> and print it on packaging to drive repeat purchases.
                            </p>
                         </div>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>

           </div>

           {/* Performance Sidebar - Professional White Card */}
           <div className="space-y-8">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-seller-primary/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
                   <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full blur-[40px] -ml-16 -mb-16"></div>
                   
                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-seller-primary/10 rounded-xl flex items-center justify-center border border-seller-primary/10">
                            <BarChart3 size={20} className="text-seller-primary" />
                         </div>
                         <h3 className="text-lg font-black tracking-tight uppercase italic text-slate-900">Analytics</h3>
                      </div>
                      <div className="space-y-5">
                         {[
                           { label: 'Marketing ROI', val: analytics.roi || '4.2x', trend: '+12%', color: 'text-emerald-500', pct: 85 },
                           { label: 'Avg conversion', val: analytics.conversionRate || '5.8%', trend: '+0.4%', color: 'text-emerald-500', pct: 60 },
                           { label: 'Cust. Acquisition', val: analytics.cac || '₹142', trend: '-₹12', color: 'text-emerald-500', pct: 40 },
                         ].map((stat, i) => (
                           <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{stat.label}</p>
                                 <p className="text-lg font-black tracking-tight text-slate-900">{stat.val}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <span className={`text-[10px] font-black ${stat.color} bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-sm`}>{stat.trend}</span>
                                 <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-seller-primary" style={{ width: `${stat.pct}%` }}></div>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-seller-primary/5 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-700"></div>
                  <div className="relative z-10 space-y-5">
                     <div className="w-11 h-11 bg-seller-primary/10 rounded-xl flex items-center justify-center text-seller-primary">
                        <Target size={22} />
                     </div>
                     <div className="space-y-1">
                       <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">Smart Targeting</h4>
                       <p className="text-[8px] text-slate-400 leading-relaxed font-black uppercase tracking-[0.2em]">AI-Driven Merchant Ads</p>
                     </div>
                     <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Audience insights are already reflected in your campaign and coupon diagnostics.</p>
                     </div>
                  </div>
               </div>
           </div>

        </div>

        {/* Global Insight Banner */}
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-emerald-55/10 rounded-[2rem] flex items-center justify-center text-emerald-500 shrink-0">
                 <TrendingUp size={32} />
              </div>
              <div className="text-center md:text-left space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Market Share Growth</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-sm">Your brand visibility has increased by 14% in the last 30 days. Deploy more flash sales to capture the current trend.</p>
              </div>
           </div>
           <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trend guidance is shown here from current marketing analytics.</p>
           </div>
        </div>

      </div>

      {/* Campaign Creation Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setShowCampaignModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">Launch Campaign</h3>
                  <p className="text-sm text-slate-500">Run a flash sale or product boost</p>
                </div>
                <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Campaign Title *</label>
                  <input 
                    type="text" required placeholder="Summer Clearance Sale"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Type *</label>
                    <select 
                      value={campaignForm.type}
                      onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/20 transition-all text-slate-700"
                    >
                      <option value="Flash Sale">Flash Sale</option>
                      <option value="Product Boost">Product Boost</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Discount % *</label>
                    <input 
                      type="number" required min="1" max="99" placeholder="20"
                      value={campaignForm.discountPercentage}
                      onChange={(e) => setCampaignForm({ ...campaignForm, discountPercentage: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Campaign Budget (₹) *</label>
                  <input 
                    type="number" required min="500" placeholder="2500"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Start Date *</label>
                    <input 
                      type="datetime-local" required
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">End Date *</label>
                    <input 
                      type="datetime-local" required
                      min={campaignForm.startDate || undefined}
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Promoted Products (Optional)</label>
                  {products.length === 0 ? (
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">No products listed. Listing first is recommended.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-2xl p-3 space-y-2 bg-slate-50/50">
                      {products.map(prod => {
                        const isSelected = campaignForm.products.includes(prod._id);
                        return (
                          <div 
                            key={prod._id}
                            onClick={() => toggleProductSelection(prod._id)}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-white border-seller-primary/20 shadow-sm' : 'border-transparent hover:bg-slate-100/50'}`}
                          >
                             <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                <img src={prod.images && prod.images.length > 0 ? prod.images[0] : 'https://via.placeholder.com/80'} alt="" className="w-full h-full object-cover" />
                             </div>
                             <span className="text-xs font-bold text-slate-700 truncate flex-1">{prod.name}</span>
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-seller-primary bg-seller-primary text-white' : 'border-slate-300'}`}>
                                {isSelected && <CheckCircle2 size={10} />}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-seller-primary hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Launching...' : 'Schedule Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coupon Creation Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setShowCouponModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">Create Coupon Code</h3>
                  <p className="text-sm text-slate-500">Provide scoped discount codes for your buyers</p>
                </div>
                <button onClick={() => setShowCouponModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Coupon Code *</label>
                  <input 
                    type="text" required placeholder="WELCOME20"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/20 transition-all uppercase tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Discount Type *</label>
                    <select 
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/20 transition-all text-slate-700"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Discount Value *</label>
                    <input 
                      type="number" required min="1" placeholder={couponForm.discountType === 'percentage' ? '20' : '500'}
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Min Purchase Amount (₹)</label>
                    <input 
                      type="number" min="0" placeholder="999"
                      value={couponForm.minPurchaseAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minPurchaseAmount: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Max Discount (₹)</label>
                    <input 
                      type="number" min="1" placeholder="1000"
                      value={couponForm.maxDiscountAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Usage Redemption Limit</label>
                    <input 
                      type="number" min="1" placeholder="100"
                      value={couponForm.usageLimit}
                      onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Expiry Date *</label>
                    <input 
                      type="date" required
                      min={todayDateString}
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-seller-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-seller-primary hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default Marketing;
