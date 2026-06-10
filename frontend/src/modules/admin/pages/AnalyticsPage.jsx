import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { 
  FiTrendingUp, 
  FiShoppingBag, 
  FiUsers, 
  FiDollarSign, 
  FiArrowUpRight, 
  FiArrowDownRight, 
  FiCalendar, 
  FiPieChart,
  FiActivity,
  FiZap
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../shared/utils/api';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('This Month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(`/wallets/admin/analytics?range=${timeRange}`);
        if (res.success) {
          setData(res.data.insights);
        }
      } catch (err) {
        console.error('Failed to retrieve analytics telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  const chartData = data?.chartData || [
    { day: 'Mon', current: 0, previous: 0 },
    { day: 'Tue', current: 0, previous: 0 },
    { day: 'Wed', current: 0, previous: 0 },
    { day: 'Thu', current: 0, previous: 0 },
    { day: 'Fri', current: 0, previous: 0 },
    { day: 'Sat', current: 0, previous: 0 },
    { day: 'Sun', current: 0, previous: 0 },
  ];

  // Live and Fallback Data for Frontend Display
  const stats = data?.stats || [
    { label: 'Total Revenue', value: '₹0', change: '+0.0%', isUp: true, icon: 'FiDollarSign' },
    { label: 'Total Orders', value: '0', change: '+0.0%', isUp: true, icon: 'FiShoppingBag' },
    { label: 'Profit Margin', value: '₹0', change: '+0.0%', isUp: true, icon: 'FiTrendingUp' },
    { label: 'Avg Order Value', value: '₹0', change: '+0.0%', isUp: true, icon: 'FiZap' }
  ];

  const topSellers = data?.topSellers || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#189D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing platform telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-gradient-to-l from-teal-50/10 to-transparent pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="bg-[#189D91]/10 text-[#189D91] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <FiActivity size={11} className="animate-pulse" /> Telemetry & Intelligence
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Performance Insights
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
              Real-time business intelligence and revenue metrics.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 w-fit shrink-0 relative z-10">
            {['Today', 'Last 7 Days', 'This Month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  timeRange === range 
                    ? 'bg-[#189D91] text-white shadow-sm shadow-teal-500/10' 
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, idx) => {
            const Icon = FiIcons[stat.icon] || FiIcons.FiDollarSign;
            const isUp = stat.isUp;
            const brandBg = idx === 0 || idx === 2 ? 'bg-teal-50 text-[#189D91] border-teal-100/50' : 'bg-pink-50 text-[#EC008C] border-pink-100/50';
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-[#189D91]/40 hover:shadow-md transition-all group flex flex-col justify-between min-h-[135px]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${brandBg} border flex items-center justify-center text-lg transition-transform group-hover:scale-105`}>
                    <Icon size={18} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    isUp 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {isUp ? <FiArrowUpRight size={10} /> : <FiArrowDownRight size={10} />}
                    {stat.change}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Core Charts & Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Chart Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                  <FiTrendingUp className="text-[#189D91]" /> Revenue Growth
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Daily sales performance analysis</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#189D91]" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#EC008C]" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">Previous</span>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsColorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#189D91" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#189D91" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="analyticsColorPrevious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC008C" stopOpacity={0.10}/>
                      <stop offset="95%" stopColor="#EC008C" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                    cursor={{ stroke: '#189D91', strokeWidth: 1.5 }}
                  />
                  <Area type="monotone" dataKey="previous" stroke="#EC008C" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsColorPrevious)" />
                  <Area type="monotone" dataKey="current" stroke="#189D91" strokeWidth={3.5} fillOpacity={1} fill="url(#analyticsColorCurrent)" activeDot={{ r: 6, strokeWidth: 0, fill: '#189D91' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Sellers Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/30 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            
            <div>
              <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 mb-1">
                <FiTrendingUp className="text-[#EC008C]" /> Top Performers
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-5">High-volume marketplace channels</p>
            </div>

            <div className="space-y-3.5 flex-1 justify-center flex flex-col">
              {topSellers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs font-semibold text-slate-400">No sales data yet.</p>
                </div>
              ) : (
                topSellers.map((seller, i) => {
                  const accentColor = i % 2 === 0 ? 'text-[#189D91] bg-teal-50 border-teal-100/50' : 'text-[#EC008C] bg-pink-50 border-pink-100/50';
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/60 rounded-xl border border-slate-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${accentColor} border flex items-center justify-center font-bold text-xs shrink-0`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-none">{seller.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{seller.orders} Orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800 leading-none">{seller.sales}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                          seller.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {seller.growth}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
