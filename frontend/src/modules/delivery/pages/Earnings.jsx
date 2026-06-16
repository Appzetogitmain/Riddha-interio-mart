import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import EarningsCard from '../components/EarningsCard';
import { 
  LuWallet, 
  LuTrendingUp, 
  LuCalendar, 
  LuAward, 
  LuFileText,
  LuActivity,
  LuPackage
} from 'react-icons/lu';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';

const Earnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const [analyticsRes, walletRes] = await Promise.all([
          api.get('/delivery/analytics'),
          api.get('/wallets/delivery/me')
        ]);
        
        if (analyticsRes.data.success && walletRes.data.success) {
          setAnalytics(analyticsRes.data.data);
          setWallet(walletRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load earnings data:', err);
        toast.error('Failed to load your earnings data.');
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-40">
          <div className="w-12 h-12 border-4 border-[#2A458A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageWrapper>
    );
  }

  // Calculate dynamic metrics
  const totalLifetime = wallet?.earningsBalance || 0;
  
  // Weekly chart data from backend telemetry
  const chartData = analytics?.charts?.revenueData?.map(d => ({
    day: d.name,
    income: d.value
  })) || [];

  // Derived stats
  const todayIncome = chartData.length > 0 ? chartData[chartData.length - 1].income : 0;
  const weeklyIncome = chartData.reduce((sum, curr) => sum + curr.income, 0);

  // Extract Ledger (Earnings History) from wallet transactions
  const ledger = (wallet?.transactions || [])
    .filter(t => t.type === 'delivery_fee_credit')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50); // Get last 50 deliveries

  const handleExport = () => {
    if (ledger.length === 0) {
      toast('No earnings data to export', { icon: '📊' });
      return;
    }
    const rows = [
      ['Date', 'Order ID', 'Description', 'Amount (₹)'],
      ...ledger.map(item => [
        new Date(item.createdAt).toLocaleDateString('en-IN'),
        item.referenceId ? item.referenceId.toString().slice(-8).toUpperCase() : 'N/A',
        (item.description || '').replace(/,/g, ' '),
        item.amount
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  return (
    <PageWrapper>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-8">

        {/* Financial Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#2A458A] rounded-full"></div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Your <span className="text-[#2A458A]">Earnings</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
               <LuActivity className="text-[#2A458A]" />
               Track your live delivery income
            </p>
          </div>
          
          <button onClick={handleExport} title="Export earnings as CSV" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all shadow-sm">
             <LuFileText size={14} />
             Export
          </button>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <EarningsCard 
            label="Today's Earnings" 
            value={todayIncome} 
            subtext={`${analytics?.charts?.performanceData?.[6]?.completed || 0} deliveries completed`}
            icon={LuWallet}
            trend={todayIncome > 0 ? 10 : 0}
          />
          <EarningsCard 
            label="This Week" 
            value={weeklyIncome} 
            subtext="Last 7 Days Rolling"
            icon={LuCalendar}
            trend={weeklyIncome > 0 ? 5 : 0}
          />
          <EarningsCard 
            label="Total Lifetime" 
            value={totalLifetime} 
            subtext="Available for withdrawal"
            icon={LuAward}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          
          {/* Income Velocity Chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <h3 className="text-slate-900 font-bold text-base">Weekly Earnings</h3>
                   <p className="text-slate-500 text-xs mt-0.5">Your income over the last 7 days</p>
                </div>
                <LuTrendingUp className="text-[#2A458A]" size={20} />
             </div>

             <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                   <BarChart data={chartData}>
                      <Tooltip 
                        cursor={{ fill: 'rgba(42, 69, 138, 0.05)' }}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                        itemStyle={{ color: '#2A458A', fontSize: '14px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="income" radius={[8, 8, 0, 0]}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2A458A' : '#e2e8f0'} />
                         ))}
                      </Bar>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} dy={10} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Commission Intelligence */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-[#2A458A]/10 rounded-xl flex items-center justify-center border border-[#2A458A]/20">
                      <LuTrendingUp className="text-[#2A458A]" size={20} />
                   </div>
                   <div>
                      <h3 className="text-slate-900 font-bold text-base">Current Balance</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Ready for payout</p>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                   <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Withdrawable</p>
                         <p className="text-2xl font-bold text-slate-900">₹{totalLifetime.toLocaleString()}</p>
                      </div>
                      <LuAward className="text-[#2A458A]" size={24} />
                   </div>

                   <div className="space-y-3 px-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                         <span className="text-slate-600">Pending Approvals</span>
                         <span className="text-slate-900">₹0.00</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                         <span className="text-slate-600">COD Liability</span>
                         <span className="text-rose-600">-₹{(wallet?.codCollectionLiability || 0).toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <button onClick={() => navigate('/delivery/wallet')} className="w-full mt-6 bg-[#2A458A] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#1f3366] transition-all shadow-sm">
                   Withdraw Earnings
                </button>
             </div>
          </div>
        </div>

        {/* Historical Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                 <h3 className="text-slate-900 font-bold text-base">Earnings History</h3>
                 <p className="text-slate-500 text-xs mt-0.5">Past payouts and delivery records</p>
              </div>
              <button
                onClick={() => navigate('/delivery/delivery-history')}
                title="Filter by date in Delivery History"
                className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-[#2A458A] hover:border-[#2A458A]/30 rounded-lg transition-all shadow-sm">
                 <LuCalendar size={16} />
              </button>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500">
                       <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Date</th>
                       <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Order ID</th>
                       <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">Description</th>
                       <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200 text-right">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {ledger.length > 0 ? (
                      ledger.map((item, idx) => {
                        const shortId = item.referenceId ? item.referenceId.toString().slice(-8).toUpperCase() : 'N/A';
                        let cleanDesc = item.description || '';
                        if (cleanDesc.includes('Delivery fee earning for Order')) {
                          cleanDesc = 'Delivery fee earning';
                        }
                        
                        return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3">
                             <span className="text-xs font-semibold text-slate-900">
                               {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </span>
                          </td>
                          <td className="px-5 py-3">
                             <div className="flex items-center gap-2">
                                <LuPackage size={14} className="text-slate-400 group-hover:text-[#2A458A] transition-colors" />
                                <span className="text-xs font-medium text-slate-700">#{shortId}</span>
                             </div>
                          </td>
                          <td className="px-5 py-3">
                             <span className="text-xs font-medium text-slate-500">{cleanDesc}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                             <span className="text-xs font-bold text-emerald-600">+₹{item.amount.toLocaleString()}</span>
                          </td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-xs font-semibold">
                          No recent earnings found. Start delivering to see your ledger!
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Earnings;
