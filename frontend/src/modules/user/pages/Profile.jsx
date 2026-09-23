import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiPackage, FiMapPin, FiSettings, FiLogOut,
  FiChevronRight, FiGift, FiCopy, FiCheck, FiHeart,
  FiShield, FiPhone, FiFileText, FiAlertCircle, FiCompass, FiTruck, FiZap, FiCheckCircle, FiClock,
  FiCreditCard, FiExternalLink, FiBriefcase, FiLayers, FiDollarSign, FiEdit3, FiPlusCircle,
  FiActivity, FiArrowUpRight, FiTool, FiCheckSquare, FiInfo
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { useWishlist } from '../data/WishlistContext';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-hot-toast';
import { 
  LuSparkles, LuPalette, LuLayoutDashboard, LuCalculator, LuCrown, LuHammer, 
  LuBuilding2, LuCircleCheck, LuTriangleAlert, LuBoxes, LuBrain, LuPenTool, 
  LuTrendingUp, LuArrowRight, LuFolderTree, LuBadgeCheck, LuStore, LuReceipt,
  LuFileSpreadsheet, LuMapPinned
} from 'react-icons/lu';
import SubscriptionModal from '../components/SubscriptionModal';
import B2CSubscriptionModal from '../components/B2CSubscriptionModal';
import api from '../../../shared/utils/api';

/* ── Standard Consumer Menu Items ── */
const consumerMenuItems = [
  { icon: FiUser,    title: 'My Profile',        subtitle: 'View and edit personal information',     link: '/profile/edit' },
  { icon: FiCompass, title: 'My Design Profile',  subtitle: 'View your AI style blueprint & matches',  link: '/designer-quiz/results' },
  { icon: FiPackage, title: 'Orders',             subtitle: 'Track, manage and reorder',              link: '/orders' },
  { icon: FiHeart,   title: 'Wishlist',           subtitle: 'Saved items and collections',            scrollTarget: 'wishlist-section' },
  { icon: FiMapPin,  title: 'Addresses',          subtitle: 'Manage delivery addresses',              link: '/addresses' },
  { icon: FiGift,    title: 'Referral & Rewards', subtitle: 'Earn credits by referring friends',      link: '/referral-rewards' },
  { icon: FiSettings,title: 'Account Settings',   subtitle: 'Privacy, security and preferences',     link: '/profile/edit' },
];

/* ── Enterprise AI Pro Studio Tools List ── */
const enterpriseAITools = [
  { 
    id: 'content-generator',
    icon: LuSparkles, 
    title: 'Seller AI Marketing & Copywriting Studio', 
    subtitle: 'Auto-generate titles, SEO tags, social media copy & email campaigns', 
    link: '/seller/content-generator', 
    badge: 'AI GENIUS',
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-600'
  },
  { 
    id: 'orders-track',
    icon: FiTruck, 
    title: 'Real-Time Order Tracking & AI Maps', 
    subtitle: 'Live GPS truck location, AI estimated arrival predictions & delivery OTP proof', 
    link: '/orders/track', 
    badge: 'LIVE GPS',
    accent: 'from-blue-500/20 to-cyan-500/20 text-blue-600'
  },
  { 
    id: 'quotation-generator',
    icon: FiFileText, 
    title: 'Professional B2B Quotation Generator', 
    subtitle: 'Create GST-compliant legally compliant quotes with payment schedules & AI clauses', 
    link: '/quotation-generator', 
    badge: 'GST READY',
    accent: 'from-teal-500/20 to-emerald-500/20 text-[#189D91]'
  },
  { 
    id: 'boq-generator',
    icon: LuFileSpreadsheet, 
    title: 'BOQ Generator (Bill of Quantities)', 
    subtitle: 'Generate itemized architecture & procurement shopping lists with automated pricing', 
    link: '/boq-generator', 
    badge: 'AUTOMATED',
    accent: 'from-purple-500/20 to-indigo-500/20 text-purple-600'
  },
  { 
    id: 'cost-estimator',
    icon: LuCalculator, 
    title: 'AI Room Cost Estimator', 
    subtitle: 'Itemized material costing, budget estimation tiers & Gemini AI intelligence', 
    link: '/cost-estimator', 
    badge: 'ESTIMATOR',
    accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-600'
  },
  { 
    id: 'projects',
    icon: LuLayoutDashboard, 
    title: 'My Enterprise Projects Studio', 
    subtitle: 'Manage client deliverables, execution milestones, budgets & design specs', 
    link: '/projects', 
    badge: 'STUDIO',
    accent: 'from-sky-500/20 to-blue-500/20 text-sky-600'
  },
  { 
    id: 'client-brief',
    icon: FiFileText, 
    title: 'AI Project Brief Generator', 
    subtitle: '8-section comprehensive interior project design brief with AI synthesis', 
    link: '/client-brief', 
    badge: 'AI DOC',
    accent: 'from-pink-500/20 to-rose-500/20 text-pink-600'
  },
  { 
    id: 'ai-room-visualizer',
    icon: LuSparkles, 
    title: 'AI Room Visualizer & Staging', 
    subtitle: 'Upload space photos and transform styling, textures and furniture with AI', 
    link: '/ai-room-visualizer', 
    badge: 'VISION AI',
    accent: 'from-violet-500/20 to-purple-500/20 text-violet-600'
  },
  { 
    id: 'ai-mood-board',
    icon: LuPalette, 
    title: 'AI Mood Board Generator', 
    subtitle: 'Curate aesthetic style palettes, material textures and color swatches', 
    link: '/ai-mood-board', 
    badge: 'CREATIVE',
    accent: 'from-amber-500/20 to-yellow-500/20 text-amber-600'
  },
  { 
    id: 'designer-quiz',
    icon: FiCompass, 
    title: 'Design Persona & Style Blueprint', 
    subtitle: 'Tailored architectural preferences & matched catalog suggestions', 
    link: '/designer-quiz/results', 
    badge: 'BLUEPRINT',
    accent: 'from-teal-500/20 to-cyan-500/20 text-teal-600'
  }
];

const supportLinks = [
  { title: 'Contact Enterprise Support', icon: FiPhone,      link: '/contact' },
  { title: 'Privacy & Refund Policy',    icon: FiShield,     link: '/policies/refund' },
  { title: 'B2B Terms & Conditions',     icon: FiFileText,   link: '/terms' },
  { title: 'Cancellation Policy',        icon: FiAlertCircle,link: '/policies/cancellation' },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout, addresses } = useUser();
  const [copied, setCopied] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isB2CModalOpen, setIsB2CModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  
  // Active Sidebar Tab for Enterprise Dashboard
  const [activeTab, setActiveTab] = useState('overview');
  
  // Business Edit Modal State
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    shopName: '',
    gstNumber: '',
    taxationCode: '',
    phone: '',
    fullName: ''
  });
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    api.get('/referrals/wallet')
      .then(({ data }) => setWalletBalance(data?.data?.balance ?? 0))
      .catch(() => setWalletBalance(0));
  }, []);

  useEffect(() => {
    if (user) {
      setBusinessForm({
        shopName: user.businessDetails?.shopName || '',
        gstNumber: user.businessDetails?.gstNumber || '',
        taxationCode: user.businessDetails?.taxationCode || '',
        phone: user.phone || '',
        fullName: user.fullName || user.name || ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyReferralCode = () => {
    const code = user?.referralCode || 'RIDDHA-2026';
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBusinessDetails = async (e) => {
    if (e) e.preventDefault();
    setSavingBusiness(true);
    try {
      const payload = {
        fullName: businessForm.fullName,
        phone: businessForm.phone,
        businessDetails: {
          shopName: businessForm.shopName,
          gstNumber: businessForm.gstNumber,
          taxationCode: businessForm.taxationCode,
          isVerified: user.businessDetails?.isVerified || false
        }
      };

      const res = await api.put('/user/profile', payload).catch(() => api.put('/auth/user/profile', payload));
      if (res?.data?.success && res?.data?.data) {
        setUser({
          ...user,
          ...res.data.data
        });
        toast.success('Business details updated successfully!');
        setIsEditingBusiness(false);
      } else {
        toast.success('Business details saved!');
        setUser(prev => ({
          ...prev,
          fullName: businessForm.fullName,
          phone: businessForm.phone,
          businessDetails: {
            ...prev.businessDetails,
            shopName: businessForm.shopName,
            gstNumber: businessForm.gstNumber,
            taxationCode: businessForm.taxationCode
          }
        }));
        setIsEditingBusiness(false);
      }
    } catch (err) {
      console.error('Failed to update business details:', err);
      toast.error(err.response?.data?.error || 'Failed to update business details');
    } finally {
      setSavingBusiness(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <FiUser className="h-10 w-10 text-gray-200 mx-auto" />
          <p className="text-sm font-semibold text-gray-400">Please sign in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-2.5 bg-[#189D91] hover:bg-[#14847a] text-white font-bold rounded-xl transition-all text-xs shadow-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Exact check for enterprise user type (matches 'enterpriser' or 'enterprise')
  const userTypeStr = String(user?.userType || '').toLowerCase().trim();
  const isEnterprise = userTypeStr === 'enterpriser' || userTypeStr === 'enterprise';

  const initials = (user.fullName || user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const isProActive = isEnterprise && user?.subscription?.status === 'active' && user?.subscription?.endDate && new Date(user.subscription.endDate) > new Date();
  const daysRemaining = isProActive ? Math.max(0, Math.ceil((new Date(user.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  // B2C subscription state
  const isB2CActive = !isEnterprise && user?.b2cSubscription?.status === 'active' && user?.b2cSubscription?.endDate && new Date(user.b2cSubscription.endDate) > new Date();
  const b2cDaysRemaining = isB2CActive ? Math.max(0, Math.ceil((new Date(user.b2cSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  /* ══════════════════════════════════════════════════════════════════
     ENTERPRISE B2B DASHBOARD VIEW (Left Sidebar + Right Details)
     ══════════════════════════════════════════════════════════════════ */
  if (isEnterprise) {
    const sidebarNavGroups = [
      {
        groupTitle: 'ENTERPRISE CORE',
        items: [
          { id: 'overview',   label: 'Dashboard Overview', icon: LuLayoutDashboard, badge: null },
          { id: 'business',   label: 'Business & GST Profile', icon: LuBuilding2, badge: user?.businessDetails?.isVerified ? 'VERIFIED' : null },
          { id: 'ai-tools',   label: 'AI Pro Design Studio', icon: LuSparkles, badge: '10 TOOLS' },
        ]
      },
      {
        groupTitle: 'PROCUREMENT & TRADING',
        items: [
          { id: 'orders',     label: 'B2B Orders & Tracking', icon: FiPackage, badge: null },
          { id: 'rfq',        label: 'Bulk RFQ & Custom Quotes', icon: FiFileText, badge: 'B2B' },
          { id: 'addresses',  label: 'Delivery Sites & Warehouses', icon: FiMapPin, badge: addresses?.length ? `${addresses.length}` : null },
        ]
      },
      {
        groupTitle: 'FINANCES & REWARDS',
        items: [
          { id: 'wallet',     label: 'Riddha Enterprise Wallet', icon: FiCreditCard, badge: walletBalance !== null ? `₹${walletBalance}` : null },
          { id: 'referrals',  label: 'Partner Referral Programme', icon: FiGift, badge: '₹100' },
          { id: 'wishlist',   label: 'Saved Materials & Specs', icon: FiHeart, badge: null },
        ]
      },
      {
        groupTitle: 'ACCOUNT & COMPLIANCE',
        items: [
          { id: 'settings',   label: 'Settings & Legal Policies', icon: FiSettings, badge: null },
        ]
      }
    ];

    return (
      <div className="min-h-screen bg-[#F4F6F9] pb-24 md:pb-12 text-slate-800">
        
        {/* Enterprise Top Banner / Identity Header */}
        <div className="bg-gradient-to-r from-[#0d2824] via-[#09413b] to-[#125950] text-white border-b border-teal-900/40 px-4 py-6 md:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Business & User Identity */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-inner">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-amber-300 tracking-wider">{initials}</span>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/profile/edit')}
                  title="Edit Avatar & Info"
                  className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg p-1.5 shadow-md transition-all active:scale-90"
                >
                  <FiSettings size={12} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <LuBuilding2 size={12} /> B2B Enterprise Account
                  </span>
                  {user?.businessDetails?.isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <LuBadgeCheck size={12} /> Verified GST
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-semibold uppercase tracking-wider">
                      Verification In Progress
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                  {user?.businessDetails?.shopName || user.fullName || user.name || 'Enterprise Client'}
                </h1>
                
                <p className="text-xs text-teal-200/80 font-medium flex items-center gap-2 mt-0.5">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>Member Since {memberSince}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons & Status Badge */}
            <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto">
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LuCrown className="w-4 h-4 text-slate-950" />
                {isProActive ? 'Extend AI Pro Plan' : 'Unlock AI Pro Studio'}
              </button>

              <Link
                to="/rfq/new"
                className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FiPlusCircle size={14} className="text-teal-300" /> New Bulk RFQ
              </Link>
            </div>
          </div>
        </div>

        {/* ── Dashboard Main Layout: Left Sidebar + Right Selected Panel ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ═══════════════════════════════════════
               LEFT SIDEBAR (Navigation Menu)
               ═══════════════════════════════════════ */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
              
              {/* Mobile Horizontal Navigation Strip */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {sidebarNavGroups.flatMap(g => g.items).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-[#189D91] text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Sticky Vertical Navigation Card */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3.5 sticky top-20 space-y-5">
                
                {/* Enterprise Quick Header in Sidebar */}
                <div className="p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#189D91] uppercase tracking-widest">B2B Profile Dashboard</p>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                      {user.businessDetails?.shopName || user.fullName || 'Business Portal'}
                    </p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-100" />
                </div>

                {/* Navigation Groups */}
                <div className="space-y-4">
                  {sidebarNavGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                      <p className="px-3 text-[9.5px] font-black tracking-wider text-gray-400 uppercase">
                        {group.groupTitle}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                                isActive
                                  ? 'bg-[#189D91] text-white shadow-sm font-black'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#189D91]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#189D91] transition-colors'} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-teal-50 text-[#189D91] border border-teal-100'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar Bottom Controls */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all"
                  >
                    <LuCrown className="text-amber-600" size={14} /> AI Membership Plans
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                  >
                    <FiLogOut size={13} /> Sign Out
                  </button>
                </div>

              </div>
            </aside>

            {/* ═══════════════════════════════════════
               RIGHT CONTENT PANEL (Selected Details)
               ═══════════════════════════════════════ */}
            <main className="lg:col-span-8 xl:col-span-9 space-y-6">
              <AnimatePresence mode="wait">
                
                {/* TAB 1: DASHBOARD OVERVIEW */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {/* Membership Pro Banner */}
                    {isProActive ? (
                      <div className="bg-gradient-to-r from-[#003d33] via-[#189D91] to-[#28a399] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                              <LuCrown className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
                                  {user.subscription?.planName || 'RIDDHA AI PRO'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase tracking-wider">
                                  ACTIVE PLAN
                                </span>
                              </div>
                              <h3 className="text-lg font-black text-white mt-0.5">Enterprise AI Pro Studio Unlocked</h3>
                              <p className="text-xs text-teal-100 font-medium flex items-center gap-1.5 mt-0.5">
                                <FiClock className="w-3.5 h-3.5 text-amber-300" />
                                Valid until {new Date(user.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({daysRemaining} days remaining)
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsSubscriptionModalOpen(true)}
                            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                          >
                            <FiZap className="w-4 h-4" /> Manage Plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-700/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black shrink-0 mt-0.5">
                              <LuCrown className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                                PRO MEMBERSHIP REQUIRED • AI FEATURES
                              </span>
                              <h3 className="text-lg font-black text-white mt-1">Unlock All 10 Enterprise AI Tools</h3>
                              <p className="text-xs text-slate-300 font-medium max-w-lg mt-0.5 leading-relaxed">
                                Subscribe to Silver, Gold, Platinum or Diamond to unlock AI Design Blueprint, Cost Estimator, BOQ Generator, Quotations & Project Studio!
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsSubscriptionModalOpen(true)}
                            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                          >
                            <FiZap className="w-4 h-4" /> Upgrade Plan 👑
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Enterprise Wallet</p>
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#189D91] flex items-center justify-center">
                            <FiCreditCard size={14} />
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900">
                          {walletBalance === null ? '...' : `₹${walletBalance.toLocaleString('en-IN')}`}
                        </h4>
                        <button onClick={() => setActiveTab('wallet')} className="text-[10.5px] font-bold text-[#189D91] hover:underline flex items-center gap-1">
                          View details <LuArrowRight size={10} />
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Business GST</p>
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <LuBuilding2 size={14} />
                          </div>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {user.businessDetails?.gstNumber || 'Not Linked'}
                        </h4>
                        <button onClick={() => setActiveTab('business')} className="text-[10.5px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          Manage GST <LuArrowRight size={10} />
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Delivery Sites</p>
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FiMapPin size={14} />
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900">{addresses?.length || 0} Locations</h4>
                        <button onClick={() => setActiveTab('addresses')} className="text-[10.5px] font-bold text-amber-600 hover:underline flex items-center gap-1">
                          Manage sites <LuArrowRight size={10} />
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">AI Pro Tools</p>
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <LuSparkles size={14} />
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900">10 AI Tools</h4>
                        <button onClick={() => setActiveTab('ai-tools')} className="text-[10.5px] font-bold text-purple-600 hover:underline flex items-center gap-1">
                          Launch Studio <LuArrowRight size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Quick AI Studio Shortcuts Grid */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-900">Enterprise AI Studio Suite</h3>
                          <p className="text-xs text-gray-500 font-medium">1-click access to all AI architecture, costing, and quotation tools</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('ai-tools')}
                          className="text-xs font-bold text-[#189D91] hover:underline flex items-center gap-1"
                        >
                          View All 10 Tools <LuArrowRight size={12} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {enterpriseAITools.slice(0, 6).map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <Link
                              key={tool.id}
                              to={tool.link}
                              className="p-3.5 rounded-xl border border-gray-100 hover:border-[#189D91]/40 hover:bg-teal-50/20 transition-all flex items-start gap-3 group"
                            >
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tool.accent} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-[#189D91] truncate transition-colors">
                                  {tool.title}
                                </p>
                                <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{tool.subtitle}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Enterprise Shortcuts */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Link
                        to="/orders"
                        className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:border-[#189D91]/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#189D91] flex items-center justify-center group-hover:scale-105 transition-transform">
                            <FiPackage size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">Track & Reorder</p>
                            <p className="text-[10px] text-gray-400">All procurement orders</p>
                          </div>
                        </div>
                        <FiChevronRight size={14} className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
                      </Link>

                      <Link
                        to="/rfq/new"
                        className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:border-[#189D91]/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <FiFileText size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">Request Custom RFQ</p>
                            <p className="text-[10px] text-gray-400">Volume wholesale quotes</p>
                          </div>
                        </div>
                        <FiChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </Link>

                      <Link
                        to="/quotation-generator"
                        className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:border-[#189D91]/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <LuReceipt size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">GST Quotations</p>
                            <p className="text-[10px] text-gray-400">Export client estimates</p>
                          </div>
                        </div>
                        <FiChevronRight size={14} className="text-gray-300 group-hover:text-amber-600 transition-colors" />
                      </Link>
                    </div>

                  </motion.div>
                )}

                {/* TAB 2: BUSINESS & GST PROFILE */}
                {activeTab === 'business' && (
                  <motion.div
                    key="business"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <LuBuilding2 className="text-[#189D91]" /> Enterprise Business Profile
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Manage your legal entity name, GSTIN number, and taxation identifiers for wholesale orders.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditingBusiness(!isEditingBusiness)}
                          className="px-4 py-2 rounded-xl bg-teal-50 text-[#189D91] hover:bg-teal-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <FiEdit3 size={13} /> {isEditingBusiness ? 'Cancel Editing' : 'Edit Business Info'}
                        </button>
                      </div>

                      {/* View or Edit Business Details */}
                      {isEditingBusiness ? (
                        <form onSubmit={handleSaveBusinessDetails} className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company / Shop Legal Name *</label>
                              <input
                                type="text"
                                required
                                value={businessForm.shopName}
                                onChange={e => setBusinessForm({ ...businessForm, shopName: e.target.value })}
                                placeholder="e.g. Apex Interiors Pvt Ltd"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#189D91] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Authorized Representative Name</label>
                              <input
                                type="text"
                                value={businessForm.fullName}
                                onChange={e => setBusinessForm({ ...businessForm, fullName: e.target.value })}
                                placeholder="Contact person full name"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#189D91] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GSTIN Number</label>
                              <input
                                type="text"
                                value={businessForm.gstNumber}
                                onChange={e => setBusinessForm({ ...businessForm, gstNumber: e.target.value.toUpperCase() })}
                                placeholder="e.g. 19ABCDE1234F1Z5"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium uppercase focus:outline-none focus:border-[#189D91] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taxation Code / PAN</label>
                              <input
                                type="text"
                                value={businessForm.taxationCode}
                                onChange={e => setBusinessForm({ ...businessForm, taxationCode: e.target.value.toUpperCase() })}
                                placeholder="e.g. ABCDE1234F"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium uppercase focus:outline-none focus:border-[#189D91] transition-colors"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered Business Phone</label>
                              <input
                                type="tel"
                                value={businessForm.phone}
                                onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                placeholder="10-digit mobile number"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#189D91] transition-colors"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => setIsEditingBusiness(false)}
                              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingBusiness}
                              className="px-6 py-2.5 rounded-xl bg-[#189D91] hover:bg-[#14847a] text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                            >
                              {savingBusiness ? 'Saving Changes...' : 'Save Business Info'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Company / Shop Name</p>
                            <p className="text-base font-black text-slate-800">
                              {user?.businessDetails?.shopName || 'Not Provided'}
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">GSTIN Number</p>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-mono font-bold text-slate-800">
                                {user?.businessDetails?.gstNumber || 'Not Provided'}
                              </p>
                              {user?.businessDetails?.gstNumber && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">VALID FORMAT</span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Taxation Identifier / PAN</p>
                            <p className="text-base font-mono font-bold text-slate-800">
                              {user?.businessDetails?.taxationCode || 'Not Provided'}
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">GST Verification Status</p>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                              {user?.businessDetails?.isVerified ? (
                                <span className="text-emerald-600 flex items-center gap-1 font-black">
                                  <LuCircleCheck size={16} /> Verified B2B Merchant
                                </span>
                              ) : (
                                <span className="text-amber-600 flex items-center gap-1 font-semibold">
                                  <LuTriangleAlert size={16} /> Documents Under Review
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enterprise Benefits Card */}
                    <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-3">
                      <h4 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <LuCrown className="w-4 h-4" /> B2B Enterprise Account Privileges
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-teal-100/90">
                        <div className="flex items-start gap-2">
                          <FiCheck className="text-amber-300 shrink-0 mt-0.5" />
                          <span>Exempt from standard B2C cart unit ordering caps</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiCheck className="text-amber-300 shrink-0 mt-0.5" />
                          <span>Direct B2B wholesale pricing tier across entire catalog</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiCheck className="text-amber-300 shrink-0 mt-0.5" />
                          <span>1-click GST invoice generation with input tax credit (ITC)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiCheck className="text-amber-300 shrink-0 mt-0.5" />
                          <span>Dedicated wholesale quotation & RFQ pricing workflow</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: AI PRO DESIGN STUDIO */}
                {activeTab === 'ai-tools' && (
                  <motion.div
                    key="ai-tools"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <LuSparkles className="text-amber-500" /> Enterprise AI Studio Tools
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Complete suite of 10 intelligent tools for copywriting, costing, automated BOQ, live GPS delivery, and 3D visualizers.
                          </p>
                        </div>
                        {!isProActive && (
                          <button
                            onClick={() => setIsSubscriptionModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                          >
                            👑 Upgrade to Unlock All
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enterpriseAITools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <div
                              key={tool.id}
                              className="p-4 rounded-2xl border border-gray-200/80 hover:border-[#189D91]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group bg-white"
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tool.accent} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                  <Icon size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-[#189D91] transition-colors">
                                      {tool.title}
                                    </h4>
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-gray-100 text-gray-700">
                                      {tool.badge}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                                    {tool.subtitle}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {isProActive ? '✓ Available on your plan' : 'Requires AI Pro Plan'}
                                </span>
                                <Link
                                  to={tool.link}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#189D91] hover:bg-[#14847a] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <span>Open Tool</span>
                                  <FiArrowUpRight size={13} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: B2B ORDERS & TRACKING */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiPackage className="text-[#189D91]" /> B2B Orders & Procurement Hub
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Review your enterprise supply orders, delivery dispatch logs, and download tax invoices.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/orders/track"
                            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <FiTruck size={13} /> Live GPS Tracking
                          </Link>
                          <Link
                            to="/orders"
                            className="px-4 py-2 rounded-xl bg-[#189D91] text-white hover:bg-[#14847a] font-black text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            View All Orders <LuArrowRight size={12} />
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-[#189D91] text-white flex items-center justify-center">
                            <FiPackage size={18} />
                          </div>
                          <h4 className="text-sm font-black text-slate-800">Order Management & Reorders</h4>
                          <p className="text-xs text-slate-600">Track shipments, verify delivery OTP proof, and re-order previous procurement materials in 1-click.</p>
                          <Link to="/orders" className="inline-block text-xs font-bold text-[#189D91] hover:underline pt-2">
                            Open Orders Center →
                          </Link>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <FiTruck size={18} />
                          </div>
                          <h4 className="text-sm font-black text-slate-800">Real-Time Driver GPS Tracking</h4>
                          <p className="text-xs text-slate-600">Track truck routes live on map with Gemini AI arrival predictions and site delivery contact info.</p>
                          <Link to="/orders/track" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">
                            Launch GPS Tracking Map →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 5: BULK RFQ & CUSTOM QUOTES */}
                {activeTab === 'rfq' && (
                  <motion.div
                    key="rfq"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiFileText className="text-[#189D91]" /> Bulk RFQ & Custom Wholesale Quotes
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Submit large project material requirements and receive negotiated wholesale volume pricing directly from manufacturers.
                          </p>
                        </div>
                        <Link
                          to="/rfq/new"
                          className="px-4 py-2.5 rounded-xl bg-[#189D91] hover:bg-[#14847a] text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                          <FiPlusCircle size={14} /> Create New RFQ
                        </Link>
                      </div>

                      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-teal-950 text-white space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                            <LuSparkles size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white">How Riddha Bulk RFQ Works</h4>
                            <p className="text-xs text-teal-200/90 font-medium">Save up to 35% on high-volume construction & interior orders</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                            <span className="text-xs font-black text-amber-300">STEP 1</span>
                            <p className="text-xs font-bold text-white">Submit Specs or BOQ</p>
                            <p className="text-[11px] text-teal-100/80">Upload specifications, floor plans or item quantities.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                            <span className="text-xs font-black text-amber-300">STEP 2</span>
                            <p className="text-xs font-bold text-white">Direct Factory Quotes</p>
                            <p className="text-[11px] text-teal-100/80">Suppliers compete to provide best wholesale rates.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                            <span className="text-xs font-black text-amber-300">STEP 3</span>
                            <p className="text-xs font-bold text-white">1-Click Approval</p>
                            <p className="text-[11px] text-teal-100/80">Review terms, pay with escrow and schedule phased dispatch.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 6: DELIVERY SITES & ADDRESSES */}
                {activeTab === 'addresses' && (
                  <motion.div
                    key="addresses"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiMapPin className="text-[#189D91]" /> Delivery Sites & Warehouses
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Manage multiple client job sites, warehouses, and material unloading coordinates.
                          </p>
                        </div>
                        <Link
                          to="/addresses"
                          className="px-4 py-2 rounded-xl bg-[#189D91] hover:bg-[#14847a] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FiPlusCircle size={14} /> Add / Manage Sites
                        </Link>
                      </div>

                      {addresses && addresses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr, idx) => (
                            <div key={addr._id || idx} className="p-4 rounded-2xl border border-gray-200/80 space-y-2 relative bg-gray-50/50">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[#189D91] text-[10px] font-black uppercase">
                                  {addr.addressType || 'Site Location'}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    PRIMARY SITE
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-800">{addr.fullName}</h4>
                              <p className="text-xs text-gray-600 leading-relaxed">{addr.fullAddress}</p>
                              <p className="text-xs font-semibold text-gray-500">
                                {addr.city}, {addr.pincode} • Phone: {addr.mobileNumber}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <FiMapPin className="mx-auto text-gray-300" size={32} />
                          <p className="text-xs font-bold text-gray-500">No job sites or warehouse addresses saved yet</p>
                          <Link to="/addresses" className="inline-block px-4 py-2 bg-[#189D91] text-white text-xs font-bold rounded-xl shadow-sm">
                            Add First Site Location
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB 7: RIDDHA ENTERPRISE WALLET */}
                {activeTab === 'wallet' && (
                  <motion.div
                    key="wallet"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiCreditCard className="text-[#189D91]" /> Enterprise Wallet & Credits
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Store refunds, bulk credits, and referral bonuses to apply on procurement checkouts.
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-teal-900 via-[#0d4f48] to-[#189D91] rounded-2xl p-6 text-white shadow-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-teal-200 uppercase tracking-widest">Available Balance</p>
                          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">100% USABLE AT CHECKOUT</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                          {walletBalance === null ? '...' : `₹${walletBalance.toLocaleString('en-IN')}`}
                        </h2>
                        <p className="text-xs text-teal-100/90 leading-relaxed max-w-md">
                          Wallet balance can be applied towards any material purchase, order adjustments, and subscription renewals.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 8: REFERRAL & PARTNER REWARDS */}
                {activeTab === 'referrals' && (
                  <motion.div
                    key="referrals"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiGift className="text-[#189D91]" /> Enterprise Partner Referral Hub
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Invite fellow contractors, architects, and designers to earn ₹100 credits per registration.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800">Your Enterprise Partner Code</p>
                          <p className="text-xs text-gray-500">Your invited associates get ₹50 off their first order.</p>
                          {(user.referralCount || 0) > 0 && (
                            <p className="text-xs font-bold text-[#189D91] pt-1">
                              🎉 {user.referralCount} business partner{user.referralCount === 1 ? '' : 's'} registered
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="px-5 py-2.5 bg-white rounded-xl border border-dashed border-[#189D91]/40 font-mono font-black text-slate-900 tracking-widest text-base shadow-sm">
                            {user.referralCode || 'RIDDHA-B2B'}
                          </div>
                          <button
                            onClick={copyReferralCode}
                            className="h-11 w-11 bg-[#189D91] hover:bg-[#14847a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm"
                          >
                            {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 9: SAVED MATERIALS & WISHLIST */}
                {activeTab === 'wishlist' && (
                  <motion.div
                    key="wishlist"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiHeart className="text-[#189D91]" /> Saved Materials & Specifications
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Catalog products bookmarked for your ongoing client projects.
                          </p>
                        </div>
                        <Link to="/shop" className="text-xs font-bold text-[#189D91] hover:underline">
                          Browse Catalog →
                        </Link>
                      </div>

                      <WishlistSection isEmbedded={true} />
                    </div>
                  </motion.div>
                )}

                {/* TAB 10: SETTINGS & LEGAL POLICIES */}
                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FiSettings className="text-[#189D91]" /> Account Settings & Compliance
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            Manage login credentials, security preferences, and view official B2B trade policies.
                          </p>
                        </div>
                      </div>

                      {/* Personal Settings Shortcut */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                          to="/profile/edit"
                          className="p-4 rounded-2xl border border-gray-200/80 hover:border-[#189D91]/50 transition-all flex items-center justify-between group bg-gray-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#189D91] flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FiUser size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">Edit Personal Profile</p>
                              <p className="text-[10px] text-gray-400">Name, avatar, contact phone</p>
                            </div>
                          </div>
                          <FiChevronRight size={14} className="text-gray-400 group-hover:text-[#189D91] transition-colors" />
                        </Link>

                        <button
                          onClick={() => setIsSubscriptionModalOpen(true)}
                          className="p-4 rounded-2xl border border-gray-200/80 hover:border-amber-400/50 transition-all flex items-center justify-between group bg-amber-50/30 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <LuCrown size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">AI Membership Tier</p>
                              <p className="text-[10px] text-gray-400">Manage plan subscription</p>
                            </div>
                          </div>
                          <FiChevronRight size={14} className="text-gray-400 group-hover:text-amber-700 transition-colors" />
                        </button>
                      </div>

                      {/* Legal Policies Links */}
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Legal Terms & Support</p>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                          {supportLinks.map((item, i) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={i}
                                to={item.link}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                              >
                                <Icon size={14} className="text-gray-400 group-hover:text-[#189D91] shrink-0" />
                                <span className="flex-1 text-xs font-semibold text-slate-700 group-hover:text-[#189D91] transition-colors">{item.title}</span>
                                <FiChevronRight size={13} className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sign Out Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-black transition-all"
                        >
                          <FiLogOut size={14} /> Sign Out of Enterprise Account
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </main>

          </div>
        </div>

        {/* AI Pro Subscription Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
        />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     STANDARD CONSUMER PROFILE VIEW (Customer UserType)
     ══════════════════════════════════════════════════════════════════ */
  const visibleConsumerItems = [
    ...consumerMenuItems,
    ...(isB2CActive && user?.b2cSubscription?.hireDesigner ? [{ icon: LuPalette, title: 'Hire Designer', subtitle: 'Connect with verified interior designers for your project', link: '/hire/Designer', badge: 'B2C PRO' }] : []),
    ...(isB2CActive && user?.b2cSubscription?.hireContractor ? [{ icon: LuHammer, title: 'Hire Contractor', subtitle: 'Hire certified contractors for renovation & civil work', link: '/hire/Contractor', badge: 'B2C PRO' }] : []),
    ...(isB2CActive && user?.b2cSubscription?.hireArchitect ? [{ icon: LuBuilding2, title: 'Hire Architect', subtitle: 'Work with licensed architects for floor plans & design blueprints', link: '/hire/Architect', badge: 'B2C PRO' }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8F9FB] pb-28 md:pb-12">

      {/* Consumer Profile Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-5 md:px-8 md:pt-10 md:pb-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[#189D91]/10 flex items-center justify-center overflow-hidden border border-[#189D91]/20">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-black text-[#189D91]">{initials}</span>
              )}
            </div>
            <Link to="/profile/edit" className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <FiSettings className="h-3 w-3 text-[#189D91]" />
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-xl font-black text-slate-800 truncate">
              {user.fullName || user.name || 'Account'}
            </h1>
            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {isB2CActive ? (
                <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <LuCrown className="w-3 h-3 text-white" /> {user.b2cSubscription?.planName || 'B2C PRO MEMBER'}
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest bg-[#189D91]/10 text-[#189D91] px-2.5 py-1 rounded-full border border-[#189D91]/15">
                  Standard Customer
                </span>
              )}
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                Since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-4 pt-4">

        {/* B2C Active / Upgrade Card */}
        {isB2CActive ? (
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white text-orange-500 flex items-center justify-center font-black shadow-md shrink-0">
                  <LuCrown className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white/90 uppercase tracking-widest">{user.b2cSubscription?.planName || 'B2C PRO'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[9px] font-black uppercase">ACTIVE</span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5">B2C Pro Plan Active</h3>
                  <p className="text-xs text-white/80 font-medium flex items-center gap-1 mt-0.5">
                    <FiClock className="w-3.5 h-3.5" />
                    Valid until {new Date(user.b2cSubscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({b2cDaysRemaining} days left)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsB2CModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-orange-50 text-orange-600 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <FiZap className="w-4 h-4" /> Manage B2C Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-5 md:p-6 border-2 border-amber-200 shadow-lg relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-black shrink-0">
                  <LuCrown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                    B2C UPGRADE TO PRO PLAN
                  </span>
                  <h3 className="text-base font-black text-gray-900 mt-1">Unlock Fastest Delivery & Hire Services</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-md mt-0.5">
                    Get Fastest Delivery, EMI options, and access to Hire Designer, Contractor & Architect.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => setIsB2CModalOpen(true)}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                >
                  <FiZap className="w-4 h-4" /> Upgrade to Pro Plan 👑
                </button>
                <Link to="/plans" className="text-center text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">
                  View All Plans →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Consumer Menu List */}
        <div className="bg-white rounded-2xl border border-[#189D91]/15 overflow-hidden divide-y divide-gray-50 shadow-sm">
          {visibleConsumerItems.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group w-full text-left">
                <div className="w-9 h-9 rounded-xl bg-[#189D91]/8 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#189D91]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#189D91] transition-colors leading-tight">{item.title}</p>
                    {item.badge && (
                      <span className="inline-flex items-center gap-1 shrink-0 whitespace-nowrap px-2 py-0.5 bg-[#189D91] text-white text-[9px] font-black rounded-md uppercase tracking-wider leading-none">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 leading-normal">{item.subtitle}</p>
                </div>
                <FiChevronRight size={14} className="text-gray-300 group-hover:text-[#189D91] transition-colors shrink-0" />
              </div>
            );

            return item.link ? (
              <Link key={i} to={item.link}>{inner}</Link>
            ) : (
              <button key={i} className="w-full" onClick={() => {
                const el = document.getElementById(item.scrollTarget);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>{inner}</button>
            );
          })}
        </div>

        {/* Wallet Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#189D91]/10 flex items-center justify-center text-[#189D91] shrink-0">
                <FiCreditCard size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#189D91] uppercase tracking-widest">Riddha Wallet</p>
                <h3 className="text-lg font-black text-slate-800">
                  {walletBalance === null ? '...' : `₹${walletBalance.toLocaleString('en-IN')}`}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  Refunds from cancelled orders land here — use it at checkout on your next order.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-[#189D91] uppercase tracking-widest">Referral Programme</p>
              <h3 className="text-sm font-black text-slate-800">Refer a friend, earn ₹100</h3>
              <p className="text-[10px] text-gray-400 font-medium">Your friend gets ₹50 off their first order</p>
              {(user.referralCount || 0) > 0 && (
                <p className="text-[10px] font-bold text-[#189D91] pt-1">
                  {user.referralCount} {user.referralCount === 1 ? 'friend' : 'friends'} referred
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-4 py-2 bg-gray-50 rounded-xl border border-dashed border-[#189D91]/30 font-black text-slate-800 tracking-widest text-sm">
                {user.referralCode || 'PENDING'}
              </div>
              <button
                onClick={copyReferralCode}
                className="h-10 w-10 bg-[#189D91] hover:bg-[#14847a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm"
              >
                {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Support Links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <p className="px-4 py-2.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">Support & Legal</p>
          {supportLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                to={item.link}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
              >
                <Icon size={14} className="text-gray-400 shrink-0" />
                <span className="flex-1 text-xs font-semibold text-slate-600 group-hover:text-[#189D91] transition-colors">{item.title}</span>
                <FiChevronRight size={13} className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 bg-white text-red-500 hover:bg-red-50 transition-all text-xs font-bold"
        >
          <FiLogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Consumer Wishlist */}
      <WishlistSection isEmbedded={false} />

      {/* B2C Subscription Modal */}
      <B2CSubscriptionModal
        isOpen={isB2CModalOpen}
        onClose={() => setIsB2CModalOpen(false)}
      />
    </motion.div>
  );
};

const WishlistSection = ({ isEmbedded = false }) => {
  const { wishlistItems } = useWishlist();

  return (
    <div id="wishlist-section" className={isEmbedded ? "space-y-4" : "max-w-3xl mx-auto px-4 md:px-8 mt-4 scroll-mt-20"}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saved Materials & Items</p>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{wishlistItems.length} items</span>
      </div>

      {wishlistItems.length > 0 ? (
        <div className={`grid grid-cols-2 ${isEmbedded ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-4`}>
          {wishlistItems.map((product, index) => (
            <ProductCard key={product._id || product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-12 text-center space-y-3">
          <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
            <FiHeart className="text-gray-300" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">No saved items yet</p>
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">Browse products and tap the heart icon to bookmark</p>
          </div>
          <Link to="/shop" className="inline-block text-xs font-bold text-[#189D91] hover:underline">
            Explore Catalog
          </Link>
        </div>
      )}
    </div>
  );
};

export default Profile;
