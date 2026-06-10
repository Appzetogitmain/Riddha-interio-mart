import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiCopy, FiCheck, FiArrowLeft, FiClock, FiDollarSign, FiUserPlus, FiSend, FiUserCheck, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ReferralRewardsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState({
    analytics: null,
    history: [],
    wallet: null,
    loading: true,
  });

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const [analyticsRes, historyRes, walletRes] = await Promise.all([
          api.get('/referrals/analytics'),
          api.get('/referrals/history'),
          api.get('/referrals/wallet')
        ]);

        setData({
          analytics: analyticsRes.data.data,
          history: historyRes.data.data,
          wallet: walletRes.data.data,
          loading: false
        });
      } catch (err) {
        console.error('Failed to load referral data', err);
        toast.error('Failed to load referral data.');
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchReferralData();
  }, []);

  const copyCode = () => {
    if (!data.analytics?.referralCode) return;
    navigator.clipboard.writeText(data.analytics.referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#189D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Rewards...</p>
        </div>
      </div>
    );
  }

  const {
    totalEarned = 0,
    successfulReferred = 0,
    pendingReferred = 0,
    referralCode = 'PENDING',
    config = { referrerReward: 100, newUserReward: 50 }
  } = data.analytics || {};

  const availableBalance = data.wallet?.balance || 0;

  const referralStats = [
    { label: 'Total Earned', value: `₹${totalEarned.toLocaleString()}`, icon: FiDollarSign, color: 'text-[#189D91]', bg: 'bg-[#189D91]/10' },
    { label: 'Friends Referred', value: successfulReferred, icon: FiUserPlus, color: 'text-[#702D8B]', bg: 'bg-[#702D8B]/10' },
    { label: 'Pending Invitations', value: pendingReferred, icon: FiClock, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50/30 pb-32 px-4 md:px-12 pt-4 md:pt-10"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#189D91] transition-all group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Profile
            </button>
            <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight">Referral Rewards</h1>
            <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">Share the joy of luxury living</p>
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
             <div className="h-14 w-14 bg-[#189D91]/10 rounded-2xl flex items-center justify-center">
               <FiDollarSign className="text-[#189D91] h-7 w-7" />
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance</p>
               <h2 className="text-2xl font-black text-black">₹{availableBalance.toLocaleString()}</h2>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {referralStats.map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500"
            >
               <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-6`}>
                 <stat.icon size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
               <h3 className="text-2xl font-black text-black">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-12">
          {/* Main Referral Content */}
          <div className="space-y-12">
            <div className="bg-gradient-to-br from-[#004D40] to-[#189D91] p-8 md:p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                    <FiGift className="text-yellow-400" /> Professional Rewards
                 </div>
                 <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                   Invite Friends & <br />
                   <span className="text-white italic font-serif">Earn ₹{config.referrerReward} Credits</span>
                 </h2>
                 <p className="text-white/70 text-sm md:text-lg font-medium leading-relaxed max-w-lg">
                   When your friend signs up with your referral code and places their first order, you get ₹{config.referrerReward} and they get ₹{config.newUserReward} off instantly!
                 </p>
                 
                 <div className="pt-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-5 rounded-2xl font-black text-2xl tracking-[0.2em] text-white shadow-inner">
                      {referralCode}
                    </div>
                    <button 
                      onClick={copyCode}
                      className="bg-white text-[#004D40] px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 flex items-center gap-3 shadow-2xl"
                    >
                      {copied ? <FiCheck /> : <FiCopy />} {copied ? 'COPIED' : 'COPY CODE'}
                    </button>
                 </div>
              </div>
              
              {/* Abstract Design Elements */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-black uppercase tracking-widest">Referral History</h3>
               <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                         <tr className="bg-gray-50/50 border-b border-gray-100">
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Friend</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Reward</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {data.history.length === 0 ? (
                           <tr>
                             <td colSpan="4" className="px-8 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                               No referrals yet
                             </td>
                           </tr>
                         ) : (
                           data.history.map((item) => (
                             <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-8 py-6 font-bold text-black text-sm">{item.referredUser?.fullName || 'Anonymous'}</td>
                               <td className="px-8 py-6 text-gray-400 text-xs font-medium">
                                 {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.rewardStatus === 'rewarded' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    {item.rewardStatus === 'rewarded' ? 'Completed' : 'Pending'}
                                  </span>
                               </td>
                               <td className="px-8 py-6 font-black text-black">₹{item.referrerReward}</td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#189D91]">How it works</h4>
                <div className="space-y-12">
                   {[
                     { icon: FiSend, title: 'Share Your Code', desc: 'Send your unique referral code to your friends and family.' },
                     { icon: FiUserCheck, title: 'They Sign Up', desc: 'Ensure they enter your code during their registration process.' },
                     { icon: FiCreditCard, title: 'Earn Rewards', desc: `Get ₹${config.referrerReward} added to your rewards wallet after their first order.` }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-6 relative">
                        {i < 2 && <div className="absolute left-6 top-12 bottom-[-48px] w-0.5 bg-gray-100"></div>}
                        <div className="shrink-0 h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#189D91] border border-gray-100 shadow-sm z-10">
                           <item.icon size={20} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-sm font-black text-black uppercase tracking-wide">{item.title}</p>
                           <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-[#189D91] p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden shadow-xl">
                <div className="relative z-10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Need Help?</h4>
                  <p className="text-sm text-white/90 font-medium leading-relaxed">
                     Our support team is here to help you maximize your rewards.
                  </p>
                  <button
                    onClick={() => navigate('/contact')}
                    className="bg-white text-[#189D91] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg"
                  >
                    Contact Support
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferralRewardsPage;
