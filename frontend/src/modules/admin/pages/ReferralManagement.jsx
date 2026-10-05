import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import StatCard from '../components/StatCard';
import { FiGift, FiUsers, FiSettings, FiCheck, FiX, FiActivity, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LuTrendingUp, LuIndianRupee } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ReferralManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEnabled, setIsEnabled] = useState(true);
  const [referralSettings, setReferralSettings] = useState({
    referrerReward: 100,
    newUserReward: 50
  });

  const [statsData, setStatsData] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalRewardsGiven: 0
  });

  const [referralUsers, setReferralUsers] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStatsAndSettings = async () => {
    try {
      const statsRes = await api.get('/referrals/admin/stats');
      if (statsRes.data.success) {
        setStatsData(statsRes.data.data);
      }
      const settingsRes = await api.get('/referrals/admin/settings');
      if (settingsRes.data.success) {
        setReferralSettings({
          referrerReward: settingsRes.data.data.referrerReward,
          newUserReward: settingsRes.data.data.newUserReward
        });
        setIsEnabled(settingsRes.data.data.isEnabled);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load referral statistics');
    }
  };

  const fetchReferralLogs = async (p = 1) => {
    try {
      setLogsLoading(true);
      const { data } = await api.get(`/referrals/admin/logs?page=${p}&limit=10`);
      if (data.success) {
        setReferralUsers(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setPage(data.pagination.page || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load referral logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndSettings();
    fetchReferralLogs(1);
  }, []);

  const handleSaveSettings = async () => {
    try {
      const { data } = await api.put('/referrals/admin/settings', {
        isEnabled,
        referrerReward: Number(referralSettings.referrerReward),
        newUserReward: Number(referralSettings.newUserReward)
      });
      if (data.success) {
        toast.success('Settings saved successfully!');
        setReferralSettings({
          referrerReward: data.data.referrerReward,
          newUserReward: data.data.newUserReward
        });
        setIsEnabled(data.data.isEnabled);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  const handleToggle = async (val) => {
    setIsEnabled(val);
    try {
      await api.put('/referrals/admin/settings', { isEnabled: val });
      toast.success(`Referral Engine ${val ? 'Activated' : 'Deactivated'}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update engine status');
      setIsEnabled(!val);
    }
  };

  const stats = [
    { label: 'Total Referrals', value: statsData.totalReferrals.toString(), icon: FiUsers, color: 'bg-[var(--color-primary)]' },
    { label: 'Successful Referrals', value: statsData.successfulReferrals.toString(), icon: FiCheck, color: 'bg-[var(--color-accent-pink)]' },
    { label: 'Total Rewards Given', value: `₹${statsData.totalRewardsGiven.toLocaleString('en-IN')}`, icon: LuIndianRupee, color: 'bg-emerald-600' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LuTrendingUp },
    { id: 'users', label: 'Referral Users', icon: FiUsers },
    { id: 'settings', label: 'Reward Settings', icon: FiSettings },
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FiGift className="text-[var(--color-primary)]" size={20} /> Referral System
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure client viral onboarding rewards</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
             <div className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/55' : 'bg-rose-50 text-rose-600 border border-rose-100/55'}`}>
               Engine {isEnabled ? 'Active' : 'Disabled'}
             </div>
             <button 
               onClick={() => handleToggle(!isEnabled)}
               className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${isEnabled ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
             >
                 <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-sm ${isEnabled ? 'right-0.5' : 'left-0.5'}`} />
             </button>
          </div>
        </div>

        {/* Navigation Tabs (Compact Pill Bar) */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30' : 'text-slate-400 hover:text-slate-600'}`}
             >
                 <tab.icon size={14} />
                 {tab.label}
             </button>
           ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
           {activeTab === 'dashboard' && (
             <motion.div
               key="dashboard"
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -12 }}
               className="space-y-5"
             >
                 {/* Stats cards in grid */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                      <StatCard key={i} {...stat} />
                    ))}
                 </div>

                 {/* Dashboard layout */}
                 <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
                    {/* Left Side: Referral Pulse */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
                       <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                          <div>
                             <h3 className="text-xs font-bold flex items-center gap-2 text-slate-800">
                                <FiActivity className="text-[var(--color-primary)]" /> Referral Activity Stream
                             </h3>
                             <p className="text-[9px] text-[var(--color-primary)] font-bold tracking-wider uppercase mt-0.5">Recent conversions</p>
                          </div>
                       </div>
                       
                       <div className="divide-y divide-slate-100">
                          {logsLoading ? (
                            <div className="py-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading Activity Stream...</div>
                          ) : referralUsers.length > 0 ? (
                            referralUsers.slice(0, 5).map((log) => (
                              <div key={log._id} className="flex gap-3 py-3 items-start group first:pt-0 last:pb-0">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 shadow-[0_0_6px_rgba(24,157,145,0.4)] group-hover:scale-125 transition-transform" />
                                <div className="flex-1 text-left">
                                  <p className="text-xs font-semibold text-slate-600">
                                    <span className="text-slate-850 font-bold">{log.referredUser?.fullName || 'User'}</span> joined using code <span className="font-bold text-[var(--color-accent-pink)]">{log.referrer?.referralCode || 'N/A'}</span> (referred by {log.referrer?.fullName || 'User'})
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="text-[var(--color-primary)]">Status: {log.rewardStatus}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span>{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-xs text-slate-400 font-medium italic">No recent referral log records.</div>
                          )}
                       </div>
                    </div>

                    {/* Right Side Strategy Recommendation */}
                    <div className="bg-gradient-to-br from-teal-50/50 to-pink-50/50 rounded-xl p-5 text-slate-800 border border-slate-200/60 relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[220px]">
                       <div className="relative z-10 text-left">
                         <div className="inline-flex items-center gap-1.5 bg-white/80 text-[var(--color-primary)] px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border border-teal-200/20 backdrop-blur-sm mb-3">
                           <FiGift size={13} /> Strategy Recommendation
                         </div>
                         <h3 className="text-base font-bold text-slate-800 leading-snug">
                           Referral marketing drives organic viral loops.
                         </h3>
                         <p className="mt-2 text-slate-500 text-[10px] font-semibold leading-relaxed">
                           Keep rewards competitive. Issuing signup coupons boosts first-time purchase conversions, while reward payouts encourage customer loyalty.
                         </p>
                       </div>
                       
                       <button 
                         onClick={() => setActiveTab('settings')}
                         className="relative z-10 mt-4 bg-[var(--color-primary)] text-white hover:opacity-90 font-bold text-[9px] uppercase tracking-wider py-2 px-4 rounded-lg w-full transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                       >
                         Configure Reward Settings <FiArrowRight />
                       </button>
                    </div>
                 </div>
             </motion.div>
           )}

           {activeTab === 'users' && (
             <motion.div
               key="users"
               initial={{ opacity: 0, x: 12 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -12 }}
               className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden"
             >
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50/30 border-b border-slate-150">
                           <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">User Name</th>
                           <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Referral Code Used</th>
                           <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Referred By</th>
                           <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                           <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Joined Date</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {logsLoading ? (
                           <tr>
                             <td colSpan="5" className="px-4 py-8 text-center text-xs text-slate-450 font-bold animate-pulse">Loading referral logs...</td>
                           </tr>
                         ) : referralUsers.length > 0 ? (
                           referralUsers.map((user) => (
                             <tr key={user._id} className="hover:bg-slate-50/20 transition-colors">
                               <td className="px-4 py-2.5 font-bold text-slate-700 text-xs">{user.referredUser?.fullName || 'Deleted User'}</td>
                               <td className="px-4 py-2.5 font-bold text-[var(--color-accent-pink)] tracking-wider text-xs uppercase">{user.referrer?.referralCode || 'N/A'}</td>
                               <td className="px-4 py-2.5 font-semibold text-slate-500 text-xs">{user.referrer?.fullName || 'Deleted User'}</td>
                               <td className="px-4 py-2.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${user.rewardStatus === 'rewarded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : user.rewardStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100/50' : 'bg-red-50 text-red-650 border-red-100/50'}`}>
                                    {user.rewardStatus}
                                  </span>
                               </td>
                               <td className="px-4 py-2.5 font-bold text-slate-400 text-[10px]">
                                 {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                               </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                             <td colSpan="5" className="px-4 py-8 text-center text-xs text-slate-400 italic">No referrals matched your search.</td>
                           </tr>
                         )}
                       </tbody>
                   </table>
                 </div>

                 {/* Pagination Controls */}
                 {totalPages > 1 && (
                   <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                     <button
                       disabled={page <= 1}
                       onClick={() => fetchReferralLogs(page - 1)}
                       className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-55 transition-colors"
                     >
                       <FiChevronLeft />
                     </button>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
                     <button
                       disabled={page >= totalPages}
                       onClick={() => fetchReferralLogs(page + 1)}
                       className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-55 transition-colors"
                     >
                       <FiChevronRight />
                     </button>
                   </div>
                 )}
              </motion.div>
           )}

           {activeTab === 'settings' && (
             <motion.div
               key="settings"
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -12 }}
               className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-5 text-left"
             >
                 {/* Reward Configuration Left Box */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                       <div className="h-9 w-9 bg-teal-50 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
                         <LuIndianRupee size={18} />
                       </div>
                       <div>
                         <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Reward Settings</h3>
                         <p className="text-[9px] text-[var(--color-primary)] font-bold uppercase tracking-wider">Set payouts for user cycles</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Referrer Bonus (₹)</label>
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-xs">₹</span>
                             <input 
                               type="number" 
                               value={referralSettings.referrerReward}
                               onChange={(e) => setReferralSettings({...referralSettings, referrerReward: e.target.value})}
                               className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] text-xs font-bold text-slate-800 transition-all" 
                             />
                          </div>
                          <p className="text-[8px] text-slate-400 italic text-left">Given once referred user settles their initial purchase.</p>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Invited User Bonus (₹)</label>
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-xs">₹</span>
                             <input 
                               type="number" 
                               value={referralSettings.newUserReward}
                               onChange={(e) => setReferralSettings({...referralSettings, newUserReward: e.target.value})}
                               className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] text-xs font-bold text-slate-800 transition-all" 
                             />
                          </div>
                          <p className="text-[8px] text-slate-400 italic text-left">Disbursed as onboarding checkout coupons.</p>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                       <button 
                         onClick={handleSaveSettings}
                         className="bg-[var(--color-primary)] hover:opacity-90 text-white px-6 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
                       >
                         Apply Changes
                       </button>
                    </div>
                 </div>

                 {/* Right Side: Status Details */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-6">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-50">Logistics Settings</h4>
                    <div className="p-3.5 rounded-lg border border-dashed border-slate-200 space-y-2 text-left">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Referral Core API</span>
                          <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                       </div>
                       <p className="text-[9px] text-slate-400 leading-normal font-medium">
                         Halting coordinates disables front-facing client interfaces immediately.
                       </p>
                    </div>
                 </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default ReferralManagement;
