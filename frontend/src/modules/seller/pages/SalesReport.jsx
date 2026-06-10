import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag,
  Download,
  Calendar,
  Filter,
  ArrowRight,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Plus,
  Database,
  ArrowUp,
  FileText,
  Star
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
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
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const COLORS = ['#E36666', '#9333EA', '#4F46E5', '#F59E0B', '#10B981', '#F43F5E', '#3B82F6', '#14B8A6'];

const SalesReport = () => {
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState('sales');
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  const handleGenerateReport = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const trendExport = chartData.map(item => ({
        'Date Period': item.name,
        'Sales Count': item.sales,
        'Revenue (₹)': item.revenue,
        'Units Sold': item.units
      }));
      const wsTrends = XLSX.utils.json_to_sheet(trendExport);
      XLSX.utils.book_append_sheet(wb, wsTrends, "Sales & Revenue Trends");

      if (bestSellers.length > 0) {
        const productExport = bestSellers.map(item => ({
          'Product Name': item.name,
          'Total Revenue': item.price,
          'Quantity Sold': item.rating
        }));
        const wsProducts = XLSX.utils.json_to_sheet(productExport);
        XLSX.utils.book_append_sheet(wb, wsProducts, "Best Sellers");
      }

      XLSX.writeFile(wb, `Seller_Ecosystem_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success("Ecosystem report generated successfully!");
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate data report.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/seller/analytics?timeRange=monthly');
        
        if (data.success && data.data) {
          const { revenueTrends, topProducts } = data.data;

          // Map revenue trends
          if (revenueTrends) {
            const mappedTrends = revenueTrends.map((t) => ({
              name: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              sales: t.orders,
              revenue: t.revenue,
              units: t.orders
            }));
            setChartData(mappedTrends.length > 0 ? mappedTrends : [
              { name: 'No Data', sales: 0, revenue: 0, units: 0 }
            ]);
          }

          // Map top products for pie chart (Revenue distribution)
          if (topProducts) {
            const mappedPie = topProducts.map((p, idx) => ({
              name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
              value: p.totalRevenue,
              color: COLORS[idx % COLORS.length]
            }));
            setPieData(mappedPie);

            // Map best sellers list
            const mappedBest = topProducts.map((p, idx) => ({
              id: p._id || idx,
              name: p.name,
              price: `₹${p.totalRevenue.toLocaleString()}`,
              rating: p.totalQuantity, // Display quantity instead of rating
              image: p.image || 'https://via.placeholder.com/150'
            }));
            setBestSellers(mappedBest);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sales report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto pb-20 space-y-6">
        
        {/* Professional White Analytics Header */}
        <div className="bg-white p-6 pb-12 rounded-b-[2.5rem] -mx-4 md:-mx-0 md:rounded-[2.5rem] md:mt-4 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-seller-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
           
           <div className="relative z-10 flex items-center justify-between mb-8">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                 <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight uppercase">Merchant <span className="text-seller-primary font-semibold">Analytics</span></h1>
              <div className="w-10" />
           </div>
           
           {/* Simple & Professional Action Bar */}
           <div 
              onClick={handleGenerateReport}
              className="relative z-10 bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 group-hover:border-seller-primary/30 transition-all cursor-pointer"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-seller-primary shadow-sm">
                    <FileText size={18} />
                 </div>
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900 leading-none">Generate data report</span>
                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Full ecosystem performance export</p>
                 </div>
              </div>
              <button 
                 onClick={(e) => { e.stopPropagation(); handleGenerateReport(); }}
                 className="w-10 h-10 rounded-full bg-seller-primary text-white flex items-center justify-center shadow-lg shadow-seller-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                 <Plus size={18} />
              </button>
           </div>
        </div>

        {/* Analytics Content */}
        <div className="px-4 md:px-0 -mt-8 space-y-6">
           
           {/* Line Chart Section */}
           <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
              {/* Metric Toggles */}
              <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
                 {[
                   { id: 'sales', label: 'Sales', color: 'bg-seller-primary' },
                   { id: 'revenue', label: 'Revenue', color: 'bg-purple-600' },
                   { id: 'units', label: 'Units Sold', color: 'bg-indigo-600' }
                 ].map(m => (
                   <button 
                     key={m.id}
                     onClick={() => setActiveMetric(m.id)}
                     className={`flex items-center gap-2 whitespace-nowrap transition-all ${activeMetric === m.id ? 'opacity-100 scale-105' : 'opacity-40 grayscale'}`}
                   >
                      <div className={`w-2 h-2 rounded-full ${m.color}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{m.label}</span>
                   </button>
                 ))}
              </div>

              {/* Multi-Line Chart */}
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={activeMetric === 'sales' ? '#E36666' : activeMetric === 'revenue' ? '#9333EA' : '#4F46E5'} stopOpacity={0.2}/>
                             <stop offset="95%" stopColor={activeMetric === 'sales' ? '#E36666' : activeMetric === 'revenue' ? '#9333EA' : '#4F46E5'} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                       <XAxis 
                         dataKey="name" 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{fontSize: 9, fontWeight: 800, fill: '#94A3B8'}} 
                         dy={10}
                       />
                       <YAxis 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{fontSize: 9, fontWeight: 800, fill: '#94A3B8'}} 
                       />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey={activeMetric} 
                         stroke={activeMetric === 'sales' ? '#E36666' : activeMetric === 'revenue' ? '#9333EA' : '#4F46E5'} 
                         strokeWidth={4}
                         fillOpacity={1} 
                         fill="url(#colorMain)" 
                         animationDuration={1500}
                       />
                       {/* Ghost lines for context */}
                       <Area type="monotone" dataKey="sales" stroke="#E36666" strokeWidth={2} fill="none" opacity={activeMetric === 'sales' ? 0 : 0.1} />
                       <Area type="monotone" dataKey="revenue" stroke="#9333EA" strokeWidth={2} fill="none" opacity={activeMetric === 'revenue' ? 0 : 0.1} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Category Contribution (Donut Chart) */}
           <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 mb-6">Top Products Revenue</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="w-full h-48 md:h-56 max-w-[240px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                       <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Legend Custom */}
                 <div className="grid grid-cols-2 md:grid-cols-1 gap-4 w-full md:w-auto">
                    {pieData.map((item, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <div className="space-y-0.5">
                             <p className="text-[10px] font-black text-slate-900 leading-none">{item.name}</p>
                             <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">₹{item.value.toLocaleString()} Sales</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Best Selling Products */}
           <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900">Best-selling products</h3>
              
              <div className="space-y-4">
                 {bestSellers.map((product) => (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={product.id} 
                      className="flex items-center justify-between p-3 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group cursor-pointer"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                             <img src={product.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">{product.name}</h4>
                             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total {product.price}</p>
                             <div className="flex items-center gap-1.5 mt-1">
                                <Package size={10} className="text-amber-500" />
                                <span className="text-[10px] font-black text-slate-900">{product.rating} Sold</span>
                             </div>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-seller-primary group-hover:translate-x-1 transition-all" />
                    </motion.div>
                 ))}
              </div>
              
              <button 
                 onClick={handleGenerateReport}
                 className="w-full py-4 bg-seller-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-seller-primary/20 hover:bg-seller-dark transition-all"
              >
                 View Complete Report
              </button>
           </div>

        </div>
      </div>
    </PageWrapper>
  );
};

export default SalesReport;
