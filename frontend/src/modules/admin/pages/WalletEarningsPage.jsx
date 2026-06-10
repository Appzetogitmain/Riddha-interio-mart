import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  LuTrendingUp, 
  LuWallet, 
  LuCircleDollarSign, 
  LuClock, 
  LuRefreshCw
} from 'react-icons/lu';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const WalletEarningsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('This Month');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/wallets/admin/analytics?range=${encodeURIComponent(range)}`);
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet analytics:', err);
      toast.error('Failed to load financial analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const sellers = analyticsData?.sellers || {};
  const delivery = analyticsData?.delivery || {};
  const platform = analyticsData?.platform || {};

  const stats = [
    { 
      label: 'Total Platform Earnings (All Time)', 
      value: `₹${(sellers.totalEarnings || 0).toLocaleString()}`, 
      icon: LuTrendingUp, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Seller Withdrawable Balance', 
      value: `₹${(sellers.totalWithdrawable || 0).toLocaleString()}`, 
      icon: LuWallet, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Platform Commission (Gross)', 
      value: `₹${(platform.totalCommissions || 0).toLocaleString()}`, 
      icon: LuCircleDollarSign, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Seller Pending Payouts', 
      value: `₹${(sellers.totalPending || 0).toLocaleString()}`, 
      icon: LuClock, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Delivery Earnings Balance', 
      value: `₹${(delivery.totalDeliveryEarnings || 0).toLocaleString()}`, 
      icon: LuClock, 
      color: 'text-red-500', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Pending from Delivery Boys (COD)', 
      value: `₹${(delivery.totalCodLiabilities || 0).toLocaleString()}`, 
      icon: LuClock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-100/50' 
    },
  ];

  const topSellers = analyticsData?.insights?.topSellers || [];
  const chartData = analyticsData?.insights?.chartData || [];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
              Admin Wallet &amp; Finance
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Platform-wide financial overview — earnings, commissions, and liabilities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border border-soft-oatmeal text-deep-espresso px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-white cursor-pointer focus:outline-none hover:bg-soft-oatmeal/20 transition-all"
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="p-2.5 border border-soft-oatmeal rounded-xl text-warm-sand hover:bg-soft-oatmeal/20 transition-all"
            >
              <LuRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{stat.label}</p>
                <h4 className={`text-2xl font-black text-deep-espresso ${loading ? 'opacity-40 animate-pulse' : ''}`}>
                  {loading ? '₹—' : stat.value}
                </h4>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Sellers Leaderboard */}
        {topSellers.length > 0 && (
          <div className="bg-white rounded-3xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="p-6 border-b border-soft-oatmeal">
              <h3 className="text-base font-bold text-deep-espresso">Top Performing Sellers</h3>
              <p className="text-xs text-warm-sand font-medium mt-0.5">Highest revenue generators for the selected period</p>
            </div>
            <div className="divide-y divide-soft-oatmeal/40">
              {topSellers.map((seller, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-soft-oatmeal/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-lg bg-soft-oatmeal/30 flex items-center justify-center text-xs font-black text-warm-sand">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-deep-espresso text-sm">{seller.name}</p>
                      <p className="text-[10px] text-warm-sand font-semibold">{seller.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-deep-espresso">{seller.sales}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{seller.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Stats from Backend */}
        {analyticsData?.insights?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analyticsData.insights.stats.map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-soft-oatmeal shadow-sm">
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider mb-1">{s.label}</p>
                <h4 className="text-xl font-black text-deep-espresso">{s.value}</h4>
                <p className={`text-[10px] font-bold mt-1 ${s.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.change} vs prev period
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !analyticsData && (
          <div className="bg-white rounded-2xl border border-soft-oatmeal p-10 text-center">
            <p className="text-warm-sand font-bold text-sm">No financial data available yet.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default WalletEarningsPage;
