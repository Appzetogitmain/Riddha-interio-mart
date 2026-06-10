import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import StatCard from '../components/StatCard';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  Calendar,
  Wallet,
  ArrowUpRight,
  Filter,
  MoreVertical,
  Layers,
  ArrowRight,
  ShoppingCart,
  Plus,
  ShoppingBag,
  Users
} from 'lucide-react';
import api from '../../../shared/utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('monthly');
  const [analytics, setAnalytics] = useState({
    stats: {
      totalRevenue: 0,
      periodRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0
    },
    revenueTrends: [],
    topProducts: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [showChartOptions, setShowChartOptions] = useState(false);
  const navigate = useNavigate();

  const exportChartToExcel = async () => {
    setShowChartOptions(false);
    const dataToExport = (revenueTrends.length > 0 ? revenueTrends : [
      { date: '01 May', revenue: 4000 },
      { date: '05 May', revenue: 3000 },
      { date: '10 May', revenue: 5000 },
      { date: '15 May', revenue: 4500 },
      { date: '20 May', revenue: 6500 },
      { date: '25 May', revenue: 5500 },
      { date: '30 May', revenue: 8000 },
    ]).map(item => ({
      'Date Period': item.date,
      'Revenue Amount (₹)': item.revenue
    }));

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Revenue Trends");
      XLSX.writeFile(wb, `Revenue_Analytics_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success("Revenue report exported successfully!");
    } catch (err) {
      console.error('Failed to export chart:', err);
      toast.error('Failed to export chart data.');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/seller/analytics?timeRange=${timeRange}`);
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const { stats, revenueTrends, topProducts, lowStockProducts } = analytics;

  // Pie chart data for order status
  const orderStatusData = [
    { name: 'Completed', value: stats.completedOrders || 0, color: '#10B981' },
    { name: 'Pending', value: stats.pendingOrders || 0, color: '#F59E0B' },
    { name: 'Cancelled', value: (stats.totalOrders - stats.completedOrders - stats.pendingOrders) || 0, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // If no data, show dummy for visualization
  const pieData = orderStatusData.length > 0 ? orderStatusData : [
    { name: 'Completed', value: 65, color: '#10B981' },
    { name: 'Pending', value: 25, color: '#F59E0B' },
    { name: 'Cancelled', value: 10, color: '#EF4444' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        
        {/* Mobile Quick Command Center (Visible only on mobile) */}
        <div className="lg:hidden space-y-4">
           {/* Strategic Health Check - Professional White Card */}
           <div className="bg-white rounded-[2rem] p-5 border border-slate-100 relative overflow-hidden shadow-2xl shadow-slate-200/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-seller-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 flex items-center justify-between">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-seller-primary" />
                       <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Operational Health</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Your store is <span className="text-seller-primary font-semibold">94% optimized</span></h3>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest leading-relaxed">Deploy 3 more listings to reach Elite Tier</p>
                 </div>
                 <div className="w-10 h-10 bg-seller-primary/10 rounded-xl flex items-center justify-center text-seller-primary border border-seller-primary/10">
                    <TrendingUp size={18} />
                 </div>
              </div>
           </div>

           {/* Quick Actions Grid */}
           <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Add', icon: Plus, path: '/seller/add-product', color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Orders', icon: ShoppingBag, path: '/seller/orders', color: 'bg-blue-50 text-blue-600' },
                { label: 'Payout', icon: Wallet, path: '/seller/wallet', color: 'bg-amber-50 text-amber-600' },
                { label: 'Network', icon: Users, path: '/seller/customers', color: 'bg-indigo-50 text-indigo-600' },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-1.5"
                >
                   <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center shadow-sm active:scale-90 transition-all`}>
                      <action.icon size={20} />
                   </div>
                   <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Dashboard Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Merchant Intelligence</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest opacity-60">Real-time business monitoring</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all ${timeRange === range ? 'bg-seller-primary text-white shadow-md' : 'text-slate-400 hover:text-seller-primary'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-seller-primary transition-colors shadow-sm">
              <Filter size={16} />
            </button>
            
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-widest">Operational</span>
            </div>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Revenue" 
            value={`₹${stats.totalRevenue.toLocaleString()}`} 
            icon={Wallet} 
            trend={12.5}
          />
          <StatCard 
            label="Total Orders" 
            value={stats.totalOrders} 
            icon={ShoppingCart} 
            trend={8.2}
          />
          <StatCard 
            label="Pending Fulfillment" 
            value={stats.pendingOrders} 
            icon={Clock} 
            trend={-2.4}
          />
          <StatCard 
            label="Wallet Balance" 
            value={`₹${(stats.walletBalance || 0).toLocaleString()}`} 
            icon={Layers} 
            trend={5.1}
          />
        </div>

        {/* Analytics Section - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Revenue Analytics</h3>
                <p className="text-sm text-slate-500">Daily performance trends</p>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowChartOptions(!showChartOptions); }}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {showChartOptions && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowChartOptions(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 p-1.5"
                      >
                        <button
                          onClick={() => {
                            setShowChartOptions(false);
                            fetchAnalytics();
                            toast.success("Analytics data refreshed!");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          Refresh Insights
                        </button>
                        <button
                          onClick={exportChartToExcel}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          Export Chart Data
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center space-y-4 flex-col">
                  <div className="w-10 h-10 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Generating Insights...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={revenueTrends.length > 0 ? revenueTrends : [
                    { date: '01 May', revenue: 4000 },
                    { date: '05 May', revenue: 3000 },
                    { date: '10 May', revenue: 5000 },
                    { date: '15 May', revenue: 4500 },
                    { date: '20 May', revenue: 6500 },
                    { date: '25 May', revenue: 5500 },
                    { date: '30 May', revenue: 8000 },
                  ]}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D63384" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#D63384" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', padding: '16px' }}
                      itemStyle={{ color: '#D63384', fontWeight: 'bold', fontSize: '14px' }}
                      labelStyle={{ color: '#64748B', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#D63384" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Order Status Donut */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Order Status</h3>
            <p className="text-sm text-slate-500 mb-8">Distribution of fulfillment</p>
            
            <div className="h-[250px] w-full relative mb-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-semibold text-slate-900">{stats.totalOrders}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Selling Products */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Top Selling Products</h3>
                  <p className="text-sm text-slate-500">Based on recent sales volume</p>
                </div>
                <button 
                  onClick={() => navigate('/seller/reports/sales')}
                  className="text-sm font-semibold text-seller-primary hover:underline flex items-center gap-1 group cursor-pointer"
                >
                  View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Sold</th>
                      <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProducts.length > 0 ? topProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Fashion & Style</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="text-sm font-semibold text-slate-700">{product.totalQuantity}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className="text-sm font-semibold text-slate-900">₹{product.totalRevenue.toLocaleString()}</p>
                        </td>
                      </tr>
                    )) : [1,2,3].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td className="px-8 py-4 flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 rounded-xl"></div><div className="space-y-2"><div className="w-32 h-3 bg-slate-100 rounded"></div><div className="w-20 h-2 bg-slate-100 rounded"></div></div></td>
                         <td className="px-8 py-4"><div className="w-10 h-3 bg-slate-100 rounded mx-auto"></div></td>
                         <td className="px-8 py-4 text-right"><div className="w-16 h-3 bg-slate-100 rounded ml-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Inventory Alerts</h3>
              <p className="text-sm text-slate-500">Low stock notifications</p>
            </div>
            
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
              {lowStockProducts.length === 0 ? (
                 <div className="p-12 text-center flex flex-col items-center gap-4">
                   <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                     <CheckCircle2 size={32} />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-slate-900">All items in stock</p>
                      <p className="text-xs text-slate-500 mt-1">Your inventory looks healthy.</p>
                   </div>
                 </div>
              ) : lowStockProducts.map(product => (
                <div key={product._id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                       <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">{product.countInStock} Remaining</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-seller-primary hover:bg-seller-light/30 rounded-lg transition-colors">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))}
            </div>


            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => navigate('/seller/product/stock')}
                className="w-full py-4 rounded-2xl bg-seller-primary text-white font-semibold text-xs uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20"
              >
                Manage Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
