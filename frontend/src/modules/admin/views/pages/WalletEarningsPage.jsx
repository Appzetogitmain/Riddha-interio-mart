import React, { useState, useMemo } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  LuTrendingUp, 
  LuWallet, 
  LuIndianRupee, 
  LuClock, 
  LuSearch, 
  LuChevronDown
} from 'react-icons/lu';
import { FiTrendingUp } from 'react-icons/fi';

const transactionData = [
  { 
    id: 1, 
    dateTime: '4/13/2026, 12:49:03 PM', 
    user: { name: 'palak patel', role: 'Delivery Boy' }, 
    type: 'Credit', 
    description: 'Delivery earning for order ORD1775911067366961', 
    amount: 20.00 
  },
  { 
    id: 2, 
    dateTime: '4/13/2026, 10:55:37 AM', 
    user: { name: 'palak patel', role: 'Delivery Boy' }, 
    type: 'Credit', 
    description: 'Delivery earning for order ORD1776057854998748', 
    amount: 12.50 
  },
  { 
    id: 3, 
    dateTime: '4/11/2026, 6:05:48 PM', 
    user: { name: 'palak patel', role: 'Delivery Boy' }, 
    type: 'Credit', 
    description: 'Delivery earning for order ORD1775910292886804', 
    amount: 17.00 
  },
  { 
    id: 4, 
    dateTime: '4/11/2026, 3:30:14 PM', 
    user: { name: 'palak patel', role: 'Delivery Boy' }, 
    type: 'Debit', 
    description: 'Payout to delivery boy bank account', 
    amount: -40.00 
  },
];

const WalletEarningsPage = () => {
  const [activeTab, setActiveTab] = useState('All Transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const filteredTransactions = useMemo(() => {
    return transactionData.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.user.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = userFilter === 'All Users' || 
                          (userFilter === 'Sellers' && tx.user.role === 'Seller') || 
                          (userFilter === 'Delivery Boys' && tx.user.role === 'Delivery Boy');
      
      const matchesType = typeFilter === 'All Types' || tx.type === typeFilter;

      return matchesSearch && matchesUser && matchesType;
    });
  }, [searchTerm, userFilter, typeFilter]);

  const stats = [
    { label: 'Total Platform Earning', value: '₹1,090.9', icon: LuTrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Current Platform Balance', value: '₹1,090.9', icon: LuWallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Admin Earning', value: '₹0', icon: LuIndianRupee, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Seller Pending Payouts', value: '₹0', icon: LuClock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Delivery Boy Pending Payouts', value: '₹0', icon: LuClock, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Pending from Delivery Boy (COD)', value: '₹219.05', icon: LuClock, color: 'text-amber-500', bg: 'bg-amber-100/50' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
            Admin Wallet & Finance
          </h1>
          <p className="text-warm-sand text-sm md:text-base">
            Manage transactions, track earnings, and process withdrawals.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{stat.label}</p>
                <h4 className="text-2xl font-black text-deep-espresso">{stat.value}</h4>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl border border-soft-oatmeal shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-soft-oatmeal overflow-x-auto scrollbar-hide">
            {[
              { name: 'All Transactions', icon: LuWallet },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-8 py-5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.name 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                  : 'border-transparent text-warm-sand hover:text-deep-espresso hover:bg-soft-oatmeal/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Table Toolbar */}
          <div className="p-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* User Selector */}
              <div className="relative group w-full md:w-48">
                <select 
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full appearance-none bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-2.5 text-xs font-bold text-deep-espresso focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                >
                  <option>All Users</option>
                  <option>Sellers</option>
                  <option>Delivery Boys</option>
                </select>
                <LuChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand pointer-events-none" size={14} />
              </div>

              {/* Type Selector */}
              <div className="relative group w-full md:w-40">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-2.5 text-xs font-bold text-deep-espresso focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                >
                  <option>All Types</option>
                  <option>Credit</option>
                  <option>Debit</option>
                </select>
                <LuChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand pointer-events-none" size={14} />
              </div>
            </div>

            <div className="flex-grow"></div>

            {/* Search (Optional, shown in prev design but kept for functionality) */}
            <div className="relative w-full md:w-64">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
              <input 
                type="text" 
                placeholder="Search description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soft-oatmeal/5 border-y border-soft-oatmeal">
                  <th className="px-8 py-4 text-[11px] font-black text-warm-sand uppercase tracking-widest">Date & Time</th>
                  <th className="px-8 py-4 text-[11px] font-black text-warm-sand uppercase tracking-widest text-center">User</th>
                  <th className="px-8 py-4 text-[11px] font-black text-warm-sand uppercase tracking-widest text-center">Type</th>
                  <th className="px-8 py-4 text-[11px] font-black text-warm-sand uppercase tracking-widest">Description</th>
                  <th className="px-8 py-4 text-[11px] font-black text-warm-sand uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                    <td className="px-8 py-5 text-xs font-medium text-deep-espresso/70">
                      {tx.dateTime}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-center">
                        <p className="text-sm font-black text-deep-espresso">{tx.user.name}</p>
                        <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{tx.user.role}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        tx.type === 'Credit' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-deep-espresso/60 leading-relaxed max-w-xs">
                      {tx.description}
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-sm ${tx.amount > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination Placeholder */}
          <div className="p-8 bg-soft-oatmeal/5 flex justify-center border-t border-soft-oatmeal">
             <p className="text-[10px] text-warm-sand font-bold uppercase tracking-[0.2em]">Showing latest transactions Dashboard Overview</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default WalletEarningsPage;
