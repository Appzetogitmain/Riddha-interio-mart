import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { 
  LuPackage, 
  LuClock, 
  LuCheck, 
  LuTrendingUp, 
  LuWallet, 
  LuPercent, 
  LuZap, 
  LuNavigation, 
  LuUsers, 
  LuTriangleAlert,
  LuMapPin,
  LuArrowRight,
  LuLayoutGrid,
  LuActivity,
  LuSearch,
  LuFilter,
  LuTruck
} from 'react-icons/lu';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../../shared/utils/api';
import { useUser } from '../../user/data/UserContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeShiftTime, setActiveShiftTime] = useState('Offline');
  const [deliveryCommissionRate, setDeliveryCommissionRate] = useState(50.00);

  // Modal State for Cash Deposit Request
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReference, setDepositReference] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositPending, setDepositPending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const [analytics, setAnalytics] = useState({
    stats: {
      totalAssigned: 0,
      completedDeliveries: 0,
      pendingDeliveries: 0,
      rejectedDeliveries: 0
    },
    earnings: {
      totalEarnings: 0,
      codToDeposit: 0
    },
    performance: {
      successRate: 0,
      avgDeliveryTimeHours: 0
    },
    charts: {
      performanceData: [],
      revenueData: []
    },
    recentDeliveries: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: profileData } = await api.get('/delivery/me');
      if (profileData.success) {
        setUser(prev => ({ ...prev, ...profileData.data }));
      }
      const { data: analyticsData } = await api.get('/delivery/analytics');
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
      const { data: settingsRes } = await api.get('/settings');
      if (settingsRes.success && settingsRes.data) {
        setDeliveryCommissionRate(settingsRes.data.deliveryCommissionRate || 50.00);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (earnings.codToDeposit === 0) setDepositPending(false);
  }, [earnings.codToDeposit]);

  // Tick-by-tick shift timer tracking
  useEffect(() => {
    let intervalId;
    if (user?.status === 'Available' && user?.lastOnlineTime) {
      const updateTimer = () => {
        const diffMs = Date.now() - new Date(user.lastOnlineTime).getTime();
        if (diffMs <= 0) {
          setActiveShiftTime('00h 00m 00s');
          return;
        }
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        const pad = (num) => String(num).padStart(2, '0');
        setActiveShiftTime(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setActiveShiftTime('Offline');
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.status, user?.lastOnlineTime]);

  const toggleStatus = async () => {
    if (user?.approvalStatus !== 'Approved') return;
    setUpdating(true);
    try {
      const nextStatus = user?.status === 'Available' ? 'Offline' : 'Available';
      const { data } = await api.put('/delivery/status', { status: nextStatus });
      if (data.success) {
        setUser(prev => ({ 
          ...prev, 
          status: data.data.status, 
          lastOnlineTime: data.data.lastOnlineTime 
        }));
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    
    setSubmittingDeposit(true);
    try {
      const response = await api.post('/wallets/delivery/deposit-request', {
        amount: Number(depositAmount),
        transactionReference: depositReference,
        notes: depositNotes
      });
      if (response.data.success) {
        setDepositSuccess(true);
        setDepositPending(true);
        fetchDashboardData();
        setTimeout(() => {
          setShowDepositModal(false);
          setDepositSuccess(false);
          setDepositAmount('');
          setDepositReference('');
          setDepositNotes('');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit deposit request:', err);
      alert(err.response?.data?.error || 'Failed to submit deposit request. Please try again.');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const { stats, earnings, performance, recentDeliveries, charts } = analytics;

  const statusOptions = ['All', 'Delivered', 'Processing', 'Accepted', 'Rejected'];
  const filteredDeliveries = recentDeliveries.filter(order => {
    const matchesSearch = !searchQuery ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const performanceData = charts?.performanceData || [];
  const revenueData = charts?.revenueData || [];

  return (
    <PageWrapper>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-8">
        
        {/* Hero & Operations Command */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-[#2A458A] rounded-full"></div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Delivery Dashboard
                 </h1>
              </div>
              <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
                 <LuActivity className="text-[#2A458A]" />
                 Overview of your delivery performance and earnings
              </p>
           </div>

           <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white border border-slate-100 p-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <LuClock size={14} className="text-[#189D91]" />
                    <span className="text-xs font-semibold text-slate-600">Active Shift: {activeShiftTime}</span>
                 </div>
                 <button 
                   onClick={toggleStatus}
                   disabled={updating}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                     user?.status === 'Available' 
                       ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                       : 'bg-slate-50 text-slate-500 border-slate-200'
                   }`}
                 >
                    <div className={`w-1.5 h-1.5 rounded-full ${user?.status === 'Available' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                       {user?.status === 'Available' ? 'Online' : 'Offline'}
                    </span>
                 </button>
              </div>
           </div>
        </div>

        {/* Premium KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
           {[
             { label: 'Total Orders', value: stats.totalAssigned, icon: LuPackage, trend: 'Lifetime', color: 'text-blue-600', bg: 'bg-blue-50', link: '/delivery/orders' },
             { label: 'Active Routes', value: stats.pendingDeliveries, icon: LuNavigation, trend: 'Active', color: 'text-amber-600', bg: 'bg-amber-50', link: '/delivery/orders?filter=available' },
             { label: 'Success Rate', value: `${performance.successRate}%`, icon: LuCheck, trend: 'Target > 95%', color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/delivery/delivery-history' },
             { label: 'Avg Delivery Time', value: `${performance.avgDeliveryTimeHours || 0} hrs`, icon: LuClock, trend: 'Target < 1.5h', color: 'text-[#2A458A]', bg: 'bg-[#2A458A]/10', link: '/delivery/delivery-history' },
             { label: 'Total Earnings', value: `₹${earnings.totalEarnings.toLocaleString()}`, icon: LuWallet, trend: 'Ledger Balance', color: 'text-slate-900', bg: 'bg-slate-100', link: '/delivery/earnings' },
             { label: 'Pending COD', value: `₹${earnings.codToDeposit.toLocaleString()}`, icon: LuTriangleAlert, trend: 'To Deposit', color: 'text-rose-600', bg: 'bg-rose-50', link: '/delivery/wallet' },
           ].map((card, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               onClick={() => navigate(card.link)}
               className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
             >
                 <div className="flex justify-between items-start mb-3">
                    <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                       <card.icon size={16} />
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${card.bg} ${card.color}`}>{card.trend}</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{card.label}</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{loading ? '---' : card.value}</p>
                 </div>
             </motion.div>
           ))}
        </div>

        {/* Live Operations & Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           
           {/* Performance Tracking Panel using Recharts */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="text-slate-900 font-bold text-base">Weekly Performance</h3>
                    <p className="text-slate-500 text-xs">Completed vs Rejected deliveries</p>
                 </div>
                 <LuActivity className="text-[#189D91]" size={20} />
              </div>

              <div className="flex-1 min-h-[160px]">
                 <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={performanceData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                       <Tooltip 
                         cursor={{ fill: '#f8fafc' }}
                         contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', padding: '8px' }}
                       />
                       <Bar dataKey="completed" name="Completed" fill="#189D91" radius={[4, 4, 0, 0]} barSize={12} />
                       <Bar dataKey="rejected" name="Rejected" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Analytics Widget */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="text-slate-900 font-bold text-base">Revenue Analytics</h3>
                    <p className="text-slate-500 text-xs">Daily earnings breakdown</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-semibold text-slate-500">Standard Delivery Pay</p>
                       <p className="text-sm font-bold text-slate-900">₹{deliveryCommissionRate.toFixed(2)} / Order</p>
                    </div>
                    <LuTrendingUp className="text-[#189D91]" size={20} />
                 </div>
              </div>

              <div className="flex-1 h-[160px]">
                 <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#189D91" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#189D91" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', padding: '8px' }}
                         itemStyle={{ color: '#189D91', fontWeight: 'bold' }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#189D91" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Table & Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           
           {/* Recent Missions Table */}
           <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-slate-900 font-bold text-base">Recent Deliveries</h3>
                 </div>
                 <div className="flex items-center gap-2 relative">
                    <button
                      onClick={() => { setShowSearch(v => !v); setSearchQuery(''); }}
                      className={`p-2 border rounded-lg transition-all shadow-sm ${showSearch ? 'bg-[#2A458A] border-[#2A458A] text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-[#2A458A] hover:border-[#2A458A]/30'}`}
                    ><LuSearch size={16} /></button>
                    <button
                      onClick={() => setShowFilterMenu(v => !v)}
                      className={`p-2 border rounded-lg transition-all shadow-sm ${statusFilter !== 'All' || showFilterMenu ? 'bg-[#2A458A] border-[#2A458A] text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-[#2A458A] hover:border-[#2A458A]/30'}`}
                    ><LuFilter size={16} /></button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[130px]">
                        {statusOptions.map(s => (
                          <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-[#2A458A]/10 text-[#2A458A]' : 'text-slate-700 hover:bg-slate-50'}`}
                          >{s}</button>
                        ))}
                      </div>
                    )}
                 </div>
              </div>

              {showSearch && (
              <div className="px-5 pb-3 border-b border-slate-100">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name or order ID..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A458A]/30 bg-slate-50"
                />
              </div>
           )}

           <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50 text-slate-500">
                          <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Order ID</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Customer</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Status</th>
                          <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Time</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {loading ? (
                          [...Array(3)].map((_, i) => (
                             <tr key={i} className="animate-pulse">
                                <td colSpan={4} className="px-5 py-4 h-12 bg-slate-50/30"></td>
                             </tr>
                          ))
                       ) : filteredDeliveries.length === 0 ? (
                          <tr>
                             <td colSpan={4} className="px-5 py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                   <LuActivity className="text-slate-200" size={32} />
                                   <p className="text-xs font-semibold text-slate-500">
                                     {recentDeliveries.length === 0 ? 'No Recent Deliveries' : 'No results found'}
                                   </p>
                                </div>
                             </td>
                          </tr>
                       ) : (
                          filteredDeliveries.slice(0, 10).map((order) => (
                             <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-5 py-3">
                                   <span className="text-xs font-bold text-slate-900">#{order.id}</span>
                                </td>
                                <td className="px-5 py-3">
                                   <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-md bg-teal-50 text-[#189D91] flex items-center justify-center font-bold text-[10px] border border-teal-100">
                                         {order.customerName.charAt(0)}
                                      </div>
                                      <span className="text-xs font-medium text-slate-700">{order.customerName}</span>
                                   </div>
                                </td>
                                <td className="px-5 py-3">
                                   <StatusBadge status={order.status} />
                                </td>
                                <td className="px-5 py-3">
                                   <p className="text-[10px] font-medium text-slate-500">
                                      {new Date(order.dateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Action Panels */}
           <div className="space-y-4">
              {/* Hub Deposit Action */}
              <div className="bg-[#189D91] rounded-2xl p-5 text-white shadow-lg shadow-[#189D91]/20 relative overflow-hidden group h-full flex flex-col justify-between">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                 
                 <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">Action Required</p>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Cash Deposit</h3>
                    <p className="text-white/80 text-xs font-medium mb-4">Cash collected requires deposit at hub</p>
                    
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 flex justify-between items-center mb-4">
                       <span className="text-xs font-medium text-white/90">Amount Due</span>
                       <span className="text-xl font-bold">₹{earnings.codToDeposit.toLocaleString()}</span>
                    </div>
                 </div>

                 <button
                   onClick={() => !depositPending && setShowDepositModal(true)}
                   disabled={earnings.codToDeposit <= 0 || depositPending}
                   className={`w-full relative z-10 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                     depositPending
                       ? 'bg-white/50 text-[#189D91]/70 cursor-not-allowed'
                       : 'bg-white text-[#189D91] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                   }`}
                 >
                   {depositPending ? 'Pending Approval...' : 'Pay Now'}
                 </button>
              </div>
           </div>
        </div>

        {/* Deposit Verification Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 max-w-md w-full shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-slate-900 font-bold text-lg">Log Cash Deposit</h3>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>

              {depositSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex flex-center items-center justify-center text-emerald-500 animate-bounce mx-auto">
                     <LuCheck size={24} />
                  </div>
                  <h4 className="text-slate-900 font-bold text-base">Request Submitted!</h4>
                  <p className="text-slate-500 text-xs px-4">Your deposit verification request has been successfully queued for Admin approval.</p>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2">
                  <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100">
                    <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider mb-0.5">Maximum Cash Due</p>
                    <p className="text-lg font-bold text-[#189D91]">₹{earnings.codToDeposit.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deposit Amount (₹)</label>
                    <input 
                      type="number" 
                      required
                      max={earnings.codToDeposit}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-[#189D91] focus:border-[#189D91] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Transaction ID / UPI Reference (UTR)</label>
                    <input 
                      type="text" 
                      required
                      value={depositReference}
                      onChange={(e) => setDepositReference(e.target.value)}
                      placeholder="e.g. UTR1293849"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-[#189D91] focus:border-[#189D91] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deposit Notes</label>
                    <textarea 
                      value={depositNotes}
                      onChange={(e) => setDepositNotes(e.target.value)}
                      placeholder="Mention payment channel (e.g., deposited to hub cashier, GPay)"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-[#189D91] focus:border-[#189D91] outline-none resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingDeposit || !depositAmount}
                    className="w-full bg-[#189D91] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#15877c] transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {submittingDeposit ? 'Submitting...' : 'Submit Deposit'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
